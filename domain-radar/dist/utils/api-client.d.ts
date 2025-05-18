import { DomainAvailability, DomainInfo } from '../types.js';
/**
 * Creates and configures the domain API client
 */
export declare const createApiClient: () => {
    checkDomainAvailability: (domain: string) => Promise<DomainAvailability>;
    checkMultipleTLDs: (domainName: string) => Promise<DomainAvailability[]>;
    getExpiringDomains: () => Promise<DomainInfo[]>;
    getExpiredDomains: () => Promise<DomainInfo[]>;
    searchDomainsByKeyword: (domains: DomainInfo[], keyword: string) => DomainInfo[];
};
export declare const apiClient: {
    checkDomainAvailability: (domain: string) => Promise<DomainAvailability>;
    checkMultipleTLDs: (domainName: string) => Promise<DomainAvailability[]>;
    getExpiringDomains: () => Promise<DomainInfo[]>;
    getExpiredDomains: () => Promise<DomainInfo[]>;
    searchDomainsByKeyword: (domains: DomainInfo[], keyword: string) => DomainInfo[];
};
export default apiClient;
