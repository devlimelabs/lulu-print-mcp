import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import apiClient from '../utils/api-client.js';
import { createErrorResponse } from '../utils/error-handler.js';

// Schemas for input validation
const CostCalculationSchema = z.object({
  line_items: z.array(z.object({
    pod_package_id: z.string(),
    page_count: z.number().int().positive(),
    quantity: z.number().int().positive()
  })),
  shipping_address: z.object({
    street1: z.string(),
    city: z.string(),
    country_code: z.string().length(2),
    postcode: z.string(),
    phone_number: z.string()
  }),
  shipping_option: z.enum(['MAIL', 'PRIORITY_MAIL', 'GROUND', 'EXPEDITED', 'EXPRESS'])
});

export const registerCostTools = (server: McpServer) => {
  // Cost calculation is handled directly in server.ts using the API client
  // This file is kept for potential future expansion of cost-related tools
};

export default registerCostTools;