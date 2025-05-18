import Conf from 'conf';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DEFAULT_INSTALLATION_CONFIG, ENCRYPTION_KEY_ENV_VAR, ENV_STORAGE_DIR, INSTALLATION_CONFIG_FILE, PROFILES_FILE, } from '../config.js';
import { ensureDir } from '../utils/fs-utils.js';
/**
 * Service for managing configuration, profiles, and environment variables
 */
export class ConfigService {
    profilesConfig;
    installationConfig;
    envStore;
    encryptionKey;
    /**
     * Creates a new ConfigService instance
     * @param encryptionKey - Encryption key for sensitive data
     */
    constructor(encryptionKey) {
        this.encryptionKey = encryptionKey;
        this.profilesConfig = { profiles: [] };
        this.installationConfig = { ...DEFAULT_INSTALLATION_CONFIG };
        // Initialize environment variable store with encryption
        this.envStore = new Conf({
            projectName: 'mcp-env-manager',
            cwd: ENV_STORAGE_DIR,
            encryptionKey,
            fileExtension: 'enc'
        });
    }
    /**
     * Loads configuration files from disk
     */
    async loadConfig() {
        try {
            // Ensure storage directory exists
            await ensureDir(ENV_STORAGE_DIR);
            // Load profiles file if it exists
            try {
                const profilesData = await fs.readFile(PROFILES_FILE, 'utf-8');
                this.profilesConfig = JSON.parse(profilesData);
            }
            catch (error) {
                // Create new profiles file if it doesn't exist
                this.profilesConfig = { profiles: [] };
                await this.saveProfiles();
            }
            // Load installation config if it exists
            try {
                const installationConfigData = await fs.readFile(INSTALLATION_CONFIG_FILE, 'utf-8');
                this.installationConfig = JSON.parse(installationConfigData);
            }
            catch (error) {
                // Create new installation config if it doesn't exist
                this.installationConfig = { ...DEFAULT_INSTALLATION_CONFIG };
                await this.saveInstallationConfig();
            }
        }
        catch (error) {
            throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Saves profiles to disk
     */
    async saveProfiles() {
        await ensureDir(path.dirname(PROFILES_FILE));
        await fs.writeFile(PROFILES_FILE, JSON.stringify(this.profilesConfig, null, 2));
    }
    /**
     * Saves installation config to disk
     */
    async saveInstallationConfig() {
        await ensureDir(path.dirname(INSTALLATION_CONFIG_FILE));
        await fs.writeFile(INSTALLATION_CONFIG_FILE, JSON.stringify(this.installationConfig, null, 2));
    }
    /**
     * Gets all profiles
     */
    getProfiles() {
        return this.profilesConfig.profiles;
    }
    /**
     * Gets a profile by ID
     */
    getProfile(id) {
        return this.profilesConfig.profiles.find(p => p.id === id);
    }
    /**
     * Gets the active profile ID
     */
    getActiveProfileId() {
        return this.profilesConfig.activeProfile;
    }
    /**
     * Gets the active profile
     */
    getActiveProfile() {
        const activeId = this.getActiveProfileId();
        if (!activeId)
            return undefined;
        return this.getProfile(activeId);
    }
    /**
     * Creates a new profile
     */
    async createProfile(name, description) {
        const id = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
        const now = new Date().toISOString();
        const profile = {
            id,
            name,
            description,
            createdAt: now,
            updatedAt: now
        };
        this.profilesConfig.profiles.push(profile);
        await this.saveProfiles();
        return profile;
    }
    /**
     * Updates a profile
     */
    async updateProfile(id, updates) {
        const profileIndex = this.profilesConfig.profiles.findIndex(p => p.id === id);
        if (profileIndex === -1) {
            throw new Error(`Profile not found: ${id}`);
        }
        const profile = this.profilesConfig.profiles[profileIndex];
        const updatedProfile = {
            ...profile,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.profilesConfig.profiles[profileIndex] = updatedProfile;
        await this.saveProfiles();
        return updatedProfile;
    }
    /**
     * Deletes a profile
     */
    async deleteProfile(id) {
        const initialLength = this.profilesConfig.profiles.length;
        this.profilesConfig.profiles = this.profilesConfig.profiles.filter(p => p.id !== id);
        if (this.profilesConfig.profiles.length === initialLength) {
            throw new Error(`Profile not found: ${id}`);
        }
        if (this.profilesConfig.activeProfile === id) {
            this.profilesConfig.activeProfile = undefined;
        }
        await this.saveProfiles();
        // Delete environment variables for this profile
        this.envStore.delete(id);
    }
    /**
     * Sets the active profile
     */
    async setActiveProfile(id) {
        const profile = this.getProfile(id);
        if (!profile) {
            throw new Error(`Profile not found: ${id}`);
        }
        this.profilesConfig.activeProfile = id;
        await this.saveProfiles();
    }
    /**
     * Gets all environment variables for a profile
     */
    getEnvVars(profileId) {
        return this.envStore.get(profileId, {});
    }
    /**
     * Gets an environment variable
     */
    getEnvVar(profileId, key) {
        const vars = this.getEnvVars(profileId);
        return vars[key];
    }
    /**
     * Sets an environment variable
     */
    setEnvVar(profileId, key, value, sensitive, description) {
        const profile = this.getProfile(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }
        const vars = this.getEnvVars(profileId);
        vars[key] = { value, sensitive, description };
        this.envStore.set(profileId, vars);
    }
    /**
     * Deletes an environment variable
     */
    deleteEnvVar(profileId, key) {
        const vars = this.getEnvVars(profileId);
        if (!vars[key]) {
            throw new Error(`Environment variable not found: ${key}`);
        }
        delete vars[key];
        this.envStore.set(profileId, vars);
    }
    /**
     * Gets the installation configuration
     */
    getInstallationConfig() {
        return this.installationConfig;
    }
    /**
     * Updates the installation configuration
     */
    async updateInstallationConfig(updates) {
        this.installationConfig = {
            ...this.installationConfig,
            ...updates,
            watchers: {
                ...this.installationConfig.watchers,
                ...(updates.watchers || {})
            },
            packageManager: {
                ...this.installationConfig.packageManager,
                ...(updates.packageManager || {})
            },
            notifications: {
                ...this.installationConfig.notifications,
                ...(updates.notifications || {})
            }
        };
        await this.saveInstallationConfig();
        return this.installationConfig;
    }
}
/**
 * Generates a new encryption key
 */
export function generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
}
/**
 * Gets the encryption key from the environment or generates a new one
 */
export function getEncryptionKey() {
    const envKey = process.env[ENCRYPTION_KEY_ENV_VAR];
    if (envKey) {
        return envKey;
    }
    // Generate a new key
    const newKey = generateEncryptionKey();
    process.env[ENCRYPTION_KEY_ENV_VAR] = newKey;
    console.warn(`
⚠️ Generated a new encryption key. For data persistence across restarts, set the 
${ENCRYPTION_KEY_ENV_VAR} environment variable to:
${newKey}
  `);
    return newKey;
}
/**
 * Initializes the config service
 */
export async function initializeConfigService() {
    const encryptionKey = getEncryptionKey();
    const configService = new ConfigService(encryptionKey);
    await configService.loadConfig();
    return configService;
}
//# sourceMappingURL=config-service.js.map