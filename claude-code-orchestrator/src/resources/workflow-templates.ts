import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { OrchestratorMonitor } from "../orchestrator/monitor.js";
import { WORKFLOW_TEMPLATES, WorkflowExecution } from "../orchestrator/workflows.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:workflow-templates' });

/**
 * Register the workflow-templates resource with the MCP server
 * This resource provides information about available workflow templates
 * 
 * @param server - The MCP server instance
 * @param orchestrator - The orchestrator monitor instance
 */
export function registerWorkflowTemplatesResource(
  server: McpServer,
  orchestrator: OrchestratorMonitor
) {
  server.resource(
    "workflow-templates",
    "workflow-templates://all",
    async (uri) => {
      try {
        logger.debug("Getting workflow templates");
        
        // Get all templates
        const templates = WorkflowExecution.getAllTemplates();
        
        // Build a markdown representation of the templates
        let text = "# Workflow Templates\n\n";
        
        for (const template of templates) {
          text += `## ${template.name}\n\n`;
          text += `**ID**: \`${template.id}\`\n\n`;
          text += `**Description**: ${template.description}\n\n`;
          
          text += "**Steps**:\n\n";
          for (let i = 0; i < template.steps.length; i++) {
            const step = template.steps[i];
            text += `${i + 1}. **${step.task}**\n`;
            text += `   - Role: ${step.role}\n`;
            text += `   - Priority: ${step.priority}\n`;
            
            if (step.dependencies && step.dependencies.length > 0) {
              text += `   - Dependencies: Steps ${step.dependencies.map(d => d + 1).join(', ')}\n`;
            }
            
            text += "\n";
          }
          
          text += "---\n\n";
        }
        
        return {
          contents: [{
            uri: uri.href,
            text: text,
            mimeType: "text/markdown"
          }]
        };
      } catch (error) {
        logger.error("Failed to get workflow templates", error);
        throw new Error(`Failed to get workflow templates: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
  
  // Individual template resource
  server.resource(
    "workflow-template",
    "workflow-templates://:templateId",
    async (uri) => {
      try {
        // Extract template ID from the URI
        const templateId = uri.pathname.substring(1); // Remove leading slash
        if (!templateId) {
          throw new Error("Template ID is required");
        }
        
        logger.debug(`Getting workflow template for ${templateId}`);
        
        // Get the template
        const template = WorkflowExecution.getTemplate(templateId);
        
        if (!template) {
          throw new Error(`Template not found: ${templateId}`);
        }
        
        // Build a markdown representation of the template
        let text = `# ${template.name} Workflow\n\n`;
        text += `**ID**: \`${template.id}\`\n\n`;
        text += `**Description**: ${template.description}\n\n`;
        
        text += "## Workflow Steps\n\n";
        
        for (let i = 0; i < template.steps.length; i++) {
          const step = template.steps[i];
          text += `### Step ${i + 1}: ${step.task}\n\n`;
          text += `- **Role**: ${step.role}\n`;
          text += `- **Priority**: ${step.priority}\n`;
          
          if (step.dependencies && step.dependencies.length > 0) {
            text += `- **Dependencies**: Steps ${step.dependencies.map(d => d + 1).join(', ')}\n`;
          }
          
          text += "\n";
        }
        
        text += "## Usage\n\n";
        text += "To execute this workflow, use the `create-workflow` tool with the following parameters:\n\n";
        text += "```json\n";
        text += `{\n  "templateId": "${template.id}",\n  "workingDirectory": "/path/to/your/project"\n}\n`;
        text += "```\n";
        
        return {
          contents: [{
            uri: uri.href,
            text: text,
            mimeType: "text/markdown"
          }]
        };
      } catch (error) {
        logger.error("Failed to get workflow template", error);
        throw new Error(`Failed to get workflow template: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
  
  logger.debug("Registered workflow-templates resource");
}