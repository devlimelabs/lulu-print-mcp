import *  from 'fs';
import *  from 'path';
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
  console.error('Warning to load .env file, error);
}

export 

export const loadConfig = () => {
  return {
    name.name,
    version.version,
    
    // API configuration - use environment variables with fallbacks
    apiKey.env.DOMAIN_API_KEY || 'YOUR_WHOISXML_API_KEY',
    availabilityApiUrl.env.AVAILABILITY_API_URL || 'https://domain-availability.whoisxmlapi.com/api/v1',
    expirationApiUrl.env.EXPIRATION_API_URL || 'https://api.example.com/domains/expiring',
    expiredApiUrl.env.EXPIRED_API_URL || 'https://api.example.com/domains/expired',
    
    // Common TLDs to check for availability
    topLevelDomains: (process.env.TOP_LEVEL_DOMAINS ? 
      process.env.TOP_LEVEL_DOMAINS.split(',') .com', '.net', '.org', '.io', '.co', '.dev', '.app', '.ai']),
    
    // Cache settings
    cacheTtl(process.env.CACHE_TTL || '900000', 10), // 15 minutes in milliseconds
  };
};

export const config = loadConfig();
export default config;