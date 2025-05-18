#!/usr/bin/env node
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import { createServer } from "net";

const execAsync = promisify(exec);

// Create server with clear naming
const server = new McpServer({
  name: "MCPTroubleshooter",
  version: "1.0.0"
});

// Utility functions
const getPlatformSpecificPath = () => {
  const platform = os.platform();
  if (platform === "win32") {
    return path.join(os.homedir(), "AppData", "Roaming", "Claude");
  } else if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Claude");
  } else {
    return path.join(os.homedir(), ".config", "Claude");
  }
};

const getLogDirectory = () => {
  const platform = os.platform();
  if (platform === "win32") {
    return path.join(os.homedir(), "AppData", "Roaming", "Claude", "logs");
  } else if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Logs", "Claude");
  } else {
    return path.join(os.homedir(), ".local", "share", "Claude", "logs");
  }
};

const configPath = path.join(getPlatformSpecificPath(), "claude_desktop_config.json");
const logDirectory = getLogDirectory();

// Common MCP error patterns to search for
const errorPatterns = [
  { pattern: "ENOENT", description: "File not found error - Check paths in configuration" },
  { pattern: "EACCES", description: "Permission denied - Check file/directory permissions" },
  { pattern: "SyntaxError", description: "JSON syntax error in configuration file" },
  { pattern: "connection refused", description: "Connection refused - Server might not be running" },
  { pattern: "initialization", description: "MCP initialization issues" },
  { pattern: "spawn", description: "Process spawning issues - Check executable paths" },
  { pattern: "command not found", description: "Command not found - Check if dependencies are installed" },
  { pattern: "transport", description: "Transport-related issues" },
  { pattern: "timeout", description: "Connection timeout - Check server responsiveness" }
];

// ----------------------
// LOG MANAGEMENT TOOLS
// ----------------------

