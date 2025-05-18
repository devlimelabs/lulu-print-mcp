export interface ServerConfig {
    name: string;
    version: string;
    apiKey: string;
    availabilityApiUrl: string;
    expirationApiUrl: string;
    expiredApiUrl: string;
    topLevelDomains: string[];
    cacheTtl: number;
}
export declare const loadConfig: () => ServerConfig;
export declare const config: ServerConfig;
export default config;
