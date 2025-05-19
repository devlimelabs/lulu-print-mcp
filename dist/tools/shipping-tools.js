import { z } from 'zod';
// Schemas for input validation
const ShippingOptionsSchema = z.object({
    country_code: z.string().length(2),
    state_code: z.string().optional(),
    quantity: z.number().int().positive().optional(),
    pod_package_id: z.string().optional(),
    page_count: z.number().int().positive().optional(),
    level: z.enum(['MAIL', 'PRIORITY_MAIL', 'GROUND', 'EXPEDITED', 'EXPRESS']).optional()
});
export const registerShippingTools = (server) => {
    // Shipping tools are handled directly in server.ts using the API client
    // This file is kept for potential future expansion and custom shipping logic
};
export default registerShippingTools;
//# sourceMappingURL=shipping-tools.js.map