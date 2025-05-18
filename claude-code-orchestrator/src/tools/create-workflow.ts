import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WorkflowManager, WorkflowTask } from "../orchestrator/workflows.js";
import { RoleManager, ROLE_TYPES, RoleType } from "../orchestrator/roles.js";
import { PRIORITY, PriorityLevel } from "../orchestrator/queue.js";

export function configureWorkflowTools(
  server: McpServer,
  workflowManager: WorkflowManager,
  roleManager: RoleManager
): void {
  // Tool: List all available workflow templates
  server.tool(
    "list-workflow-templates",
    {},
    async () => {
      try {
        const templates = workflowManager.getAllTemplates();
        
        if (templates.length === 0) {
          return {
            content: [{ type: "text", text: "No workflow templates are currently defined." }]
          };
        }
        
        const templatesOutput = templates.map(t => 
          `## ${t.name}\n\n` +
          `ID: ${t.id}\n` +
          `Description: ${t.description}\n` +
          `Number of Tasks: ${t.tasks.length}\n---\n`
        ).join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: `# Available Workflow Templates\n\n${templatesOutput}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing workflow templates: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Get workflow template details
  server.tool(
    "get-workflow-details",
    {
      templateId: z.string().describe("ID of the workflow template to get details for")
    },
    async ({ templateId }) => {
      try {
        const template = workflowManager.getTemplate(templateId);
        
        const tasksOutput = template.tasks.map((task, index) => {
          const dependenciesStr = task.dependencies && task.dependencies.length > 0
            ? `Dependencies: Tasks ${task.dependencies.map(d => `#${d+1}`).join(', ')}\n`
            : 'Dependencies: None\n';
          
          return `### Task ${index + 1}\n\n` +
                 `Description: ${task.description}\n` +
                 `Role: ${task.role}\n` +
                 `Priority: ${task.priority === PRIORITY.HIGH ? "High" : task.priority === PRIORITY.MEDIUM ? "Medium" : "Low"}\n` +
                 dependenciesStr;
        }).join('\n---\n');
        
        const templateOutput = 
          `# Workflow: ${template.name}\n\n` +
          `ID: ${template.id}\n` +
          `Description: ${template.description}\n\n` +
          `## Tasks\n\n${tasksOutput}`;
        
        return {
          content: [{ type: "text", text: templateOutput }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting workflow details: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Create a new workflow template
  server.tool(
    "create-workflow-template",
    {
      id: z.string().describe("Unique identifier for the template"),
      name: z.string().describe("Name of the workflow template"),
      description: z.string().describe("Description of the workflow purpose"),
      tasks: z.array(z.object({
        description: z.string().describe("Description of the task"),
        role: z.enum([
          ROLE_TYPES.ARCHITECT, 
          ROLE_TYPES.IMPLEMENTER, 
          ROLE_TYPES.TESTER, 
          ROLE_TYPES.REVIEWER,
          ROLE_TYPES.DEVOPS,
          ROLE_TYPES.GENERAL
        ]).describe("Role for this task"),
        priority: z.enum(["high", "medium", "low"]).describe("Priority level for this task"),
        dependencies: z.array(z.number()).optional().describe("Indices of tasks this task depends on (0-based)")
      })).describe("List of tasks in this workflow")
    },
    async ({ id, name, description, tasks }) => {
      try {
        // Validate roles
        for (const task of tasks) {
          if (!roleManager.hasRole(task.role as RoleType)) {
            return {
              isError: true,
              content: [{ type: "text", text: `Error creating workflow template: Role "${task.role}" is not defined.` }]
            };
          }
        }
        
        // Convert task format
        const workflowTasks: WorkflowTask[] = tasks.map(task => ({
          description: task.description,
          role: task.role as RoleType,
          priority: task.priority === "high" ? PRIORITY.HIGH : 
                   task.priority === "medium" ? PRIORITY.MEDIUM : PRIORITY.LOW,
          dependencies: task.dependencies
        }));
        
        // Create the workflow template
        workflowManager.addTemplate({
          id,
          name,
          description,
          tasks: workflowTasks
        });
        
        return {
          content: [{ 
            type: "text", 
            text: `Workflow template "${name}" created successfully with ID: ${id}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error creating workflow template: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Check task dependencies
  server.tool(
    "check-task-dependencies",
    {
      templateId: z.string().describe("ID of the workflow template"),
      completedTaskIndices: z.array(z.number()).describe("Indices of tasks that have been completed (0-based)")
    },
    async ({ templateId, completedTaskIndices }) => {
      try {
        // Get the next available tasks
        const availableTasks = workflowManager.getNextAvailableTasks(templateId, completedTaskIndices);
        
        if (availableTasks.length === 0) {
          // Check if all tasks are completed
          const template = workflowManager.getTemplate(templateId);
          if (completedTaskIndices.length === template.tasks.length) {
            return {
              content: [{ type: "text", text: `All tasks in workflow "${template.name}" are completed.` }]
            };
          } else {
            return {
              content: [{ type: "text", text: `No tasks are currently available. There may be dependency issues.` }]
            };
          }
        }
        
        const tasksOutput = availableTasks.map((task, index) => 
          `### Next Task ${index + 1}\n\n` +
          `Description: ${task.description}\n` +
          `Role: ${task.role}\n` +
          `Priority: ${task.priority === PRIORITY.HIGH ? "High" : task.priority === PRIORITY.MEDIUM ? "Medium" : "Low"}\n`
        ).join('\n---\n');
        
        return {
          content: [{ 
            type: "text", 
            text: `# Available Tasks\n\nThe following tasks can be started based on completed dependencies:\n\n${tasksOutput}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error checking task dependencies: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
}