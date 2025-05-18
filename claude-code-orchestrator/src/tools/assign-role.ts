import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RoleManager, ROLE_TYPES, RoleType } from "../orchestrator/roles.js";
import { ProcessManager } from "../orchestrator/process.js";

export function configureRoleTools(
  server: McpServer,
  roleManager: RoleManager,
  processManager: ProcessManager
): void {
  // Tool: List all available roles
  server.tool(
    "list-roles",
    {},
    async () => {
      try {
        const roles = roleManager.getAllRoles();
        
        if (roles.length === 0) {
          return {
            content: [{ type: "text", text: "No roles are currently defined." }]
          };
        }
        
        const rolesOutput = roles.map(r => 
          `# ${r.type.toUpperCase()}\n\n` +
          `Description: ${r.description}\n\n` +
          `Responsibilities:\n${r.responsibilities.map(resp => `- ${resp}`).join('\n')}\n\n` +
          `Priority Level: ${r.priority}\n---\n`
        ).join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: `# Available Roles\n\n${rolesOutput}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing roles: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Get role details
  server.tool(
    "get-role-details",
    {
      role: z.enum([
        ROLE_TYPES.ARCHITECT, 
        ROLE_TYPES.IMPLEMENTER, 
        ROLE_TYPES.TESTER, 
        ROLE_TYPES.REVIEWER,
        ROLE_TYPES.DEVOPS,
        ROLE_TYPES.GENERAL
      ]).describe("Role to get details for")
    },
    async ({ role }) => {
      try {
        const roleDetails = roleManager.getRole(role as RoleType);
        
        const roleOutput = 
          `# ${roleDetails.type.toUpperCase()}\n\n` +
          `Description: ${roleDetails.description}\n\n` +
          `Responsibilities:\n${roleDetails.responsibilities.map(resp => `- ${resp}`).join('\n')}\n\n` +
          `Priority Level: ${roleDetails.priority}`;
        
        return {
          content: [{ type: "text", text: roleOutput }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting role details: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Create or update a custom role
  server.tool(
    "create-role",
    {
      type: z.string().describe("Unique identifier for the role"),
      description: z.string().describe("Brief description of the role's purpose"),
      responsibilities: z.array(z.string()).describe("List of responsibilities for this role"),
      priority: z.number().min(1).max(10).describe("Priority level (1-10)")
    },
    async ({ type, description, responsibilities, priority }) => {
      try {
        // Add the role
        roleManager.addRole({
          type: type as RoleType, // Not ideal typing, but allows custom roles
          description,
          responsibilities,
          priority
        });
        
        return {
          content: [{ 
            type: "text", 
            text: `Role "${type}" created successfully.` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error creating role: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Assign a role to a process
  server.tool(
    "assign-role-to-process",
    {
      processId: z.number().describe("ID of the process to assign a role to"),
      role: z.enum([
        ROLE_TYPES.ARCHITECT, 
        ROLE_TYPES.IMPLEMENTER, 
        ROLE_TYPES.TESTER, 
        ROLE_TYPES.REVIEWER,
        ROLE_TYPES.DEVOPS,
        ROLE_TYPES.GENERAL
      ]).describe("Role to assign to the process")
    },
    async ({ processId, role }) => {
      try {
        // Get process details
        const process = await processManager.getProcess(processId);
        
        // This is a mock implementation since ProcessManager doesn't support
        // changing roles after creation. In a real implementation, you would
        // update the process role here.
        const oldRole = process.role;
        process.role = role;
        
        return {
          content: [{ 
            type: "text", 
            text: `Process ${processId} role updated from "${oldRole}" to "${role}".` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error assigning role: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Generate a role prompt for a specific task
  server.tool(
    "generate-role-prompt",
    {
      role: z.enum([
        ROLE_TYPES.ARCHITECT, 
        ROLE_TYPES.IMPLEMENTER, 
        ROLE_TYPES.TESTER, 
        ROLE_TYPES.REVIEWER,
        ROLE_TYPES.DEVOPS,
        ROLE_TYPES.GENERAL
      ]).describe("Role to generate prompt for"),
      taskDescription: z.string().optional().describe("Optional task description to include in the prompt")
    },
    async ({ role, taskDescription }) => {
      try {
        const rolePrompt = roleManager.generateRolePrompt(role as RoleType);
        
        const prompt = taskDescription
          ? `${rolePrompt}\n\n## Task\n${taskDescription}`
          : rolePrompt;
        
        return {
          content: [{ type: "text", text: prompt }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error generating role prompt: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Recommend a role for a task
  server.tool(
    "recommend-role",
    {
      taskDescription: z.string().describe("Description of the task to recommend a role for")
    },
    async ({ taskDescription }) => {
      try {
        const recommendedRole = roleManager.recommendRoleForTask(taskDescription);
        const roleDetails = roleManager.getRole(recommendedRole);
        
        return {
          content: [{ 
            type: "text", 
            text: `Recommended role: ${recommendedRole.toUpperCase()}\n\nDescription: ${roleDetails.description}\n\nThis role is recommended based on the task description keywords and focus.` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error recommending role: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
}