// Read MCP logs
server.tool(
  "read-mcp-logs",
  {
    lines: z.number().optional().default(100).describe("Number of lines to read from the end"),
    serverName: z.string().optional().describe("Specific server name to filter logs for")
  },
  async ({ lines, serverName }) => {
    try {
      // Ensure log directory exists
      try {
        await fs.access(logDirectory);
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Log directory not found at ${logDirectory}. Claude Desktop might not be installed or hasn't generated logs yet.` }]
        };
      }

      // Get all log files
      const files = await fs.readdir(logDirectory);
      
      // Filter for MCP logs
      const mcpLogs = files.filter(file => file.startsWith("mcp"));
      
      if (mcpLogs.length === 0) {
        return {
          content: [{ type: "text", text: "No MCP log files found in the log directory." }]
        };
      }

      // Further filter for specific server if requested
      const targetLogs = serverName 
        ? mcpLogs.filter(file => file.includes(serverName))
        : mcpLogs;
      
      if (targetLogs.length === 0 && serverName) {
        return {
          content: [{ type: "text", text: `No logs found for server name '${serverName}'.` }]
        };
      }

      // Read and concatenate log content
      let combinedLogs = "";
      for (const logFile of targetLogs) {
        const filePath = path.join(logDirectory, logFile);
        try {
          let content = await fs.readFile(filePath, 'utf-8');
          
          // Get last N lines
          const allLines = content.split('\n');
          const lastLines = allLines.slice(-lines).join('\n');
          
          combinedLogs += `\n---- ${logFile} ----\n${lastLines}\n\n`;
        } catch (error) {
          combinedLogs += `\n---- ${logFile} ----\nError reading file: ${error.message}\n\n`;
        }
      }

      return {
        content: [{ type: "text", text: combinedLogs || "Log files exist but are empty." }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error reading logs: ${error.message}` }]
      };
    }
  }
);

// Analyze MCP logs for common errors
server.tool(
  "analyze-mcp-logs",
  {
    serverName: z.string().optional().describe("Specific server name to analyze logs for")
  },
  async ({ serverName }) => {
    try {
      // First, get the logs
      const lines = 200; // Analyze last 200 lines
      
      // Ensure log directory exists
      try {
        await fs.access(logDirectory);
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Log directory not found at ${logDirectory}. Claude Desktop might not be installed or hasn't generated logs yet.` }]
        };
      }

      // Get all log files
      const files = await fs.readdir(logDirectory);
      
      // Filter for MCP logs
      const mcpLogs = files.filter(file => file.startsWith("mcp"));
      
      if (mcpLogs.length === 0) {
        return {
          content: [{ type: "text", text: "No MCP log files found in the log directory." }]
        };
      }

      // Further filter for specific server if requested
      const targetLogs = serverName 
        ? mcpLogs.filter(file => file.includes(serverName))
        : mcpLogs;
      
      if (targetLogs.length === 0 && serverName) {
        return {
          content: [{ type: "text", text: `No logs found for server name '${serverName}'.` }]
        };
      }

      // Read and analyze log content
      let analysisResults = [];
      for (const logFile of targetLogs) {
        const filePath = path.join(logDirectory, logFile);
        try {
          let content = await fs.readFile(filePath, 'utf-8');
          
          // Get last N lines
          const allLines = content.split('\n');
          const lastLines = allLines.slice(-lines);
          
          // Look for error patterns
          const findings = errorPatterns.map(pattern => {
            const matchingLines = lastLines.filter(line => 
              line.toLowerCase().includes(pattern.pattern.toLowerCase())
            );
            
            if (matchingLines.length > 0) {
              return {
                pattern: pattern.pattern,
                description: pattern.description,
                occurrences: matchingLines.length,
                examples: matchingLines.slice(0, 2) // Show up to 2 examples
              };
            }
            return null;
          }).filter(Boolean);
          
          if (findings.length > 0) {
            analysisResults.push({
              file: logFile,
              findings: findings
            });
          } else {
            analysisResults.push({
              file: logFile,
              findings: "No common error patterns detected"
            });
          }
        } catch (error) {
          analysisResults.push({
            file: logFile,
            error: `Error reading file: ${error.message}`
          });
        }
      }

      // Format the results
      let analysisReport = "# MCP Log Analysis Report\n\n";
      
      if (analysisResults.length === 0) {
        analysisReport += "No logs could be analyzed.\n";
      } else {
        for (const result of analysisResults) {
          analysisReport += `## ${result.file}\n\n`;
          
          if (result.error) {
            analysisReport += `Error: ${result.error}\n\n`;
            continue;
          }
          
          if (result.findings === "No common error patterns detected") {
            analysisReport += "No common error patterns detected in this log file.\n\n";
            continue;
          }
          
          for (const finding of result.findings) {
            analysisReport += `### ${finding.pattern}: ${finding.description}\n`;
            analysisReport += `Occurrences: ${finding.occurrences}\n\n`;
            
            if (finding.examples && finding.examples.length > 0) {
              analysisReport += "Examples:\n";
              for (const example of finding.examples) {
                analysisReport += `\`\`\`\n${example}\n\`\`\`\n\n`;
              }
            }
          }
        }
      }

      return {
        content: [{ type: "text", text: analysisReport }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error analyzing logs: ${error.message}` }]
      };
    }
  }
);

// ----------------------
// CONFIGURATION TOOLS
// ----------------------

// Read MCP configuration
server.tool(
  "read-mcp-config",
  {},
  async () => {
    try {
      try {
        await fs.access(configPath);
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Configuration file not found at ${configPath}. You might need to create it.
            
Claude Desktop stores its configuration at:
- macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
- Windows: %APPDATA%\\Claude\\claude_desktop_config.json` 
          }]
        };
      }

      const configContent = await fs.readFile(configPath, 'utf-8');
      
      try {
        // Try to parse to validate it's proper JSON
        const configObject = JSON.parse(configContent);
        const formattedConfig = JSON.stringify(configObject, null, 2);
        
        return {
          content: [{ 
            type: "text", 
            text: `# Current MCP Configuration\n\n\`\`\`json\n${formattedConfig}\n\`\`\``
          }]
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Configuration file exists but contains invalid JSON. Error: ${error.message}\n\nRaw content:\n\n\`\`\`\n${configContent}\n\`\`\`` 
          }]
        };
      }
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error reading configuration: ${error.message}` }]
      };
    }
  }
);

// Update MCP configuration
server.tool(
  "update-mcp-config",
  {
    config: z.string().describe("JSON configuration to write (entire file content)")
  },
  async ({ config }) => {
    try {
      // Validate the JSON
      try {
        JSON.parse(config);
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Invalid JSON configuration: ${error.message}` }]
        };
      }

      // Create backup of existing config if it exists
      try {
        const existingConfig = await fs.readFile(configPath, 'utf-8');
        const backupPath = `${configPath}.backup.${Date.now()}`;
        await fs.writeFile(backupPath, existingConfig);
      } catch (error) {
        // Ignore if no existing config
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      
      // Write new config
      await fs.writeFile(configPath, config);
      
      return {
        content: [{ 
          type: "text", 
          text: `Configuration successfully updated at ${configPath}.\n\nNote: You'll need to restart Claude Desktop for changes to take effect.` 
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error updating configuration: ${error.message}` }]
      };
    }
  }
);

// Validate MCP server configuration
server.tool(
  "validate-mcp-server-config",
  {
    serverName: z.string().optional().describe("Specific server configuration to validate")
  },
  async ({ serverName }) => {
    try {
      try {
        await fs.access(configPath);
      } catch (error) {
        return {
          content: [{ type: "text", text: `Configuration file not found at ${configPath}.` }]
        };
      }

      const configContent = await fs.readFile(configPath, 'utf-8');
      
      try {
        const configObject = JSON.parse(configContent);
        
        if (!configObject.mcpServers) {
          return {
            content: [{ type: "text", text: "Configuration file does not contain an 'mcpServers' section." }]
          };
        }
        
        const servers = configObject.mcpServers;
        const serverNames = Object.keys(servers);
        
        if (serverNames.length === 0) {
          return {
            content: [{ type: "text", text: "No MCP servers are configured." }]
          };
        }
        
        // If a specific server is requested, only validate that one
        const targetsToValidate = serverName ? 
          (serverNames.includes(serverName) ? [serverName] : []) : 
          serverNames;
          
        if (serverName && targetsToValidate.length === 0) {
          return {
            content: [{ type: "text", text: `Server '${serverName}' not found in configuration.` }]
          };
        }
        
        // Validate each server configuration
        let validationResults = [];
        
        for (const name of targetsToValidate) {
          const serverConfig = servers[name];
          let issues = [];
          
          // Check command exists
          if (!serverConfig.command) {
            issues.push("Missing 'command' field");
          } else {
            // Try to find the command in PATH
            try {
              await execAsync(`which ${serverConfig.command}`);
            } catch (error) {
              try {
                await execAsync(`where ${serverConfig.command}`);
              } catch (error2) {
                issues.push(`Command '${serverConfig.command}' not found in PATH`);
              }
            }
          }
          
          // Check args
          if (!serverConfig.args) {
            issues.push("Missing 'args' field");
          } else if (!Array.isArray(serverConfig.args)) {
            issues.push("'args' field must be an array");
          }
          
          // Check for relative paths in args that might cause issues
          if (Array.isArray(serverConfig.args)) {
            const relativePathArgs = serverConfig.args.filter(arg => 
              typeof arg === 'string' && 
              arg.includes('/') && 
              !arg.startsWith('/') && 
              !arg.includes(':/')
            );
            
            if (relativePathArgs.length > 0) {
              issues.push(`Potential relative path issues in args: ${relativePathArgs.join(', ')}`);
            }
          }
          
          // Check env vars if present
          if (serverConfig.env && typeof serverConfig.env !== 'object') {
            issues.push("'env' field must be an object");
          }
          
          // Add validation result
          validationResults.push({
            server: name,
            config: serverConfig,
            valid: issues.length === 0,
            issues: issues
          });
        }
        
        // Format the results
        let validationReport = "# MCP Server Configuration Validation\n\n";
        
        for (const result of validationResults) {
          validationReport += `## ${result.server}\n\n`;
          validationReport += `Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}\n\n`;
          
          if (!result.valid) {
            validationReport += "Issues:\n";
            for (const issue of result.issues) {
              validationReport += `- ${issue}\n`;
            }
            validationReport += "\n";
          }
          
          validationReport += `Configuration:\n\`\`\`json\n${JSON.stringify(result.config, null, 2)}\n\`\`\`\n\n`;
        }
        
        return {
          content: [{ type: "text", text: validationReport }]
        };
        
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error parsing configuration: ${error.message}` }]
        };
      }
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error validating configuration: ${error.message}` }]
      };
    }
  }
);

