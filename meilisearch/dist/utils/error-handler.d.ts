/**
 * Error handling utilities for Meilisearch API responses
 */
/**
 * Formats Meilisearch API errors for consistent error messaging
 *
 * @param error - The error from the API request
 * @returns A formatted error message
 */
export declare const handleApiError: (error: any) => string;
/**
 * Creates a standardized error response object for MCP tools
 *
 * @param error - The error from the API request
 * @returns An MCP tool response object with error flag
 */
export declare const createErrorResponse: (error: any) => {
    isError: boolean;
    content: {
        type: string;
        text: string;
    }[];
};
declare const _default: {
    handleApiError: (error: any) => string;
    createErrorResponse: (error: any) => {
        isError: boolean;
        content: {
            type: string;
            text: string;
        }[];
    };
};
export default _default;
