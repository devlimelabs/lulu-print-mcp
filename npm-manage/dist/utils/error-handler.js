/**
 * Error handling utilities for NPM Package Manager MCP
 */
export const handleError = (error) => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};
export const createErrorResponse = (error) => {
    return {
        content: [{ type: "text", text: `Error: ${handleError(error)}` }],
    };
};
//# sourceMappingURL=error-handler.js.map