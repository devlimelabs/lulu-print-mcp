export interface LuluAuthResponse {
    access_token: string;
    expires_in: number;
    refresh_expires_in: number;
    refresh_token: string;
    token_type: string;
    'not-before-policy': number;
    session_state: string;
}
export declare class LuluApiClient {
    private axiosInstance;
    private accessToken;
    private tokenExpiry;
    constructor();
    private ensureValidToken;
    private authenticate;
    calculatePrintJobCost(data: any): Promise<any>;
    createPrintJob(data: any): Promise<any>;
    listPrintJobs(params?: any): Promise<any>;
    getPrintJob(id: string): Promise<any>;
    updatePrintJob(id: string, data: any): Promise<any>;
    deletePrintJob(id: string): Promise<void>;
    getPrintJobCosts(id: string): Promise<any>;
    getPrintJobStatus(id: string): Promise<any>;
    updatePrintJobStatus(id: string, data: any): Promise<any>;
    getPrintJobStatistics(params?: any): Promise<any>;
    getShippingOptions(params?: any): Promise<any>;
    createWebhook(data: any): Promise<any>;
    listWebhooks(params?: any): Promise<any>;
    getWebhook(id: string): Promise<any>;
    updateWebhook(id: string, data: any): Promise<any>;
    deleteWebhook(id: string): Promise<void>;
    testWebhookSubmission(id: string, topic: string): Promise<any>;
    listWebhookSubmissions(params?: any): Promise<any>;
    validateInterior(data: any): Promise<any>;
    getInteriorValidation(id: string): Promise<any>;
    calculateCoverDimensions(data: any): Promise<any>;
    validateCover(data: any): Promise<any>;
    getCoverValidation(id: string): Promise<any>;
}
export declare const createApiClient: () => LuluApiClient;
export declare const apiClient: LuluApiClient;
export default apiClient;
