import axios from 'axios';
import config from '../config.js';
export class LuluApiClient {
    axiosInstance;
    accessToken = null;
    tokenExpiry = null;
    constructor() {
        const baseURL = config.useSandbox ? config.luluSandboxApiUrl : config.luluApiUrl;
        this.axiosInstance = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Add request interceptor to include auth token
        this.axiosInstance.interceptors.request.use(async (request) => {
            await this.ensureValidToken();
            if (this.accessToken) {
                request.headers.Authorization = `Bearer ${this.accessToken}`;
            }
            return request;
        }, (error) => {
            return Promise.reject(error);
        });
        // Add response interceptor for debugging
        if (config.debug) {
            this.axiosInstance.interceptors.response.use((response) => {
                console.log(`Response from ${response.config.url}:`, response.data);
                return response;
            }, (error) => {
                console.error(`Error from ${error.config?.url}:`, error.response?.data || error.message);
                return Promise.reject(error);
            });
        }
    }
    async ensureValidToken() {
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return;
        }
        await this.authenticate();
    }
    async authenticate() {
        const authUrl = config.useSandbox ? config.luluSandboxAuthUrl : config.luluAuthUrl;
        try {
            const authHeader = Buffer.from(`${config.luluClientKey}:${config.luluClientSecret}`).toString('base64');
            const response = await axios.post(authUrl, 'grant_type=client_credentials', {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${authHeader}`,
                },
            });
            this.accessToken = response.data.access_token;
            // Set expiry to 5 minutes before actual expiry to ensure we refresh in time
            this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
            if (config.debug) {
                console.log('Successfully authenticated with Lulu API');
            }
        }
        catch (error) {
            console.error('Failed to authenticate with Lulu API:', error);
            throw new Error('Failed to authenticate with Lulu API');
        }
    }
    // Print Job Cost Calculations
    async calculatePrintJobCost(data) {
        const response = await this.axiosInstance.post('/print-job-cost-calculations/', data);
        return response.data;
    }
    // Print Jobs
    async createPrintJob(data) {
        const response = await this.axiosInstance.post('/print-jobs/', data);
        return response.data;
    }
    async listPrintJobs(params) {
        const response = await this.axiosInstance.get('/print-jobs/', { params });
        return response.data;
    }
    async getPrintJob(id) {
        const response = await this.axiosInstance.get(`/print-jobs/${id}/`);
        return response.data;
    }
    async updatePrintJob(id, data) {
        const response = await this.axiosInstance.patch(`/print-jobs/${id}/`, data);
        return response.data;
    }
    async deletePrintJob(id) {
        await this.axiosInstance.delete(`/print-jobs/${id}/`);
    }
    async getPrintJobCosts(id) {
        const response = await this.axiosInstance.get(`/print-jobs/${id}/costs/`);
        return response.data;
    }
    async getPrintJobStatus(id) {
        const response = await this.axiosInstance.get(`/print-jobs/${id}/status/`);
        return response.data;
    }
    async updatePrintJobStatus(id, data) {
        const response = await this.axiosInstance.patch(`/print-jobs/${id}/status/`, data);
        return response.data;
    }
    async getPrintJobStatistics(params) {
        const response = await this.axiosInstance.get('/print-jobs/statistics/', { params });
        return response.data;
    }
    // Shipping Options
    async getShippingOptions(params) {
        const response = await this.axiosInstance.get('/shipping-options/', { params });
        return response.data;
    }
    // Webhooks
    async createWebhook(data) {
        const response = await this.axiosInstance.post('/webhooks/', data);
        return response.data;
    }
    async listWebhooks(params) {
        const response = await this.axiosInstance.get('/webhooks/', { params });
        return response.data;
    }
    async getWebhook(id) {
        const response = await this.axiosInstance.get(`/webhooks/${id}/`);
        return response.data;
    }
    async updateWebhook(id, data) {
        const response = await this.axiosInstance.patch(`/webhooks/${id}/`, data);
        return response.data;
    }
    async deleteWebhook(id) {
        await this.axiosInstance.delete(`/webhooks/${id}/`);
    }
    async testWebhookSubmission(id, topic) {
        const response = await this.axiosInstance.post(`/webhooks/${id}/test-submission/${topic}/`);
        return response.data;
    }
    async listWebhookSubmissions(params) {
        const response = await this.axiosInstance.get('/webhook-submissions/', { params });
        return response.data;
    }
    // File Validation
    async validateInterior(data) {
        const response = await this.axiosInstance.post('/validate-interior/', data);
        return response.data;
    }
    async getInteriorValidation(id) {
        const response = await this.axiosInstance.get(`/validate-interior/${id}/`);
        return response.data;
    }
    async calculateCoverDimensions(data) {
        const response = await this.axiosInstance.post('/cover-dimensions/', data);
        return response.data;
    }
    async validateCover(data) {
        const response = await this.axiosInstance.post('/validate-cover/', data);
        return response.data;
    }
    async getCoverValidation(id) {
        const response = await this.axiosInstance.get(`/validate-cover/${id}/`);
        return response.data;
    }
}
export const createApiClient = () => {
    return new LuluApiClient();
};
export const apiClient = createApiClient();
export default apiClient;
//# sourceMappingURL=api-client.js.map