import { initializeApp, cert, ServiceAccount, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import fs from "fs";

export interface FirestoreClientOptions {
  projectId?: string;
  credentialPath?: string;
}

export class FirestoreClient {
  private app: App | null = null;
  private db: Firestore | null = null;
  private options: FirestoreClientOptions;

  constructor(options: FirestoreClientOptions) {
    this.options = options;
  }

  async initialize() {
    if (this.app) return;

    try {
      // Initialize Firebase app
      if (this.options.credentialPath) {
        const serviceAccount = JSON.parse(
          fs.readFileSync(this.options.credentialPath, "utf8")
        ) as ServiceAccount;

        this.app = initializeApp({
          credential: cert(serviceAccount),
          projectId: this.options.projectId || serviceAccount.project_id,
        });
      } else {
        // Use default app credentials
        this.app = initializeApp();
      }

      // Initialize Firestore
      this.db = getFirestore(this.app);
      console.error("Firestore client initialized successfully");
    } catch (error) {
      console.error("Error initializing Firestore client:", error);
      throw error;
    }
  }

  get firestore() {
    if (!this.db) {
      throw new Error("Firestore client not initialized");
    }
    return this.db;
  }

  async getCollections() {
    const collections = await this.firestore.listCollections();
    return collections.map((col) => col.id);
  }

  async getCollection(collectionId: string) {
    const snapshot = await this.firestore.collection(collectionId).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }));
  }

  async getDocument(collectionId: string, documentId: string) {
    const docRef = this.firestore.collection(collectionId).doc(documentId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      data: doc.data(),
    };
  }

  async createDocument(collectionId: string, data: any, documentId?: string) {
    const collectionRef = this.firestore.collection(collectionId);
    
    let docRef;
    if (documentId) {
      docRef = collectionRef.doc(documentId);
      await docRef.set(data);
    } else {
      docRef = await collectionRef.add(data);
    }
    
    const newDoc = await docRef.get();
    return {
      id: newDoc.id,
      data: newDoc.data(),
    };
  }

  async updateDocument(collectionId: string, documentId: string, data: any) {
    const docRef = this.firestore.collection(collectionId).doc(documentId);
    await docRef.update(data);
    
    const updatedDoc = await docRef.get();
    return {
      id: updatedDoc.id,
      data: updatedDoc.data(),
    };
  }

  async deleteDocument(collectionId: string, documentId: string) {
    const docRef = this.firestore.collection(collectionId).doc(documentId);
    await docRef.delete();
    return { id: documentId };
  }

  async queryCollection(
    collectionId: string, 
    filters: Array<{field: string; operator: string; value: any}>, 
    limit?: number,
    orderBy?: {field: string; direction: 'asc' | 'desc'}
  ) {
    let query = this.firestore.collection(collectionId);
    
    // Apply filters
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator as any, filter.value);
    });
    
    // Apply order
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction);
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }));
  }
}