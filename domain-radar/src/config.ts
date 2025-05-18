import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

// Use createRequire for package.json import in ESM
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

// Try to load dotenv if it exists
try {
  // Dynamically import dotenv (this is an ESM pattern)
  const dotenvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(dotenvPath)) {
    await import('dotenv/config');
  }
} catch (error) {
  console.error('Warning: Failed to load .env file:', error);
}

export interface ServerConfig {
  name: string;
  version: string;
  
  // API configuration
  apiKey: string;
  availabilityApiUrl: string;
  expirationApiUrl: string;
  expiredApiUrl: string;
  
  // Domain TLDs to check for availability
  topLevelDomains: string[];
  
  // Cache settings
  cacheTtl: number; // in milliseconds
}

export const loadConfig = (): ServerConfig => {
  return {
    name: packageJson.name,
    version: packageJson.version,
    
    // API configuration - use environment variables with fallbacks
    apiKey: process.env.DOMAIN_API_KEY || 'YOUR_WHOISXML_API_KEY',
    availabilityApiUrl: process.env.AVAILABILITY_API_URL || 'https://domain-availability.whoisxmlapi.com/api/v1',
    expirationApiUrl: process.env.EXPIRATION_API_URL || 'https://api.example.com/domains/expiring',
    expiredApiUrl: process.env.EXPIRED_API_URL || 'https://api.example.com/domains/expired',
    
    // Common TLDs to check for availability
    topLevelDomains: (process.env.TOP_LEVEL_DOMAINS ? 
      process.env.TOP_LEVEL_DOMAINS.split(',') : 
      ['.com', '.net', '.org', '.io', '.co', '.dev', '.app', '.ai']),
    
    // Cache settings
    cacheTtl: parseInt(process.env.CACHE_TTL || '900000', 10), // 15 minutes in milliseconds
  };
};

export const config = loadConfig();
export default config;