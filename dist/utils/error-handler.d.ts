export declare const handleApiError: (error: any) => string;
export declare const createErrorResponse: (error: any) => {
    content: {
        type: string;
        text: string;
    }[];
};
