import { EnvVar, InstallationConfig, Profile } from '../config.js';
/**
 * Service for managing configuration, profiles, and environment variables
 */
export declare class ConfigService {
    private profilesConfig;
    private installationConfig;
    private envStore;
    private encryptionKey;
    /**
     * Creates a new ConfigService instance
     * @param encryptionKey - Encryption key for sensitive data
     */
    constructor(encryptionKey: string);
    /**
     * Loads configuration files from disk
     */
    loadConfig(): Promise<void>;
    /**
     * Saves profiles to disk
     */
    saveProfiles(): Promise<void>;
    /**
     * Saves installation config to disk
     */
    saveInstallationConfig(): Promise<void>;
    /**
     * Gets all profiles
     */
    getProfiles(): Profile[];
    /**
     * Gets a profile by ID
     */
    getProfile(id: string): Profile | undefined;
    /**
     * Gets the active profile ID
     */
    getActiveProfileId(): string | undefined;
    /**
     * Gets the active profile
     */
    getActiveProfile(): Profile | undefined;
    /**
     * Creates a new profile
     */
    createProfile(name: string, description?: string): Promise<Profile>;
    /**
     * Updates a profile
     */
    updateProfile(id: string, updates: Partial<Pick<Profile, 'name' | 'description'>>): Promise<Profile>;
    /**
     * Deletes a profile
     */
    deleteProfile(id: string): Promise<void>;
    /**
     * Sets the active profile
     */
    setActiveProfile(id: string): Promise<void>;
    /**
     * Gets all environment variables for a profile
     */
    getEnvVars(profileId: string): Record<string, EnvVar>;
    /**
     * Gets an environment variable
     */
    getEnvVar(profileId: string, key: string): EnvVar | undefined;
    /**
     * Sets an environment variable
     */
    setEnvVar(profileId: string, key: string, value: string, sensitive: boolean, description?: string): void;
    /**
     * Deletes an environment variable
     */
    deleteEnvVar(profileId: string, key: string): void;
    /**
     * Gets the installation configuration
     */
    getInstallationConfig(): InstallationConfig;
    /**
     * Updates the installation configuration
     */
    updateInstallationConfig(updates: Partial<InstallationConfig>): Promise<InstallationConfig>;
}
/**
 * Generates a new encryption key
 */
export declare function generateEncryptionKey(): string;
/**
 * Gets the encryption key from the environment or generates a new one
 */
export declare function getEncryptionKey(): string;
/**
 * Initializes the config service
 */
export declare function initializeConfigService(): Promise<ConfigService>;
