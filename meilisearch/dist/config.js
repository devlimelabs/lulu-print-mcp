/**
 * Meilisearch MCP Server Configuration
 *
 * This file contains the configuration settings for connecting to the Meilisearch server.
 * Configuration is loaded from environment variables with sensible defaults.
 */
/**
 * Load and initialize configuration from environment variables
 */
export const loadConfig = () => {
    return {
        host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
        apiKey: process.env.MEILISEARCH_API_KEY || "",
        timeout: parseInt(process.env.MEILISEARCH_TIMEOUT || "5000", 10),
    };
};
// Export the config instance
export const config = loadConfig();
// Re-export for direct use
export default config;
//# sourceMappingURL=config.js.map