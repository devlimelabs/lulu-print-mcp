import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ProcessManager, PROCESS_STATE } from "../orchestrator/process.js";
import { QueueManager } from "../orchestrator/queue.js";
import { MonitorService } from "../orchestrator/monitor.js";

export function configureDashboardTools(
  server: McpServer,
  processManager: ProcessManager,
  queueManager: QueueManager,
  monitorService: MonitorService
): void {
  // Tool: Full system dashboard
  server.tool(
    "dashboard",
    {},
    async () => {
      try {
        // Get data from all services
        const [processes, queueStats, systemState] = await Promise.all([
          processManager.getAllProcesses(),
          queueManager.getQueueStats(),
          monitorService.getSystemState()
        ]);
        
        // System Status
        const statusOutput = 
          `# Claude Orchestra Dashboard\n\n` +
          `## System Status\n\n` +
          `- Total Processes: ${systemState.totalProcesses}\n` +
          `- Running: ${systemState.running}\n` +
          `- Waiting for Input: ${systemState.waiting}\n` +
          `- Completed: ${systemState.completed}\n` +
          `- Failed: ${systemState.failed}\n\n`;
        
        // Queue Status
        const queueOutput = 
          `## Queue Status\n\n` +
          `- Total Tasks: ${queueStats.totalTasks}\n` +
          `- Unassigned Tasks: ${queueStats.unassignedTasks}\n` +
          `- Assigned Tasks: ${queueStats.assignedTasks}\n` +
          `- High Priority Tasks: ${queueStats.highPriorityTasks}\n` +
          `- Medium Priority Tasks: ${queueStats.mediumPriorityTasks}\n` +
          `- Low Priority Tasks: ${queueStats.lowPriorityTasks}\n\n`;
        
        // Active Processes
        const activeProcesses = processes.filter(p => 
          p.state === PROCESS_STATE.RUNNING || p.state === PROCESS_STATE.WAITING_FOR_INPUT
        );
        
        let activeProcessesOutput = `## Active Processes\n\n`;
        
        if (activeProcesses.length === 0) {
          activeProcessesOutput += "No active processes.\n\n";
        } else {
          activeProcessesOutput += activeProcesses.map(p => 
            `### Process ${p.id}\n\n` +
            `- Task: ${p.taskDescription}\n` +
            `- Role: ${p.role}\n` +
            `- State: ${p.state}\n` +
            `- Priority: ${p.priority}\n` +
            `- Started: ${new Date(p.startedAt).toLocaleString()}\n` +
            `- Last Activity: ${new Date(p.lastUpdated).toLocaleString()}\n`
          ).join('\n');
        }
        
        // Waiting Processes (important to highlight)
        const waitingProcesses = processes.filter(p => p.state === PROCESS_STATE.WAITING_FOR_INPUT);
        
        let waitingProcessesOutput = `## Processes Waiting for Input\n\n`;
        
        if (waitingProcesses.length === 0) {
          waitingProcessesOutput += "No processes waiting for input.\n\n";
        } else {
          waitingProcessesOutput += waitingProcesses.map(p => 
            `### Process ${p.id}\n\n` +
            `- Task: ${p.taskDescription}\n` +
            `- Role: ${p.role}\n` +
            `- Priority: ${p.priority}\n` +
            `- Waiting since: ${new Date(p.lastUpdated).toLocaleString()}\n`
          ).join('\n');
        }
        
        // Recent Completions
        const recentCompletions = processes
          .filter(p => p.state === PROCESS_STATE.COMPLETED)
          .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
          .slice(0, 5);
        
        let completionsOutput = `## Recent Completions\n\n`;
        
        if (recentCompletions.length === 0) {
          completionsOutput += "No recent completions.\n\n";
        } else {
          completionsOutput += recentCompletions.map(p => 
            `- Process ${p.id}: ${p.taskDescription} (${p.role})\n`
          ).join('');
        }
        
        // Combine all sections
        return {
          content: [{ 
            type: "text", 
            text: statusOutput + queueOutput + waitingProcessesOutput + activeProcessesOutput + completionsOutput
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error generating dashboard: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Get system utilization metrics
  server.tool(
    "system-metrics",
    {},
    async () => {
      try {
        // Get data from all services
        const [processes, queueStats, systemState] = await Promise.all([
          processManager.getAllProcesses(),
          queueManager.getQueueStats(),
          monitorService.getSystemState()
        ]);
        
        // Calculate time-based metrics
        const now = new Date();
        
        // Calculate average process duration for completed processes
        const completedProcesses = processes.filter(p => p.state === PROCESS_STATE.COMPLETED);
        let avgDuration = 0;
        
        if (completedProcesses.length > 0) {
          const durations = completedProcesses.map(p => 
            new Date(p.lastUpdated).getTime() - new Date(p.startedAt).getTime()
          );
          avgDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
        }
        
        // Format duration
        const formatDuration = (ms: number) => {
          if (ms === 0) return "0s";
          
          const seconds = Math.floor((ms / 1000) % 60);
          const minutes = Math.floor((ms / (1000 * 60)) % 60);
          const hours = Math.floor(ms / (1000 * 60 * 60));
          
          const parts = [];
          if (hours > 0) parts.push(`${hours}h`);
          if (minutes > 0) parts.push(`${minutes}m`);
          if (seconds > 0) parts.push(`${seconds}s`);
          
          return parts.join(' ');
        };
        
        // Calculate average wait time for processes that were waiting
        const processesWithWaiting = processes.filter(p => 
          p.state === PROCESS_STATE.COMPLETED && p.lastUpdated !== p.startedAt
        );
        let avgWaitTime = 0;
        
        if (processesWithWaiting.length > 0) {
          // This is a rough approximation since we don't track actual wait times
          const waitTimes = processesWithWaiting.map(p => 
            (new Date(p.lastUpdated).getTime() - new Date(p.startedAt).getTime()) * 0.3
          );
          avgWaitTime = waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;
        }
        
        // Calculate throughput (processes completed per hour)
        const last24Hours = now.getTime() - (24 * 60 * 60 * 1000);
        const completedLast24Hours = completedProcesses.filter(p => 
          new Date(p.lastUpdated).getTime() > last24Hours
        ).length;
        
        const throughput = completedLast24Hours / 24;
        
        // Build metrics output
        const metricsOutput = 
          `# System Metrics\n\n` +
          `## Process Metrics\n\n` +
          `- Active Processes: ${systemState.running + systemState.waiting}\n` +
          `- Process Completion Rate: ${throughput.toFixed(2)} per hour\n` +
          `- Average Process Duration: ${formatDuration(avgDuration)}\n` +
          `- Average Wait Time: ${formatDuration(avgWaitTime)}\n\n` +
          
          `## Queue Metrics\n\n` +
          `- Queue Size: ${queueStats.totalTasks}\n` +
          `- Queue Utilization: ${queueStats.assignedTasks} / ${queueStats.totalTasks} (${
            queueStats.totalTasks > 0 ? Math.round((queueStats.assignedTasks / queueStats.totalTasks) * 100) : 0
          }%)\n\n` +
          
          `## Role Distribution\n\n`;
        
        // Role distribution
        const roleDistribution = Object.entries(queueStats.roleDistribution)
          .map(([role, count]) => `- ${role}: ${count} tasks`)
          .join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: metricsOutput + roleDistribution
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error generating system metrics: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
}