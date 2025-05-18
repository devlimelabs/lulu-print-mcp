/**
 * Meilisearch MCP Server Configuration
 *
 * This file contains the configuration settings for connecting to the Meilisearch server.
 * Configuration is loaded from environment variables with sensible defaults.
 */
export interface ServerConfig {
    /** The URL of the Meilisearch instance */
    host: string;
    /** The API key for authenticating with Meilisearch */
    apiKey: string;
    /** The timeout for API requests in milliseconds */
    timeout: number;
}
/**
 * Load and initialize configuration from environment variables
 */
export declare const loadConfig: () => ServerConfig;
export declare const config: ServerConfig;
export default config;
