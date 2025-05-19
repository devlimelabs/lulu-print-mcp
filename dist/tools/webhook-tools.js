import { z } from 'zod';
// Schemas for input validation
const CreateWebhookSchema = z.object({
    url: z.string().url(),
    topics: z.array(z.enum(['PRINT_JOB_STATUS_CHANGED']))
});
const WebhookIdSchema = z.object({
    id: z.string()
});
const UpdateWebhookSchema = z.object({
    id: z.string(),
    url: z.string().url().optional(),
    topics: z.array(z.enum(['PRINT_JOB_STATUS_CHANGED'])).optional(),
    is_active: z.boolean().optional()
});
const TestWebhookSchema = z.object({
    id: z.string(),
    topic: z.enum(['PRINT_JOB_STATUS_CHANGED'])
});
const ListWebhookSubmissionsSchema = z.object({
    webhook_id: z.string().optional(),
    page: z.number().int().positive().optional(),
    page_size: z.number().int().positive().optional()
});
export const registerWebhookTools = (server) => {
    // Webhook tools are handled directly in server.ts using the API client
    // This file is kept for potential future expansion and custom webhook logic
};
export default registerWebhookTools;
//# sourceMappingURL=webhook-tools.js.map