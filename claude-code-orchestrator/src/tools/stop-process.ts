import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProcessManager, PROCESS_STATE } from "../orchestrator/process.js";

export function configureProcessControlTools(server: McpServer, processManager: ProcessManager): void {
  // Tool: Terminate a process
  server.tool(
    "stop-process",
    {
      processId: z.number().describe("ID of the process to terminate")
    },
    async ({ processId }) => {
      try {
        // Get process info first for the confirmation message
        const processInfo = await processManager.getProcess(processId);
        
        // Terminate the process
        const result = await processManager.terminateProcess(processId);
        
        return {
          content: [{ 
            type: "text", 
            text: `Process ${processId} terminated successfully.\nTask: ${processInfo.taskDescription}\nRole: ${processInfo.role}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error stopping process: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Terminate all processes of a specific state
  server.tool(
    "stop-processes-by-state",
    {
      state: z.enum([
        PROCESS_STATE.RUNNING,
        PROCESS_STATE.WAITING_FOR_INPUT,
        PROCESS_STATE.IDLE,
        PROCESS_STATE.FAILED
      ]).describe("State of processes to terminate")
    },
    async ({ state }) => {
      try {
        // Get all processes with the specified state
        const processes = await processManager.getAllProcesses();
        const targetProcesses = processes.filter(p => p.state === state);
        
        if (targetProcesses.length === 0) {
          return {
            content: [{ type: "text", text: `No processes found with state: ${state}` }]
          };
        }
        
        // Terminate each process
        const results = [];
        for (const process of targetProcesses) {
          try {
            await processManager.terminateProcess(process.id);
            results.push({
              id: process.id,
              success: true
            });
          } catch (error) {
            results.push({
              id: process.id,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
        
        // Count successes and failures
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        return {
          content: [{ 
            type: "text", 
            text: `Terminated ${successful} processes with state "${state}".\n${failed > 0 ? `Failed to terminate ${failed} processes.` : ''}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error stopping processes: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Terminate all processes by role
  server.tool(
    "stop-processes-by-role",
    {
      role: z.string().describe("Role of processes to terminate")
    },
    async ({ role }) => {
      try {
        // Get all processes with the specified role
        const processes = await processManager.getAllProcesses();
        const targetProcesses = processes.filter(p => p.role === role);
        
        if (targetProcesses.length === 0) {
          return {
            content: [{ type: "text", text: `No processes found with role: ${role}` }]
          };
        }
        
        // Terminate each process
        const results = [];
        for (const process of targetProcesses) {
          try {
            await processManager.terminateProcess(process.id);
            results.push({
              id: process.id,
              success: true
            });
          } catch (error) {
            results.push({
              id: process.id,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
        
        // Count successes and failures
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        return {
          content: [{ 
            type: "text", 
            text: `Terminated ${successful} processes with role "${role}".\n${failed > 0 ? `Failed to terminate ${failed} processes.` : ''}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error stopping processes: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Stop all processes
  server.tool(
    "stop-all-processes",
    {
      confirm: z.boolean().describe("Confirmation to stop all processes")
    },
    async ({ confirm }) => {
      if (!confirm) {
        return {
          content: [{ 
            type: "text", 
            text: `Operation cancelled. Please set confirm=true to stop all processes.` 
          }]
        };
      }
      
      try {
        // Get all processes
        const processes = await processManager.getAllProcesses();
        
        if (processes.length === 0) {
          return {
            content: [{ type: "text", text: `No processes found to terminate.` }]
          };
        }
        
        // Terminate each process
        const results = [];
        for (const process of processes) {
          try {
            await processManager.terminateProcess(process.id);
            results.push({
              id: process.id,
              success: true
            });
          } catch (error) {
            results.push({
              id: process.id,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
        
        // Count successes and failures
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        return {
          content: [{ 
            type: "text", 
            text: `Terminated ${successful} processes.\n${failed > 0 ? `Failed to terminate ${failed} processes.` : ''}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error stopping all processes: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
}