import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProcessManager } from "../orchestrator/process.js";
import { QueueManager } from "../orchestrator/queue.js";
import { MonitorService } from "../orchestrator/monitor.js";

// Configuration interface
interface OrchestratorConfig {
  // Process settings
  maxConcurrentProcesses: number;
  processTimeoutMs: number;
  interactionTimeoutMs: number;
  
  // Path settings
  claudeCodeMcpPath: string;
  
  // System settings
  monitoringIntervalMs: number;
  autoStartNextTask: boolean;
}

// Default configuration
const DEFAULT_CONFIG: OrchestratorConfig = {
  maxConcurrentProcesses: 4,
  processTimeoutMs: 30 * 60 * 1000, // 30 minutes
  interactionTimeoutMs: 10 * 60 * 1000, // 10 minutes
  claudeCodeMcpPath: "",
  monitoringIntervalMs: 5000, // 5 seconds
  autoStartNextTask: true
};

// Current configuration
let currentConfig: OrchestratorConfig = { ...DEFAULT_CONFIG };

export function configureOrchestratorTools(
  server: McpServer, 
  processManager: ProcessManager,
  queueManager: QueueManager,
  monitorService: MonitorService
): void {
  // Tool: Get current configuration
  server.tool(
    "get-orchestrator-config",
    {},
    async () => {
      try {
        // Format timeouts to be more readable
        const formatTime = (ms: number) => {
          if (ms >= 60 * 1000) {
            return `${ms / (60 * 1000)} minutes`;
          } else {
            return `${ms / 1000} seconds`;
          }
        };
        
        const configOutput = 
          `# Claude Orchestra Configuration\n\n` +
          `## Process Settings\n` +
          `Max Concurrent Processes: ${currentConfig.maxConcurrentProcesses}\n` +
          `Process Timeout: ${formatTime(currentConfig.processTimeoutMs)}\n` +
          `Interaction Timeout: ${formatTime(currentConfig.interactionTimeoutMs)}\n\n` +
          `## Path Settings\n` +
          `Claude Code MCP Path: ${currentConfig.claudeCodeMcpPath || "(not set)"}\n\n` +
          `## System Settings\n` +
          `Monitoring Interval: ${formatTime(currentConfig.monitoringIntervalMs)}\n` +
          `Auto-Start Next Task: ${currentConfig.autoStartNextTask ? "Enabled" : "Disabled"}`;
        
        return {
          content: [{ type: "text", text: configOutput }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting configuration: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Update orchestrator configuration
  server.tool(
    "configure-orchestrator",
    {
      maxConcurrentProcesses: z.number().min(1).max(16).optional().describe("Maximum number of concurrent processes (1-16)"),
      processTimeoutMinutes: z.number().min(1).max(120).optional().describe("Process timeout in minutes (1-120)"),
      interactionTimeoutMinutes: z.number().min(1).max(60).optional().describe("Interaction timeout in minutes (1-60)"),
      claudeCodeMcpPath: z.string().optional().describe("Path to Claude Code MCP executable"),
      monitoringIntervalSeconds: z.number().min(1).max(60).optional().describe("Monitoring interval in seconds (1-60)"),
      autoStartNextTask: z.boolean().optional().describe("Automatically start next task when capacity is available")
    },
    async ({ maxConcurrentProcesses, processTimeoutMinutes, interactionTimeoutMinutes, claudeCodeMcpPath, monitoringIntervalSeconds, autoStartNextTask }) => {
      try {
        let changes: string[] = [];
        
        // Apply changes to configuration
        if (maxConcurrentProcesses !== undefined) {
          changes.push(`Max concurrent processes: ${currentConfig.maxConcurrentProcesses} → ${maxConcurrentProcesses}`);
          currentConfig.maxConcurrentProcesses = maxConcurrentProcesses;
        }
        
        if (processTimeoutMinutes !== undefined) {
          const newValue = processTimeoutMinutes * 60 * 1000;
          changes.push(`Process timeout: ${currentConfig.processTimeoutMs / (60 * 1000)} minutes → ${processTimeoutMinutes} minutes`);
          currentConfig.processTimeoutMs = newValue;
        }
        
        if (interactionTimeoutMinutes !== undefined) {
          const newValue = interactionTimeoutMinutes * 60 * 1000;
          changes.push(`Interaction timeout: ${currentConfig.interactionTimeoutMs / (60 * 1000)} minutes → ${interactionTimeoutMinutes} minutes`);
          currentConfig.interactionTimeoutMs = newValue;
        }
        
        if (claudeCodeMcpPath !== undefined) {
          changes.push(`Claude Code MCP path: ${currentConfig.claudeCodeMcpPath || "(not set)"} → ${claudeCodeMcpPath}`);
          currentConfig.claudeCodeMcpPath = claudeCodeMcpPath;
        }
        
        if (monitoringIntervalSeconds !== undefined) {
          const newValue = monitoringIntervalSeconds * 1000;
          changes.push(`Monitoring interval: ${currentConfig.monitoringIntervalMs / 1000} seconds → ${monitoringIntervalSeconds} seconds`);
          currentConfig.monitoringIntervalMs = newValue;
          
          // Restart monitoring with new interval
          monitorService.stopMonitoring();
          monitorService.startMonitoring(newValue);
        }
        
        if (autoStartNextTask !== undefined) {
          changes.push(`Auto-start next task: ${currentConfig.autoStartNextTask ? "Enabled" : "Disabled"} → ${autoStartNextTask ? "Enabled" : "Disabled"}`);
          currentConfig.autoStartNextTask = autoStartNextTask;
        }
        
        if (changes.length === 0) {
          return {
            content: [{ type: "text", text: "No configuration changes made." }]
          };
        }
        
        return {
          content: [{ 
            type: "text", 
            text: `# Configuration Updated\n\nThe following changes were applied:\n\n${changes.map(c => `- ${c}`).join('\n')}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error updating configuration: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Reset configuration to defaults
  server.tool(
    "reset-orchestrator-config",
    {},
    async () => {
      try {
        // Save current config to show changes
        const oldConfig = { ...currentConfig };
        
        // Reset to defaults
        currentConfig = { ...DEFAULT_CONFIG };
        
        // Update monitor interval if needed
        if (oldConfig.monitoringIntervalMs !== DEFAULT_CONFIG.monitoringIntervalMs) {
          monitorService.stopMonitoring();
          monitorService.startMonitoring(DEFAULT_CONFIG.monitoringIntervalMs);
        }
        
        return {
          content: [{ 
            type: "text", 
            text: `Configuration reset to default values.` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error resetting configuration: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Expose the config for other tools to access
  return currentConfig;
}