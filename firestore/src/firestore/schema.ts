import { FirestoreClient } from "./client.js";

export interface CollectionSchema {
  fields: {
    [key: string]: {
      type: string;
      example?: any;
    };
  };
}

export class SchemaManager {
  private client: FirestoreClient;
  private schemas: Map<string, CollectionSchema> = new Map();

  constructor(client: FirestoreClient) {
    this.client = client;
  }

  async inferSchema(collectionId: string, sampleSize: number = 5): Promise<CollectionSchema> {
    // Check if we already have this schema
    if (this.schemas.has(collectionId)) {
      return this.schemas.get(collectionId)!;
    }
    
    // Get a sample of documents to infer schema
    const documents = await this.client.getCollection(collectionId);
    const sampleDocs = documents.slice(0, sampleSize);
    
    if (sampleDocs.length === 0) {
      return { fields: {} };
    }
    
    // Infer schema from documents
    const fields: CollectionSchema['fields'] = {};
    
    for (const doc of sampleDocs) {
      const data = doc.data;
      
      for (const [key, value] of Object.entries(data)) {
        if (!fields[key]) {
          fields[key] = {
            type: this.inferType(value),
            example: value
          };
        }
      }
    }
    
    const schema = { fields };
    this.schemas.set(collectionId, schema);
    return schema;
  }

  private inferType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    
    // Check for Firestore specific types
    if (typeof value === 'object') {
      if (value._seconds !== undefined && value._nanoseconds !== undefined) {
        return 'timestamp';
      }
      if (value._latitude !== undefined && value._longitude !== undefined) {
        return 'geopoint';
      }
      return 'object';
    }
    
    return typeof value;
  }
}