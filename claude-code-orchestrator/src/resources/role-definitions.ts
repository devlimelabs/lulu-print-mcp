import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { OrchestratorMonitor } from "../orchestrator/monitor.js";
import { AgentRole, AGENT_ROLES, getAllRoles } from "../orchestrator/roles.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:role-definitions' });

/**
 * Register the role-definitions resource with the MCP server
 * This resource provides information about available agent roles
 * 
 * @param server - The MCP server instance
 * @param orchestrator - The orchestrator monitor instance
 */
export function registerRoleDefinitionsResource(
  server: McpServer,
  orchestrator: OrchestratorMonitor
) {
  server.resource(
    "role-definitions",
    "role-definitions://all",
    async (uri) => {
      try {
        logger.debug("Getting role definitions");
        
        // Get all roles
        const roles = getAllRoles();
        
        // Build a markdown representation of the roles
        let text = "# Agent Role Definitions\n\n";
        
        for (const role of roles) {
          text += `## ${role.name}\n\n`;
          text += `**ID**: \`${role.id}\`\n\n`;
          text += `**Description**: ${role.description}\n\n`;
          text += "**Tasks**:\n";
          for (const task of role.tasks) {
            text += `- ${task}\n`;
          }
          text += "\n";
          text += "**Prompt Prefix**:\n";
          text += `> ${role.promptPrefix}\n\n`;
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
        logger.error("Failed to get role definitions", error);
        throw new Error(`Failed to get role definitions: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
  
  // Individual role resource
  server.resource(
    "role-definition",
    "role-definitions://:roleId",
    async (uri) => {
      try {
        // Extract role ID from the URI
        const roleId = uri.pathname.substring(1); // Remove leading slash
        if (!roleId) {
          throw new Error("Role ID is required");
        }
        
        logger.debug(`Getting role definition for ${roleId}`);
        
        // Get the role
        const normalizedRoleId = roleId.toUpperCase();
        const role = AGENT_ROLES[normalizedRoleId];
        
        if (!role) {
          throw new Error(`Role not found: ${roleId}`);
        }
        
        // Build a markdown representation of the role
        const text = `# ${role.name} Role\n\n` +
          `**ID**: \`${role.id}\`\n\n` +
          `**Description**: ${role.description}\n\n` +
          "**Tasks**:\n" +
          role.tasks.map(task => `- ${task}`).join('\n') +
          "\n\n" +
          "**Prompt Prefix**:\n" +
          `> ${role.promptPrefix}\n\n`;
        
        return {
          contents: [{
            uri: uri.href,
            text: text,
            mimeType: "text/markdown"
          }]
        };
      } catch (error) {
        logger.error("Failed to get role definition", error);
        throw new Error(`Failed to get role definition: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
  
  logger.debug("Registered role-definitions resource");
}