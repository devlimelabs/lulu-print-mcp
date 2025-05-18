/**
 * Utility functions for standardized error handling in the Domain Radar MCP
 */
/**
 * Standardizes API error handling
 * @param error - The error to handle
 * @returns A standardized error message string
 */
export declare const handleApiError: (error: any) => string;
/**
 * Creates a standardized error response for MCP tools
 * @param error - The error to convert to a response
 * @returns A properly formatted MCP error response
 */
export declare const createErrorResponse: (error: any) => {
    isError: boolean;
    content: {
        type: "text";
        text: string;
    }[];
    structuredContent: {
        error: string;
    };
};
/**
 * Creates a standardized success response for MCP tools
 * @param text - The success message or data
 * @returns A properly formatted MCP success response
 */
export declare const createSuccessResponse: (text: string) => {
    content: {
        type: "text";
        text: string;
    }[];
    structuredContent: {
        success: boolean;
    };
};
/**
 * Creates a standardized JSON response for MCP tools
 * @param data - The data object to stringify
 * @returns A properly formatted MCP response with JSON data
 */
export declare const createJsonResponse: (data: any) => {
    content: {
        type: "text";
        text: string;
    }[];
    structuredContent: any;
};
