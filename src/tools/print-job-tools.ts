import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import apiClient from '../utils/api-client.js';
import { createErrorResponse } from '../utils/error-handler.js';

// Schemas for input validation
const CreatePrintJobSchema = z.object({
  line_items: z.array(z.object({
    title: z.string(),
    cover_url: z.string().url(),
    interior_url: z.string().url(),
    pod_package_id: z.string(),
    quantity: z.number().int().positive()
  })),
  shipping_address: z.object({
    name: z.string(),
    street1: z.string(),
    city: z.string(),
    country_code: z.string().length(2),
    postcode: z.string(),
    phone_number: z.string()
  }),
  contact_email: z.string().email(),
  shipping_level: z.enum(['MAIL', 'PRIORITY_MAIL', 'GROUND', 'EXPEDITED', 'EXPRESS']),
  external_id: z.string().optional()
});

const ListPrintJobsSchema = z.object({
  page: z.number().int().positive().optional(),
  page_size: z.number().int().positive().optional(),
  status: z.string().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional()
});

const PrintJobIdSchema = z.object({
  id: z.string()
});

const UpdatePrintJobSchema = z.object({
  id: z.string(),
  external_id: z.string().optional(),
  contact_email: z.string().email().optional()
});

const GetStatisticsSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  group_by: z.enum(['DAY', 'WEEK', 'MONTH']).optional()
});

export const registerPrintJobTools = (server: McpServer) => {
  // Print job tools are handled directly in server.ts using the API client
  // This file is kept for potential future expansion and custom validation
};

export default registerPrintJobTools;