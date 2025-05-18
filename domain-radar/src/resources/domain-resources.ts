/**
 * Domain Radar MCP Resources for displaying domain listings
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import apiClient from "../utils/api-client.js";
import { DomainInfo } from "../types.js";

// Cache for domain data to reduce API calls
let expiringDomainsCache: DomainInfo[] = [];
let expiredDomainsCache: DomainInfo[] = [];
let lastCacheUpdate = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Register domain resources
 */
export const registerDomainResources = (server: McpServer): void => {
  // ====================================
  // Resource: Expiring Domains List
  // ====================================
  server.resource(
    "expiring-domains",
    "expiring-domains://list",
    async (uri) => {
      try {
        // Update cache if expired
        const currentTime = Date.now();
        if (currentTime - lastCacheUpdate > CACHE_TTL || expiringDomainsCache.length === 0) {
          expiringDomainsCache = await apiClient.getExpiringDomains();
          lastCacheUpdate = currentTime;
        }
        
        if (expiringDomainsCache.length === 0) {
          return {
            contents: [{
              uri: uri.href,
              text: "No domains are expiring within the next 24 hours."
            }]
          };
        }
        
        let responseText = "# Domains Expiring Within 24 Hours\n\n";
        responseText += "| Domain | Expiry Date | Est. Value | Est. Traffic | Categories |\n";
        responseText += "|--------|------------|------------|--------------|------------|\n";
        
        expiringDomainsCache.forEach(domain => {
          const expiryDate = new Date(domain.expiryDate).toLocaleString();
          const estValue = domain.estimatedValue ? `$${domain.estimatedValue}` : "N/A";
          const traffic = domain.traffic ? domain.traffic.toString() : "N/A";
          const categories = domain.categories ? domain.categories.join(", ") : "N/A";
          
          responseText += `| ${domain.domain} | ${expiryDate} | ${estValue} | ${traffic} | ${categories} |\n`;
        });
        
        return {
          contents: [{
            uri: uri.href,
            text: responseText
          }]
        };
      } catch (error) {
        console.error("Error in expiring-domains resource:", error);
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching expiring domains: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // ====================================
  // Resource: Expired Domains List
  // ====================================
  server.resource(
    "expired-domains",
    "expired-domains://list",
    async (uri) => {
      try {
        // Update cache if expired
        const currentTime = Date.now();
        if (currentTime - lastCacheUpdate > CACHE_TTL || expiredDomainsCache.length === 0) {
          expiredDomainsCache = await apiClient.getExpiredDomains();
          lastCacheUpdate = currentTime;
        }
        
        if (expiredDomainsCache.length === 0) {
          return {
            contents: [{
              uri: uri.href,
              text: "No recently expired domains found."
            }]
          };
        }
        
        let responseText = "# Recently Expired Domains\n\n";
        responseText += "| Domain | Expiry Date | Previous Owner | Est. Value | Est. Traffic | Categories |\n";
        responseText += "|--------|------------|----------------|------------|--------------|------------|\n";
        
        expiredDomainsCache.forEach(domain => {
          const expiryDate = new Date(domain.expiryDate).toLocaleString();
          const prevOwner = domain.previousOwner || "N/A";
          const estValue = domain.estimatedValue ? `$${domain.estimatedValue}` : "N/A";
          const traffic = domain.traffic ? domain.traffic.toString() : "N/A";
          const categories = domain.categories ? domain.categories.join(", ") : "N/A";
          
          responseText += `| ${domain.domain} | ${expiryDate} | ${prevOwner} | ${estValue} | ${traffic} | ${categories} |\n`;
        });
        
        return {
          contents: [{
            uri: uri.href,
            text: responseText
          }]
        };
      } catch (error) {
        console.error("Error in expired-domains resource:", error);
        return {
          contents: [{
            uri: uri.href,
            text: `Error fetching expired domains: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};