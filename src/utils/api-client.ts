import axios, { AxiosInstance } from 'axios';
import config from '../config.js';

export interface LuluAuthResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  'not-before-policy': number;
  session_state: string;
}

export class LuluApiClient {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    const baseURL = config.useSandbox ? config.luluSandboxApiUrl : config.luluApiUrl;
    
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      async (request) => {
        await this.ensureValidToken();
        if (this.accessToken) {
          request.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return request;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    if (config.debug) {
      this.axiosInstance.interceptors.response.use(
        (response) => {
          console.log(`Response from ${response.config.url}:`, response.data);
          return response;
        },
        (error) => {
          console.error(`Error from ${error.config?.url}:`, error.response?.data || error.message);
          return Promise.reject(error);
        }
      );
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return;
    }

    await this.authenticate();
  }

  private async authenticate(): Promise<void> {
    const authUrl = config.useSandbox ? config.luluSandboxAuthUrl : config.luluAuthUrl;
    
    try {
      const authHeader = Buffer.from(`${config.luluClientKey}:${config.luluClientSecret}`).toString('base64');
      
      const response = await axios.post<LuluAuthResponse>(
        authUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authHeader}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry to ensure we refresh in time
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
      
      if (config.debug) {
        console.log('Successfully authenticated with Lulu API');
      }
    } catch (error) {
      console.error('Failed to authenticate with Lulu API:', error);
      throw new Error('Failed to authenticate with Lulu API');
    }
  }

  // Print Job Cost Calculations
  async calculatePrintJobCost(data: any): Promise<any> {
    const response = await this.axiosInstance.post('/print-job-cost-calculations/', data);
    return response.data;
  }

  // Print Jobs
  async createPrintJob(data: any): Promise<any> {
    const response = await this.axiosInstance.post('/print-jobs/', data);
    return response.data;
  }

  async listPrintJobs(params?: any): Promise<any> {
    const response = await this.axiosInstance.get('/print-jobs/', { params });
    return response.data;
  }

  async getPrintJob(id: string): Promise<any> {
    const response = await this.axiosInstance.get(`/print-jobs/${id}/`);
    return response.data;
  }

  async updatePrintJob(id: string, data: any): Promise<any> {
    const response = await this.axiosInstance.patch(`/print-jobs/${id}/`, data);
    return response.data;
  }

  async deletePrintJob(id: string): Promise<void> {
    await this.axiosInstance.delete(`/print-jobs/${id}/`);
  }

  async getPrintJobCosts(id: string): Promise<any> {
    const response = await this.axiosInstance.get(`/print-jobs/${id}/costs/`);
    return response.data;
  }

  async getPrintJobStatus(id: string): Promise<any> {
    const response = await this.axiosInstance.get(`/print-jobs/${id}/status/`);
    return response.data;
  }

  async updatePrintJobStatus(id: string, data: any): Promise<any> {
    const response = await this.axiosInstance.patch(`/print-jobs/${id}/status/`, data);
    return response.data;
  }

  async getPrintJobStatistics(params?: any): Promise<any> {
    const response = await this.axiosInstance.get('/print-jobs/statistics/', { params });
    return response.data;
  }

  // Shipping Options
  async getShippingOptions(params?: any): Promise<any> {
    const response = await this.axiosInstance.get('/shipping-options/', { params });
    return response.data;
  }

  // Webhooks
  async createWebhook(data: any): Promise<any> {
    const response = await this.axiosInstance.post('/webhooks/', data);
    return response.data;
  }

  async listWebhooks(params?: any): Promise<any> {
    const response = await this.axiosInstance.get('/webhooks/', { params });
    return response.data;
  }

  async getWebhook(id: string): Promise<any> {
    const response = await this.axiosInstance.get(`/webhooks/${id}/`);
    return response.data;
  }

  async updateWebhook(id: string, data: any): Promise<any> {
    const response = await this.axiosInstance.patch(`/webhooks/${id}/`, data);
    return response.data;
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.axiosInstance.delete(`/webhooks/${id}/`);
  }

  async testWebhookSubmission(id: string, topic: string): Promise<any> {
    const response = await this.axiosInstance.post(`/webhooks/${id}/test-submission/${topic}/`);
    return response.data;
  }

  async listWebhookSubmissions(params?: any): Promise<any> {
    const response = await this.axiosInstance.get('/webhook-submissions/', { params });
    return response.data;
  }

  // File Validation
  async validateInterior(data: any): Promise<any> {
    const response = await this.axiosInstance.post('/validate-interior/', data);
    return response.data;
  }

  async getInteriorValidation(id: string): Promise<any> {
    const response = await this.axiosInstance.get(`/validate-interior/${id}/`);
    return response.data;
  }

  async calculateCoverDimensions(data: any): Promise<any> {
    const response = await this.axiosInstance.post('/cover-dimensions/', data);
    return response.data;
  }

  async validateCover(data: any): Promise<any> {
    const response = await this.axiosInstance.post('/validate-cover/', data);
    return response.data;
  }

  async getCoverValidation(id: string): Promise<any> {
    const response = await this.axiosInstance.get(`/validate-cover/${id}/`);
    return response.data;
  }
}

export const createApiClient = (): LuluApiClient => {
  return new LuluApiClient();
};

export const apiClient = createApiClient();
export default apiClient;