import { AxiosError } from 'axios';

export const handleApiError = (error: any): string => {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      // Common HTTP status errors
      switch (status) {
        case 400:
          return `Bad Request: ${JSON.stringify(data, null, 2)}`;
        case 401:
          return 'Unauthorized: Invalid or expired API credentials';
        case 403:
          return 'Forbidden: You do not have permission to access this resource';
        case 404:
          return 'Not Found: The requested resource does not exist';
        case 409:
          return `Conflict: ${JSON.stringify(data, null, 2)}`;
        case 422:
          return `Validation Error: ${JSON.stringify(data, null, 2)}`;
        case 429:
          return 'Too Many Requests: Rate limit exceeded';
        case 500:
          return 'Internal Server Error: The server encountered an error';
        case 503:
          return 'Service Unavailable: The service is temporarily unavailable';
        default:
          return `HTTP Error ${status}: ${JSON.stringify(data, null, 2)}`;
      }
    } else if (error.request) {
      return 'Network Error: No response received from server';
    } else {
      return `Request Error: ${error.message}`;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return `Unknown error: ${String(error)}`;
};

export const createErrorResponse = (error: any) => {
  return {
    content: [
      {
        type: "text",
        text: handleApiError(error)
      }
    ]
  };
};