import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { ConfigService, generateEncryptionKey } from '../services/config-service.js';

describe('ConfigService', () => {
  let configService: ConfigService;
  let testDir: string;
  
  beforeEach(async () => {
    // Create a temporary directory for test data
    testDir = path.join(os.tmpdir(), `mcp-env-test-${Math.random().toString(36).substring(2, 10)}`);
    await fs.mkdir(testDir, { recursive: true });
    
    // Set env var to use the test directory
    process.env.MCP_ENV_STORAGE_DIR = testDir;
    
    // Create a new ConfigService instance with a test encryption key
    const encryptionKey = generateEncryptionKey();
    configService = new ConfigService(encryptionKey);
    await configService.loadConfig();
  });
  
  afterEach(async () => {
    // Clean up the temporary directory
    await fs.rm(testDir, { recursive: true, force: true });
  });
  
  describe('profile management', () => {
    it('should create a profile', async () => {
      const profile = await configService.createProfile('Test Profile', 'A test profile');
      
      expect(profile.name).toBe('Test Profile');
      expect(profile.description).toBe('A test profile');
      expect(profile.id).toContain('test-profile');
      
      const profiles = configService.getProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe(profile.id);
    });
    
    it('should update a profile', async () => {
      const profile = await configService.createProfile('Test Profile');
      const updatedProfile = await configService.updateProfile(profile.id, {
        name: 'Updated Profile',
        description: 'Updated description'
      });
      
      expect(updatedProfile.name).toBe('Updated Profile');
      expect(updatedProfile.description).toBe('Updated description');
      
      const retrievedProfile = configService.getProfile(profile.id);
      expect(retrievedProfile?.name).toBe('Updated Profile');
    });
    
    it('should delete a profile', async () => {
      const profile = await configService.createProfile('Test Profile');
      await configService.deleteProfile(profile.id);
      
      const profiles = configService.getProfiles();
      expect(profiles).toHaveLength(0);
      
      const retrievedProfile = configService.getProfile(profile.id);
      expect(retrievedProfile).toBeUndefined();
    });
    
    it('should set and get active profile', async () => {
      const profile = await configService.createProfile('Test Profile');
      await configService.setActiveProfile(profile.id);
      
      const activeProfileId = configService.getActiveProfileId();
      expect(activeProfileId).toBe(profile.id);
      
      const activeProfile = configService.getActiveProfile();
      expect(activeProfile?.id).toBe(profile.id);
    });
  });
  
  describe('environment variable management', () => {
    let profileId: string;
    
    beforeEach(async () => {
      const profile = await configService.createProfile('Test Profile');
      profileId = profile.id;
    });
    
    it('should set and get environment variables', () => {
      configService.setEnvVar(profileId, 'TEST_VAR', 'test value', false);
      
      const envVar = configService.getEnvVar(profileId, 'TEST_VAR');
      expect(envVar?.value).toBe('test value');
      expect(envVar?.sensitive).toBe(false);
    });
    
    it('should handle sensitive environment variables', () => {
      configService.setEnvVar(profileId, 'SECRET_VAR', 'secret value', true);
      
      const envVar = configService.getEnvVar(profileId, 'SECRET_VAR');
      expect(envVar?.value).toBe('secret value');
      expect(envVar?.sensitive).toBe(true);
    });
    
    it('should delete environment variables', () => {
      configService.setEnvVar(profileId, 'TEST_VAR', 'test value', false);
      configService.deleteEnvVar(profileId, 'TEST_VAR');
      
      const envVar = configService.getEnvVar(profileId, 'TEST_VAR');
      expect(envVar).toBeUndefined();
    });
    
    it('should list all environment variables for a profile', () => {
      configService.setEnvVar(profileId, 'VAR1', 'value1', false);
      configService.setEnvVar(profileId, 'VAR2', 'value2', true);
      
      const envVars = configService.getEnvVars(profileId);
      expect(Object.keys(envVars)).toHaveLength(2);
      expect(envVars.VAR1.value).toBe('value1');
      expect(envVars.VAR2.value).toBe('value2');
    });
  });
}); 
