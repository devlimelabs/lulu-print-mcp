import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import apiClient from '../utils/api-client.js';
import { createErrorResponse } from '../utils/error-handler.js';

// Schemas for input validation
const ShippingOptionsSchema = z.object({
  country_code: z.string().length(2),
  state_code: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  pod_package_id: z.string().optional(),
  page_count: z.number().int().positive().optional(),
  level: z.enum(['MAIL', 'PRIORITY_MAIL', 'GROUND', 'EXPEDITED', 'EXPRESS']).optional()
});

export const registerShippingTools = (server: McpServer) => {
  // Shipping tools are handled directly in server.ts using the API client
  // This file is kept for potential future expansion and custom shipping logic
};

export default registerShippingTools;