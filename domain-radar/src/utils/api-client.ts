/**
 * Domain API client for interacting with domain information services
 */
import fetch from 'node-fetch';
import config from '../config.js';
import { DomainAvailability, DomainInfo } from '../types.js';

/**
 * Creates and configures the domain API client
 */
export const createApiClient = () => {
  // Common API request headers
  const headers = {
    'Authorization': `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json'
  };

  /**
   * Check if a specific domain is available
   */
  const checkDomainAvailability = async (domain: string): Promise<DomainAvailability> => {
    try {
      // WhoisXML API format
      const url = `${config.availabilityApiUrl}?apiKey=${config.apiKey}&domainName=${domain}&outputFormat=JSON&mode=DNS_ONLY`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // WhoisXML API returns domainAvailability = "AVAILABLE" or "UNAVAILABLE"
      const isAvailable = data.DomainInfo?.domainAvailability === "AVAILABLE";
      
      return {
        domain,
        available: isAvailable,
        price: isAvailable ? data.DomainInfo?.estimatedPrice : undefined,
        currency: isAvailable ? 'USD' : undefined
      };
    } catch (error) {
      console.error(`Error checking availability for ${domain}:`, error);
      // Return a default response for error handling
      return {
        domain,
        available: false
      };
    }
  };

  /**
   * Check availability for multiple TLDs for a given base domain
   */
  const checkMultipleTLDs = async (domainName: string): Promise<DomainAvailability[]> => {
    // Remove any TLD from the input if present
    const baseName = domainName.split('.')[0];
    
    const checkPromises = config.topLevelDomains.map(tld => 
      checkDomainAvailability(`${baseName}${tld}`)
    );
    
    return Promise.all(checkPromises);
  };

  /**
   * Fetch domains expiring within 24 hours
   * NOTE: WhoisXML API doesn't provide a direct REST endpoint for expiring domains.
   * This returns mock data for demonstration purposes.
   * In production, you would need to integrate with their data feeds or use another service.
   */
  const getExpiringDomains = async (): Promise<DomainInfo[]> => {
    try {
      // Mock data for demonstration
      console.log("Note: Returning mock data for expiring domains. WhoisXML API requires data feed subscription for this feature.");
      
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      return [
        {
          domain: "techstartup.com",
          expiryDate: tomorrow.toISOString(),
          estimatedValue: 2500,
          traffic: 1200,
          categories: ["technology", "business"]
        },
        {
          domain: "webdevtools.net",
          expiryDate: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
          estimatedValue: 1800,
          traffic: 850,
          categories: ["technology", "development"]
        },
        {
          domain: "cloudservices.io",
          expiryDate: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(),
          estimatedValue: 3200,
          traffic: 2100,
          categories: ["technology", "cloud", "services"]
        }
      ];
    } catch (error) {
      console.error("Error fetching expiring domains:", error);
      return [];
    }
  };

  /**
   * Fetch recently expired domains
   * NOTE: WhoisXML API doesn't provide a direct REST endpoint for expired domains.
   * This returns mock data for demonstration purposes.
   * In production, you would need to integrate with their data feeds or use another service.
   */
  const getExpiredDomains = async (): Promise<DomainInfo[]> => {
    try {
      // Mock data for demonstration
      console.log("Note: Returning mock data for expired domains. WhoisXML API requires data feed subscription for this feature.");
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      
      return [
        {
          domain: "innovativesolutions.com",
          expiryDate: yesterday.toISOString(),
          previousOwner: "Innovation Corp",
          estimatedValue: 5000,
          traffic: 3200,
          categories: ["business", "technology", "consulting"]
        },
        {
          domain: "marketingpro.net",
          expiryDate: twoDaysAgo.toISOString(),
          previousOwner: "Marketing Professionals LLC",
          estimatedValue: 2800,
          traffic: 1800,
          categories: ["marketing", "business", "advertising"]
        },
        {
          domain: "datascience.org",
          expiryDate: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
          previousOwner: "Data Science Foundation",
          estimatedValue: 6500,
          traffic: 4500,
          categories: ["technology", "science", "education"]
        }
      ];
    } catch (error) {
      console.error("Error fetching expired domains:", error);
      return [];
    }
  };

  /**
   * Search domains by keyword in domain name or categories
   */
  const searchDomainsByKeyword = (domains: DomainInfo[], keyword: string): DomainInfo[] => {
    if (!keyword) return domains;
    
    const lowercaseKeyword = keyword.toLowerCase();
    return domains.filter(domain => 
      domain.domain.toLowerCase().includes(lowercaseKeyword) ||
      (domain.categories && domain.categories.some(cat => 
        cat.toLowerCase().includes(lowercaseKeyword)
      ))
    );
  };

  return {
    checkDomainAvailability,
    checkMultipleTLDs,
    getExpiringDomains,
    getExpiredDomains,
    searchDomainsByKeyword
  };
};

export const apiClient = createApiClient();
export default apiClient;