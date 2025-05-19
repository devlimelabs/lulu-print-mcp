import { z } from 'zod';
// Schemas for input validation
const ValidateInteriorSchema = z.object({
    file_url: z.string().url(),
    pod_package_id: z.string().optional()
});
const ValidationIdSchema = z.object({
    validation_id: z.string()
});
const CoverDimensionsSchema = z.object({
    pod_package_id: z.string(),
    page_count: z.number().int().positive(),
    unit: z.enum(['IN', 'MM', 'PT']).optional()
});
const ValidateCoverSchema = z.object({
    file_url: z.string().url(),
    pod_package_id: z.string(),
    page_count: z.number().int().positive()
});
export const registerValidationTools = (server) => {
    // Validation tools are handled directly in server.ts using the API client
    // This file is kept for potential future expansion and custom validation logic
};
export default registerValidationTools;
//# sourceMappingURL=validation-tools.js.map