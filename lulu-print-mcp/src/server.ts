import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import apiClient, { LuluApiClient } from './utils/api-client.js';
import { createErrorResponse } from './utils/error-handler.js';
import registerCostTools from './tools/cost-tools.js';
import registerPrintJobTools from './tools/print-job-tools.js';
import registerValidationTools from './tools/validation-tools.js';
import registerWebhookTools from './tools/webhook-tools.js';
import registerShippingTools from './tools/shipping-tools.js';

export class LuluPrintMcpServer {
  private server: McpServer;
  private apiClient: LuluApiClient;

  constructor() {
    this.server = new McpServer({
      name: "lulu-print",
      version: "0.1.0",
    });
    
    this.apiClient = apiClient;
    this.setupHandlers();
    this.registerTools();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Cost Calculation Tools
          {
            name: "calculate-print-job-cost",
            description: "Calculate the cost of a print job without creating it. Includes product, shipping, and tax costs.",
            inputSchema: {
              type: "object",
              properties: {
                line_items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      pod_package_id: { type: "string", description: "Product SKU (e.g., '0600X0900BWSTDPB060UW444MXX')" },
                      page_count: { type: "integer", description: "Number of pages in the book" },
                      quantity: { type: "integer", description: "Number of copies" }
                    },
                    required: ["pod_package_id", "page_count", "quantity"]
                  },
                  description: "Items to calculate costs for"
                },
                shipping_address: {
                  type: "object",
                  properties: {
                    street1: { type: "string" },
                    city: { type: "string" },
                    country_code: { type: "string", description: "2-letter ISO country code" },
                    postcode: { type: "string" },
                    phone_number: { type: "string" }
                  },
                  required: ["street1", "city", "country_code", "postcode", "phone_number"]
                },
                shipping_option: {
                  type: "string",
                  enum: ["MAIL", "PRIORITY_MAIL", "GROUND", "EXPEDITED", "EXPRESS"],
                  description: "Shipping speed option"
                }
              },
              required: ["line_items", "shipping_address", "shipping_option"]
            },
          },
          
          // Print Job Management Tools
          {
            name: "create-print-job",
            description: "Create a new print job order",
            inputSchema: {
              type: "object",
              properties: {
                line_items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Title of the book" },
                      cover_url: { type: "string", description: "URL to cover PDF file" },
                      interior_url: { type: "string", description: "URL to interior PDF file" },
                      pod_package_id: { type: "string" },
                      quantity: { type: "integer" }
                    },
                    required: ["title", "cover_url", "interior_url", "pod_package_id", "quantity"]
                  }
                },
                shipping_address: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    street1: { type: "string" },
                    city: { type: "string" },
                    country_code: { type: "string" },
                    postcode: { type: "string" },
                    phone_number: { type: "string" }
                  },
                  required: ["name", "street1", "city", "country_code", "postcode", "phone_number"]
                },
                contact_email: { type: "string", format: "email" },
                shipping_level: {
                  type: "string",
                  enum: ["MAIL", "PRIORITY_MAIL", "GROUND", "EXPEDITED", "EXPRESS"]
                },
                external_id: { type: "string", description: "Your order reference number" }
              },
              required: ["line_items", "shipping_address", "contact_email", "shipping_level"]
            },
          },
          {
            name: "list-print-jobs",
            description: "List print jobs with optional filters",
            inputSchema: {
              type: "object",
              properties: {
                page: { type: "integer", description: "Page number (default: 1)" },
                page_size: { type: "integer", description: "Number of results per page (default: 10)" },
                status: { type: "string", description: "Filter by status" },
                created_after: { type: "string", format: "date-time", description: "Filter by creation date" },
                created_before: { type: "string", format: "date-time", description: "Filter by creation date" }
              }
            },
          },
          {
            name: "get-print-job",
            description: "Get details of a specific print job",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Print job ID" }
              },
              required: ["id"]
            },
          },
          {
            name: "update-print-job",
            description: "Update a print job (only before payment)",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Print job ID" },
                external_id: { type: "string", description: "New external reference" },
                contact_email: { type: "string", format: "email", description: "New contact email" }
              },
              required: ["id"]
            },
          },
          {
            name: "cancel-print-job",
            description: "Cancel a print job (only if unpaid)",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Print job ID" }
              },
              required: ["id"]
            },
          },
          {
            name: "get-print-job-costs",
            description: "Get detailed costs for a print job",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Print job ID" }
              },
              required: ["id"]
            },
          },
          {
            name: "get-print-job-status",
            description: "Get the current status of a print job",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Print job ID" }
              },
              required: ["id"]
            },
          },
          {
            name: "get-print-job-statistics",
            description: "Get statistics for print jobs over a time period",
            inputSchema: {
              type: "object",
              properties: {
                start_date: { type: "string", format: "date", description: "Start date (YYYY-MM-DD)" },
                end_date: { type: "string", format: "date", description: "End date (YYYY-MM-DD)" },
                group_by: {
                  type: "string",
                  enum: ["DAY", "WEEK", "MONTH"],
                  description: "Grouping period"
                }
              }
            },
          },
          
          // Validation Tools
          {
            name: "validate-interior-file",
            description: "Validate an interior PDF file for printing",
            inputSchema: {
              type: "object",
              properties: {
                file_url: { type: "string", description: "URL to the interior PDF file" },
                pod_package_id: { type: "string", description: "Product SKU (optional for normalization)" }
              },
              required: ["file_url"]
            },
          },
          {
            name: "get-interior-validation",
            description: "Get the status of an interior file validation",
            inputSchema: {
              type: "object",
              properties: {
                validation_id: { type: "string", description: "Validation ID returned from validate-interior-file" }
              },
              required: ["validation_id"]
            },
          },
          {
            name: "calculate-cover-dimensions",
            description: "Calculate required cover dimensions based on interior specifications",
            inputSchema: {
              type: "object",
              properties: {
                pod_package_id: { type: "string", description: "Product SKU" },
                page_count: { type: "integer", description: "Number of pages" },
                unit: {
                  type: "string",
                  enum: ["IN", "MM", "PT"],
                  description: "Unit for dimensions (default: PT)"
                }
              },
              required: ["pod_package_id", "page_count"]
            },
          },
          {
            name: "validate-cover-file",
            description: "Validate a cover PDF file for printing",
            inputSchema: {
              type: "object",
              properties: {
                file_url: { type: "string", description: "URL to the cover PDF file" },
                pod_package_id: { type: "string", description: "Product SKU" },
                page_count: { type: "integer", description: "Number of interior pages" }
              },
              required: ["file_url", "pod_package_id", "page_count"]
            },
          },
          {
            name: "get-cover-validation",
            description: "Get the status of a cover file validation",
            inputSchema: {
              type: "object",
              properties: {
                validation_id: { type: "string", description: "Validation ID returned from validate-cover-file" }
              },
              required: ["validation_id"]
            },
          },
          
          // Shipping Tools
          {
            name: "get-shipping-options",
            description: "Get available shipping options for a destination",
            inputSchema: {
              type: "object",
              properties: {
                country_code: { type: "string", description: "2-letter ISO country code" },
                state_code: { type: "string", description: "State/province code (for US, CA, AU)" },
                quantity: { type: "integer", description: "Number of items to ship" },
                pod_package_id: { type: "string", description: "Product SKU" },
                page_count: { type: "integer", description: "Number of pages" },
                level: {
                  type: "string",
                  enum: ["MAIL", "PRIORITY_MAIL", "GROUND", "EXPEDITED", "EXPRESS"],
                  description: "Filter by specific shipping level"
                }
              },
              required: ["country_code"]
            },
          },
          
          // Webhook Tools
          {
            name: "create-webhook",
            description: "Create a webhook subscription",
            inputSchema: {
              type: "object",
              properties: {
                url: { type: "string", format: "uri", description: "Webhook endpoint URL" },
                topics: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["PRINT_JOB_STATUS_CHANGED"]
                  },
                  description: "Events to subscribe to"
                }
              },
              required: ["url", "topics"]
            },
          },
          {
            name: "list-webhooks",
            description: "List all webhook subscriptions",
            inputSchema: {
              type: "object",
              properties: {}
            },
          },
          {
            name: "get-webhook",
            description: "Get details of a specific webhook",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Webhook ID" }
              },
              required: ["id"]
            },
          },
          {
            name: "update-webhook",
            description: "Update a webhook subscription",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Webhook ID" },
                url: { type: "string", format: "uri", description: "New webhook URL" },
                topics: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["PRINT_JOB_STATUS_CHANGED"]
                  },
                  description: "New list of topics"
                },
                is_active: { type: "boolean", description: "Enable/disable webhook" }
              },
              required: ["id"]
            },
          },
          {
            name: "delete-webhook",
            description: "Delete a webhook subscription",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Webhook ID" }
              },
              required: ["id"]
            },
          },
          {
            name: "test-webhook",
            description: "Send a test webhook submission",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string", description: "Webhook ID" },
                topic: {
                  type: "string",
                  enum: ["PRINT_JOB_STATUS_CHANGED"],
                  description: "Topic to test"
                }
              },
              required: ["id", "topic"]
            },
          },
          {
            name: "list-webhook-submissions",
            description: "List recent webhook submissions (last 30 days)",
            inputSchema: {
              type: "object",
              properties: {
                webhook_id: { type: "string", description: "Filter by webhook ID" },
                page: { type: "integer", description: "Page number" },
                page_size: { type: "integer", description: "Results per page" }
              }
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const handlers: { [key: string]: (args: any) => Promise<any> } = {
          // Cost Tools
          'calculate-print-job-cost': (args) => this.apiClient.calculatePrintJobCost(args),
          
          // Print Job Tools
          'create-print-job': (args) => this.apiClient.createPrintJob(args),
          'list-print-jobs': (args) => this.apiClient.listPrintJobs(args),
          'get-print-job': (args) => this.apiClient.getPrintJob(args.id),
          'update-print-job': async (args) => {
            const { id, ...updateData } = args;
            return this.apiClient.updatePrintJob(id, updateData);
          },
          'cancel-print-job': async (args) => {
            return this.apiClient.updatePrintJobStatus(args.id, { name: 'CANCELED' });
          },
          'get-print-job-costs': (args) => this.apiClient.getPrintJobCosts(args.id),
          'get-print-job-status': (args) => this.apiClient.getPrintJobStatus(args.id),
          'get-print-job-statistics': (args) => this.apiClient.getPrintJobStatistics(args),
          
          // Validation Tools
          'validate-interior-file': (args) => this.apiClient.validateInterior(args),
          'get-interior-validation': (args) => this.apiClient.getInteriorValidation(args.validation_id),
          'calculate-cover-dimensions': (args) => this.apiClient.calculateCoverDimensions(args),
          'validate-cover-file': (args) => this.apiClient.validateCover(args),
          'get-cover-validation': (args) => this.apiClient.getCoverValidation(args.validation_id),
          
          // Shipping Tools
          'get-shipping-options': (args) => this.apiClient.getShippingOptions(args),
          
          // Webhook Tools
          'create-webhook': (args) => this.apiClient.createWebhook(args),
          'list-webhooks': (args) => this.apiClient.listWebhooks(args),
          'get-webhook': (args) => this.apiClient.getWebhook(args.id),
          'update-webhook': async (args) => {
            const { id, ...updateData } = args;
            return this.apiClient.updateWebhook(id, updateData);
          },
          'delete-webhook': async (args) => {
            await this.apiClient.deleteWebhook(args.id);
            return { message: 'Webhook deleted successfully' };
          },
          'test-webhook': (args) => this.apiClient.testWebhookSubmission(args.id, args.topic),
          'list-webhook-submissions': (args) => this.apiClient.listWebhookSubmissions(args),
        };

        const handler = handlers[name];
        if (!handler) {
          throw new Error(`Unknown tool: ${name}`);
        }

        const result = await handler(args);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return createErrorResponse(error);
      }
    });
  }

  private registerTools(): void {
    registerCostTools(this.server);
    registerPrintJobTools(this.server);
    registerValidationTools(this.server);
    registerWebhookTools(this.server);
    registerShippingTools(this.server);
  }

  async connect(transport: StdioServerTransport): Promise<void> {
    await this.server.connect(transport);
  }
}

export let server: LuluPrintMcpServer;

export const initializeServer = async (): Promise<void> => {
  server = new LuluPrintMcpServer();
};