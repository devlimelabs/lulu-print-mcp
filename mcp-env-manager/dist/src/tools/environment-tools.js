import { z } from 'zod';
/**
 * Registers environment variable management tools with the MCP server
 * @param server MCP server instance
 * @param configService Configuration service
 */
export function registerEnvironmentTools(server, configService) {
    // List environment variables
    server.tool("list-env-vars", {
        profileId: z.string().describe("Profile ID to list environment variables from")
    }, async ({ profileId }) => {
        if (!profileId.trim()) {
            throw new Error("Profile ID cannot be empty");
        }
        const profile = configService.getProfile(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }
        const envVars = configService.getEnvVars(profileId);
        // Transform to array and mask sensitive values
        const result = Object.entries(envVars).map(([key, envVar]) => ({
            key,
            value: envVar.sensitive ? '********' : envVar.value,
            sensitive: envVar.sensitive,
            description: envVar.description
        }));
        return {
            profileId,
            profileName: profile.name,
            variables: result
        };
    });
    // Get environment variable
    server.tool("get-env-var", {
        profileId: z.string().describe("Profile ID to get environment variable from"),
        key: z.string().describe("Environment variable key")
    }, async ({ profileId, key }) => {
        if (!profileId.trim()) {
            throw new Error("Profile ID cannot be empty");
        }
        if (!key.trim()) {
            throw new Error("Environment variable key cannot be empty");
        }
        const profile = configService.getProfile(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }
        const envVar = configService.getEnvVar(profileId, key);
        if (!envVar) {
            throw new Error(`Environment variable not found: ${key}`);
        }
        return {
            profileId,
            profileName: profile.name,
            key,
            value: envVar.sensitive ? '********' : envVar.value,
            sensitive: envVar.sensitive,
            description: envVar.description
        };
    });
    // Set environment variable
    server.tool("set-env-var", {
        profileId: z.string().describe("Profile ID to set environment variable in"),
        key: z.string().describe("Environment variable key"),
        value: z.string().describe("Environment variable value"),
        sensitive: z.boolean().describe("Whether the value is sensitive and should be encrypted"),
        description: z.string().optional().describe("Optional description of the environment variable")
    }, async ({ profileId, key, value, sensitive, description }) => {
        if (!profileId.trim()) {
            throw new Error("Profile ID cannot be empty");
        }
        if (!key.trim()) {
            throw new Error("Environment variable key cannot be empty");
        }
        const profile = configService.getProfile(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }
        configService.setEnvVar(profileId, key, value, sensitive, description);
        return {
            success: true,
            profileId,
            key,
            sensitive
        };
    });
    // Delete environment variable
    server.tool("delete-env-var", {
        profileId: z.string().describe("Profile ID to delete environment variable from"),
        key: z.string().describe("Environment variable key")
    }, async ({ profileId, key }) => {
        if (!profileId.trim()) {
            throw new Error("Profile ID cannot be empty");
        }
        if (!key.trim()) {
            throw new Error("Environment variable key cannot be empty");
        }
        const profile = configService.getProfile(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }
        configService.deleteEnvVar(profileId, key);
        return {
            success: true,
            profileId,
            key
        };
    });
    // Export environment variables for a profile
    server.tool("export-env-vars", {
        profileId: z.string().describe("Profile ID to export environment variables from"),
        format: z.enum(['dotenv', 'json', 'shell']).describe("Export format (dotenv, json, or shell)")
    }, async ({ profileId, format }) => {
        if (!profileId.trim()) {
            throw new Error("Profile ID cannot be empty");
        }
        const profile = configService.getProfile(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }
        const envVars = configService.getEnvVars(profileId);
        let output = '';
        if (format === 'dotenv') {
            // .env format
            for (const [key, envVar] of Object.entries(envVars)) {
                // Add comment if description exists
                if (envVar.description) {
                    output += `# ${envVar.description}\n`;
                }
                // Add the variable
                output += `${key}=${formatDotEnvValue(envVar.value)}\n`;
            }
        }
        else if (format === 'json') {
            // JSON format
            const jsonObj = {};
            for (const [key, envVar] of Object.entries(envVars)) {
                jsonObj[key] = envVar.value;
            }
            output = JSON.stringify(jsonObj, null, 2);
        }
        else if (format === 'shell') {
            // Shell export format
            for (const [key, envVar] of Object.entries(envVars)) {
                // Add comment if description exists
                if (envVar.description) {
                    output += `# ${envVar.description}\n`;
                }
                // Add the variable
                output += `export ${key}=${formatShellValue(envVar.value)}\n`;
            }
        }
        return {
            profileId,
            profileName: profile.name,
            format,
            output
        };
    });
}
/**
 * Formats a value for use in a .env file
 * @param value Value to format
 */
function formatDotEnvValue(value) {
    // If value contains spaces, newlines, or quotes, wrap in quotes
    if (/[\s"']/g.test(value)) {
        return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
}
/**
 * Formats a value for use in a shell export command
 * @param value Value to format
 */
function formatShellValue(value) {
    // Escape single quotes with '\'' pattern
    return `'${value.replace(/'/g, "'\\''")}'`;
}
//# sourceMappingURL=environment-tools.js.map