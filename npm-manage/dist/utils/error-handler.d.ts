/**
 * Error handling utilities for NPM Package Manager MCP
 */
export declare const handleError: (error: unknown) => string;
export declare const createErrorResponse: (error: unknown) => {
    content: {
        type: "text";
        text: string;
    }[];
};
