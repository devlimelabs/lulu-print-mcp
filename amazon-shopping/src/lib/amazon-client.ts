import axios from "axios";
import { createHmac } from "crypto";
import { parseStringPromise } from "xml2js";

// Environment variables validation
export function validateCredentials(): void {
  const requiredEnvVars = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_ASSOCIATE_TAG",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
    process.exit(1);
  }

  // Set default region if not provided
  if (!process.env.AWS_REGION) {
    process.env.AWS_REGION = "US";
  }
}

// Amazon API endpoints by region
const API_ENDPOINTS: { [key: string]: string } = {
  US: "webservices.amazon.com",
  CA: "webservices.amazon.ca",
  DE: "webservices.amazon.de",
  ES: "webservices.amazon.es",
  FR: "webservices.amazon.fr",
  IN: "webservices.amazon.in",
  IT: "webservices.amazon.it",
  JP: "webservices.amazon.jp",
  UK: "webservices.amazon.co.uk",
};

// Helper function to get the API endpoint based on region
export function getEndpoint(): string {
  const region = process.env.AWS_REGION || "US";
  return API_ENDPOINTS[region] || API_ENDPOINTS.US;
}

// Generate timestamp in ISO8601 format
function getTimestamp(): string {
  return new Date().toISOString().replace(/\\..+/, "Z");
}

// Sign the request with AWS signature version 2
function signRequest(params: Record<string, string>): string {
  // Create the canonical query string
  const canonicalQS = Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&");

  // Create the string to sign
  const stringToSign = `GET\\n${getEndpoint()}\\n/onca/xml\\n${canonicalQS}`;

  // Calculate the signature
  const signature = createHmac(
    "sha256",
    process.env.AWS_SECRET_ACCESS_KEY || ""
  )
    .update(stringToSign)
    .digest("base64");

  // Return the canonical query string with the signature
  return `${canonicalQS}&Signature=${encodeURIComponent(signature)}`;
}

// Make a request to the Amazon Product Advertising API
export async function makeRequest(
  operation: string,
  params: Record<string, string>
): Promise<any> {
  // Prepare request parameters
  const requestParams: Record<string, string> = {
    Service: "AWSECommerceService",
    Operation: operation,
    AWSAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    AssociateTag: process.env.AWS_ASSOCIATE_TAG || "",
    Timestamp: getTimestamp(),
    ...params,
  };

  // Sign the request
  const signedQuery = signRequest(requestParams);
  const url = `https://${getEndpoint()}/onca/xml?${signedQuery}`;

  try {
    // Make the request
    const response = await axios.get(url);
    
    // Parse XML response to JSON
    const result = await parseStringPromise(response.data, {
      explicitArray: false,
      mergeAttrs: true,
    });
    
    // Check for errors
    if (result.ItemSearchErrorResponse) {
      throw new Error(
        result.ItemSearchErrorResponse.Error.Message || "Unknown error"
      );
    } else if (result.ErrorResponse) {
      throw new Error(
        result.ErrorResponse.Error.Message || "Unknown error"
      );
    }
    
    return result;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        `API Error: ${error.response.status} - ${error.response.statusText}`
      );
      throw new Error(`Amazon API Error: ${error.response.statusText}`);
    }
    throw error;
  }
}

// Product search functionality
export async function searchProducts(
  keywords: string,
  options: {
    searchIndex?: string;
    sort?: string;
    responseGroups?: string[];
    page?: number;
  } = {}
): Promise<any> {
  const { searchIndex = "All", sort = "relevancerank", responseGroups = ["ItemAttributes", "Images", "Offers"], page = 1 } = options;
  
  const params: Record<string, string> = {
    Keywords: keywords,
    SearchIndex: searchIndex,
    Sort: sort,
    ResponseGroup: responseGroups.join(","),
    ItemPage: page.toString(),
  };

  return makeRequest("ItemSearch", params);
}

// Get product details by ASIN
export async function getProductDetails(
  asin: string,
  responseGroups: string[] = ["ItemAttributes", "Images", "Offers"]
): Promise<any> {
  const params: Record<string, string> = {
    ItemId: asin,
    ResponseGroup: responseGroups.join(","),
    IdType: "ASIN",
  };

  return makeRequest("ItemLookup", params);
}

// Create a remote cart with items
export async function createCart(
  items: Array<{ asin: string; quantity: number }>
): Promise<any> {
  const params: Record<string, string> = {};
  
  items.forEach((item, index) => {
    params[`Item.${index + 1}.ASIN`] = item.asin;
    params[`Item.${index + 1}.Quantity`] = item.quantity.toString();
  });

  return makeRequest("CartCreate", params);
}

// Add items to an existing cart
export async function addToCart(
  cartId: string,
  hmac: string,
  items: Array<{ asin: string; quantity: number }>
): Promise<any> {
  const params: Record<string, string> = {
    CartId: cartId,
    HMAC: hmac,
  };
  
  items.forEach((item, index) => {
    params[`Item.${index + 1}.ASIN`] = item.asin;
    params[`Item.${index + 1}.Quantity`] = item.quantity.toString();
  });

  return makeRequest("CartAdd", params);
}

// View items in a cart
export async function viewCart(cartId: string, hmac: string): Promise<any> {
  const params: Record<string, string> = {
    CartId: cartId,
    HMAC: hmac,
  };

  return makeRequest("CartGet", params);
}

// Generate a checkout URL for the cart
export function generateCheckoutUrl(cartId: string, hmac: string): string {
  // The Amazon checkout URL format
  const region = process.env.AWS_REGION || "US";
  const domain = region === "UK" ? "amazon.co.uk" : `amazon.${region.toLowerCase()}`;
  
  return `https://www.${domain}/gp/cart/aws-merge.html?cart-id=${cartId}&associate-id=${
    process.env.AWS_ASSOCIATE_TAG
  }&hmac=${hmac}&url-encoding-type=RFC1738`;
}
