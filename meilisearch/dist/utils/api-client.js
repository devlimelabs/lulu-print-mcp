import axios from 'axios';
import config from '../config.js';
/**
 * Meilisearch API client
 *
 * This module provides a configured Axios instance for making requests to the Meilisearch API.
 */
/**
 * Creates a configured Axios instance for Meilisearch API requests
 *
 * @returns An Axios instance with base configuration
 */
export const createApiClient = () => {
    const instance = axios.create({
        baseURL: config.host,
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
        },
        timeout: config.timeout,
    });
    return {
        get: (url, config) => instance.get(url, config),
        post: (url, data, config) => instance.post(url, data, config),
        put: (url, data, config) => instance.put(url, data, config),
        patch: (url, data, config) => instance.patch(url, data, config),
        delete: (url, config) => instance.delete(url, config),
    };
};
// Create and export a singleton instance of the API client
export const apiClient = createApiClient();
// Re-export for direct use
export default apiClient;
//# sourceMappingURL=api-client.js.map