// ----------------------
// CONNECTION TESTING TOOLS
// ----------------------

// Test if a port is available
server.tool(
  "test-port-availability",
  {
    port: z.number().int().min(1).max(65535).describe("Port number to test")
  },
  async ({ port }) => {
    return new Promise((resolve) => {
      const server = createServer();
      
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve({
            content: [{ 
              type: "text", 
              text: `Port ${port} is already in use. This might indicate another server is running on this port.` 
            }]
          });
        } else {
          resolve({
            isError: true,
            content: [{ type: "text", text: `Error testing port ${port}: ${err.message}` }]
          });
        }
        server.close();
      });
      
      server.once('listening', () => {
        resolve({
          content: [{ type: "text", text: `Port ${port} is available.` }]
        });
        server.close();
      });
      
      server.listen(port, '127.0.0.1');
    });
  }
);

// Check MCP server process
server.tool(
  "check-mcp-server-process",
  {
    serverName: z.string().describe("Name of the MCP server to check")
  },
  async ({ serverName }) => {
    try {
      // Read configuration to get the command for this server
      try {
        await fs.access(configPath);
      } catch (error) {
        return {
          content: [{ type: "text", text: `Configuration file not found at ${configPath}.` }]
        };
      }

      const configContent = await fs.readFile(configPath, 'utf-8');
      let configObject;
      
      try {
        configObject = JSON.parse(configContent);
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Invalid JSON in configuration file: ${error.message}` }]
        };
      }
      
      if (!configObject.mcpServers || !configObject.mcpServers[serverName]) {
        return {
          content: [{ type: "text", text: `Server '${serverName}' not found in configuration.` }]
        };
      }
      
      const serverConfig = configObject.mcpServers[serverName];
      const command = serverConfig.command;
      
      if (!command) {
        return {
          content: [{ type: "text", text: `Server '${serverName}' has no command specified in configuration.` }]
        };
      }
      
      // Check if process is running (platform specific)
      const platform = os.platform();
      let processCheckCommand;
      
      if (platform === "win32") {
        processCheckCommand = `tasklist /FI "IMAGENAME eq ${command}*"`;
      } else {
        processCheckCommand = `ps aux | grep "${command}" | grep -v grep`;
      }
      
      try {
        const { stdout } = await execAsync(processCheckCommand);
        
        if (stdout.trim()) {
          // Process is likely running
          return {
            content: [{ 
              type: "text", 
              text: `Process for server '${serverName}' appears to be running.\n\nProcess details:\n\`\`\`\n${stdout}\n\`\`\`` 
            }]
          };
        } else {
          return {
            content: [{ type: "text", text: `No running process found for server '${serverName}'.` }]
          };
        }
      } catch (error) {
        // Process not found or error checking
        return {
          content: [{ 
            type: "text", 
            text: `No running process found for server '${serverName}', or error checking process: ${error.message}` 
          }]
        };
      }
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error checking server process: ${error.message}` }]
      };
    }
  }
);

// ----------------------
// FIX IMPLEMENTATION TOOLS
// ----------------------

// Generate MCP server template
server.tool(
  "generate-mcp-server-template",
  {
    serverName: z.string().describe("Name for the MCP server"),
    serverType: z.enum(["typescript", "python"]).describe("Type of server to generate"),
    features: z.enum(["basic", "tools-only", "resources-only", "complete"]).describe("Features to include in the template")
  },
  async ({ serverName, serverType, features }) => {
    try {
      let template = "";
      
      if (serverType === "typescript") {
        if (features === "basic" || features === "tools-only") {
          template = `
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server with clear naming
const server = new McpServer({
  name: "${serverName}",
  version: "1.0.0"
});

