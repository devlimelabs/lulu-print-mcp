/**
 * Error handling utilities for NPM Package Manager MCP
 */

export const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export const createErrorResponse = (error: unknown) => {
  return {
    content: [{ type: "text" as const, text: `Error: ${handleError(error)}` }],
  };
};