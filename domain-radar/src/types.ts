/**
 * Type definitions for the Domain Radar MCP
 */

/**
 * Domain availability information
 */
export interface DomainAvailability {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
}

/**
 * Detailed domain information
 */
export interface DomainInfo {
  domain: string;
  expiryDate: string; // ISO date string
  previousOwner?: string;
  estimatedValue?: number;
  traffic?: number;
  categories?: string[];
}

/**
 * Cache state for domain information
 */
export interface DomainCache {
  expiringDomains: DomainInfo[];
  expiredDomains: DomainInfo[];
  lastCacheUpdate: number;
}