// Add a simple echo tool
server.tool(
  "echo",
  {
    message: z.string().describe("Message to echo back")
  },
  async ({ message }) => {
    try {
      return {
        content: [{ type: "text", text: \`Echo: \${message}\` }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: \`Error: \${error.message}\` }]
      };
    }
  }
);

// Connect transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("${serverName} started");
}

main().catch(console.error);`;
        } else if (features === "resources-only") {
          template = `
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Create server with clear naming
const server = new McpServer({
  name: "${serverName}",
  version: "1.0.0"
});

// Add a static resource
server.resource(
  "static-resource",
  "static://example",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "This is a static resource example."
    }]
  })
);

// Add a dynamic resource with template
server.resource(
  "dynamic-resource",
  new ResourceTemplate("dynamic://{param}", { list: undefined }),
  async (uri, { param }) => ({
    contents: [{
      uri: uri.href,
      text: \`This is a dynamic resource with parameter: \${param}\`
    }]
  })
);

// Connect transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("${serverName} started");
}

main().catch(console.error);`;
        } else { // complete
          template = `
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server with clear naming
const server = new McpServer({
  name: "${serverName}",
  version: "1.0.0"
});

// Add a tool
server.tool(
  "echo",
  {
    message: z.string().describe("Message to echo back")
  },
  async ({ message }) => {
    try {
      return {
        content: [{ type: "text", text: \`Echo: \${message}\` }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: \`Error: \${error.message}\` }]
      };
    }
  }
);

// Add a static resource
server.resource(
  "static-resource",
  "static://example",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "This is a static resource example."
    }]
  })
);

// Add a dynamic resource with template
server.resource(
  "dynamic-resource",
  new ResourceTemplate("dynamic://{param}", { list: undefined }),
  async (uri, { param }) => ({
    contents: [{
      uri: uri.href,
      text: \`This is a dynamic resource with parameter: \${param}\`
    }]
  })
);

// Add a prompt template
server.prompt(
  "greet",
  {
    name: z.string().describe("Name to greet")
  },
  ({ name }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: \`Please greet \${name} in a friendly way.\`
      }
    }]
  })
);

// Connect transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("${serverName} started");
}

main().catch(console.error);`;
        }
      } else { // python
        if (features === "basic" || features === "tools-only") {
          template = `
from mcp.server.fastmcp import FastMCP

# Create MCP server
mcp = FastMCP("${serverName}")

@mcp.tool()
async def echo(message: str) -> str:
    """Echo a message back.
    
    Args:
        message: Message to echo back
    """
    try:
        return f"Echo: {message}"
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    # Run the server
    mcp.run(transport='stdio')`;
        } else if (features === "resources-only") {
          template = `
from mcp.server.fastmcp import FastMCP
import mcp.types as types
from typing import List

# Create MCP server
mcp = FastMCP("${serverName}")

@mcp.resource("static://example")
async def static_resource() -> str:
    """Return a static resource."""
    return "This is a static resource example."

@mcp.resource("dynamic://{param}")
async def dynamic_resource(param: str) -> str:
    """Return a dynamic resource.
    
    Args:
        param: Parameter value
    """
    return f"This is a dynamic resource with parameter: {param}"

if __name__ == "__main__":
    # Run the server
    mcp.run(transport='stdio')`;
        } else { // complete
          template = `
from mcp.server.fastmcp import FastMCP
import mcp.types as types
from typing import List

# Create MCP server
mcp = FastMCP("${serverName}")

@mcp.tool()
async def echo(message: str) -> str:
    """Echo a message back.
    
    Args:
        message: Message to echo back
    """
    try:
        return f"Echo: {message}"
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.resource("static://example")
async def static_resource() -> str:
    """Return a static resource."""
    return "This is a static resource example."

@mcp.resource("dynamic://{param}")
async def dynamic_resource(param: str) -> str:
    """Return a dynamic resource.
    
    Args:
        param: Parameter value
    """
    return f"This is a dynamic resource with parameter: {param}"

@mcp.prompt()
async def greet(name: str) -> List[types.PromptMessage]:
    """Define a greeting prompt.
    
    Args:
        name: Name to greet
    """
    return [
        types.PromptMessage(
            role="user",
            content=types.TextContent(
                type="text",
                text=f"Please greet {name} in a friendly way."
            )
        )
    ]

if __name__ == "__main__":
    # Run the server
    mcp.run(transport='stdio')`;
        }
      }
      
      return {
        content: [{ 
          type: "text", 
          text: `# ${serverName} Template (${serverType})\n\nHere's a ${features} template for your MCP server:\n\n\`\`\`${serverType === "typescript" ? "typescript" : "python"}\n${template}\n\`\`\`\n\n## Setup Instructions\n\n${serverType === "typescript" ? 
            `1. Create a new directory for your project
2. Initialize a new npm project: \`npm init -y\`
3. Install dependencies: \`npm install @modelcontextprotocol/sdk zod\`
4. Install dev dependencies: \`npm install -D typescript @types/node\`
5. Create a tsconfig.json file
6. Save the above code to src/index.ts
7. Compile with TypeScript: \`npx tsc\`
8. Run the server: \`node build/index.js\`` 
            : 
            `1. Create a new directory for your project
2. Create a virtual environment: \`python -m venv venv\`
3. Activate the virtual environment: \`source venv/bin/activate\` (Linux/Mac) or \`venv\\Scripts\\activate\` (Windows)
4. Install dependencies: \`pip install mcp\`
5. Save the above code to server.py
6. Run the server: \`python server.py\``}` 
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error generating template: ${error.message}` }]
      };
    }
  }
);

