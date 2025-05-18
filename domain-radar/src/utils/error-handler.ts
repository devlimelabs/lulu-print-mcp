/**
 * Utility functions for standardized error handling in the Domain Radar MCP
 */

/**
 * Standardizes API error handling
 * @param error - The error to handle
 * @returns A standardized error message string
 */
export const handleApiError = (error: any): string => {
  if (error instanceof Error) {
    // Process standard Error objects
    return `API Error: ${error.message}`;
  } else if (typeof error === 'string') {
    // Handle string errors
    return `API Error: ${error}`;
  } else if (error && typeof error === 'object') {
    // Handle error objects from APIs
    if ('message' in error) {
      return `API Error: ${error.message}`;
    } else if ('error' in error) {
      return `API Error: ${error.error}`;
    } else {
      return `API Error: ${JSON.stringify(error)}`;
    }
  }
  
  // Default case for unknown error types
  return `API Error: Unknown error occurred`;
};

/**
 * Creates a standardized error response for MCP tools
 * @param error - The error to convert to a response
 * @returns A properly formatted MCP error response
 */
export const createErrorResponse = (error: any) => {
  const errorMessage = handleApiError(error);
  return {
    isError: true,
    content: [{ type: "text" as const, text: errorMessage }],
    structuredContent: { error: errorMessage }
  };
};

/**
 * Creates a standardized success response for MCP tools
 * @param text - The success message or data
 * @returns A properly formatted MCP success response
 */
export const createSuccessResponse = (text: string) => {
  return {
    content: [{ type: "text" as const, text }],
    structuredContent: { success: true }
  };
};

/**
 * Creates a standardized JSON response for MCP tools
 * @param data - The data object to stringify
 * @returns A properly formatted MCP response with JSON data
 */
export const createJsonResponse = (data: any) => {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data
  };
};