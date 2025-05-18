/**
 * Tests for Domain Radar MCP configuration
 */
import { loadConfig } from '../src/config.js';

describe('Configuration', () => {
  // Save original process.env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original process.env after all tests
    process.env = originalEnv;
  });

  test('should load default configuration', () => {
    // Clear any existing env vars for this test
    delete process.env.DOMAIN_API_KEY;
    delete process.env.AVAILABILITY_API_URL;
    delete process.env.TOP_LEVEL_DOMAINS;
    
    const config = loadConfig();
    
    // Verify default values
    expect(config.apiKey).toBe('YOUR_WHOISXML_API_KEY');
    expect(config.availabilityApiUrl).toBe('https://domain-availability.whoisxmlapi.com/api/v1');
    expect(config.topLevelDomains).toContain('.com');
    expect(config.topLevelDomains).toContain('.net');
    expect(config.cacheTtl).toBe(900000); // 15 minutes in milliseconds
  });

  test('should override configuration from environment variables', () => {
    // Set test env vars
    process.env.DOMAIN_API_KEY = 'test_api_key';
    process.env.AVAILABILITY_API_URL = 'https://test-api.example.com/domains/check';
    process.env.TOP_LEVEL_DOMAINS = '.test,.example';
    process.env.CACHE_TTL = '60000';
    
    const config = loadConfig();
    
    // Verify overridden values
    expect(config.apiKey).toBe('test_api_key');
    expect(config.availabilityApiUrl).toBe('https://test-api.example.com/domains/check');
    expect(config.topLevelDomains).toContain('.test');
    expect(config.topLevelDomains).toContain('.example');
    expect(config.topLevelDomains.length).toBe(2);
    expect(config.cacheTtl).toBe(60000); // 1 minute in milliseconds
  });
});