// Generate Claude Desktop config
server.tool(
  "generate-claude-desktop-config",
  {
    serverConfigs: z.array(z.object({
      name: z.string().describe("Server name (used as key in config)"),
      command: z.string().describe("Command to run"),
      args: z.array(z.string()).describe("Command arguments"),
      env: z.record(z.string(), z.string()).optional().describe("Environment variables")
    })).describe("Array of server configurations")
  },
  async ({ serverConfigs }) => {
    try {
      // Create config object
      const config = {
        mcpServers: {}
      };
      
      // Add each server
      for (const serverConfig of serverConfigs) {
        config.mcpServers[serverConfig.name] = {
          command: serverConfig.command,
          args: serverConfig.args
        };
        
        if (serverConfig.env && Object.keys(serverConfig.env).length > 0) {
          config.mcpServers[serverConfig.name].env = serverConfig.env;
        }
      }
      
      // Format as JSON
      const configJson = JSON.stringify(config, null, 2);
      
      return {
        content: [{ 
          type: "text", 
          text: `# Claude Desktop Configuration\n\n\`\`\`json\n${configJson}\n\`\`\`\n\nSave this configuration to:\n\n- macOS: ~/Library/Application Support/Claude/claude_desktop_config.json\n- Windows: %APPDATA%\\Claude\\claude_desktop_config.json\n\nThen restart Claude Desktop for the changes to take effect.` 
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error generating configuration: ${error.message}` }]
      };
    }
  }
);

// ----------------------
// DIAGNOSTIC RESOURCES
// ----------------------

// Common MCP issues and solutions
server.resource(
  "common-mcp-issues",
  "mcp-troubleshooter://common-issues",
  async (uri) => {
    const commonIssues = `# Common MCP Issues and Solutions

## Configuration Issues

1. **JSON Syntax Errors**
   - **Symptoms**: Claude Desktop fails to start or MCP servers don't appear
   - **Solution**: Validate your JSON syntax in claude_desktop_config.json. Common mistakes include missing commas, extra commas, or unescaped quotes.

2. **Command Not Found**
   - **Symptoms**: Logs show "command not found" or similar errors
   - **Solution**: Ensure the command exists in your PATH, or provide absolute paths to executables.

3. **Relative Path Issues**
   - **Symptoms**: Server can't find files or directories
   - **Solution**: Use absolute paths in your configuration for reliability.

4. **Permission Denied**
   - **Symptoms**: Logs show "permission denied" errors
   - **Solution**: Check file and directory permissions, ensure executables are marked as executable.

## Connection Issues

1. **Port Already in Use**
   - **Symptoms**: Server fails to start with "address already in use" errors
   - **Solution**: Check if another process is using the same port and stop it, or configure your server to use a different port.

2. **Transport Configuration**
   - **Symptoms**: Client and server can't establish connection
   - **Solution**: Ensure both client and server are using the same transport type (stdio or SSE).

3. **Startup Timing Issues**
   - **Symptoms**: Connection times out or fails
   - **Solution**: Add appropriate timeouts or retry logic in your server implementation.

## Implementation Issues

1. **Invalid Tool Schemas**
   - **Symptoms**: Tools don't appear or can't be called
   - **Solution**: Ensure your tool parameter schemas are correctly defined using Zod or similar.

2. **Resource URI Template Errors**
   - **Symptoms**: Resources can't be accessed with parameters
   - **Solution**: Verify your URI template syntax follows the RFC6570 standard.

3. **Error Handling**
   - **Symptoms**: Server crashes on certain inputs
   - **Solution**: Implement proper try/catch blocks and return appropriate error responses.

## Environment Issues

1. **Missing Dependencies**
   - **Symptoms**: Server crashes on startup with module not found errors
   - **Solution**: Install all required dependencies and ensure your package.json or requirements.txt is complete.

2. **Node.js Version Compatibility**
   - **Symptoms**: TypeScript servers fail with syntax errors
   - **Solution**: Ensure you're using a compatible Node.js version (14+ recommended).

3. **Python Version Compatibility**
   - **Symptoms**: Python servers fail with syntax errors
   - **Solution**: Ensure you're using Python 3.7+ for MCP servers.

## Debugging Tips

1. Check Claude Desktop logs:
   - macOS: ~/Library/Logs/Claude/mcp*.log
   - Windows: %APPDATA%\\Claude\\logs\\mcp*.log

2. Run your server directly in a terminal to see immediate output

3. Use the MCP Inspector tool for testing:
   - Install: \`npm install -g @modelcontextprotocol/inspector\`
   - Run: \`npx @modelcontextprotocol/inspector <command> <args...>\`

4. Add console.error() or print() statements in your code for debugging`;

    return {
      contents: [{
        uri: uri.href,
        text: commonIssues
      }]
    };
  }
);

// MCP Configuration templates
server.resource(
  "mcp-config-templates",
  "mcp-troubleshooter://config-templates",
  async (uri) => {
    const configTemplates = `# MCP Configuration Templates

## Basic Configuration (Single Server)

\`\`\`json
{
  "mcpServers": {
    "example-server": {
      "command": "node",
      "args": ["path/to/server.js"]
    }
  }
}
\`\`\`

## Multiple Servers

\`\`\`json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"]
    },
    "calculator": {
      "command": "node",
      "args": ["path/to/calculator-server.js"]
    }
  }
}
\`\`\`

## With Environment Variables

\`\`\`json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
\`\`\`

## Common Official Servers

### Filesystem Server

\`\`\`json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"]
    }
  }
}
\`\`\`

### GitHub Server

\`\`\`json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
\`\`\`

### Memory Server

\`\`\`json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
\`\`\`

### PostgreSQL Server

\`\`\`json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgres://username:password@localhost:5432/database"]
    }
  }
}
\`\`\`

### SQLite Server

\`\`\`json
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/database.db"]
    }
  }
}
\`\`\`

### Brave Search Server

\`\`\`json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-brave-api-key"
      }
    }
  }
}
\`\`\`

### Python Server Example

\`\`\`json
{
  "mcpServers": {
    "python-server": {
      "command": "python",
      "args": ["-m", "your_server_module"]
    }
  }
}
\`\`\`

## Notes

1. File paths should be absolute paths for reliability
2. Environment variables in the "env" section override system environment variables
3. The server name (key in mcpServers object) is used for identification only
4. You'll need to restart Claude Desktop after changing the configuration`;

    return {
      contents: [{
        uri: uri.href,
        text: configTemplates
      }]
    };
  }
);

// Connect transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Troubleshooter server started");
}

main().catch(console.error);