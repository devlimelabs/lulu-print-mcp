export type OperationType = 'read' | 'write' | 'delete' | 'query';

export interface CollectionPermission {
  collectionId: string;
  operations: OperationType[];
  conditions?: {
    field?: string;
    operator?: string;
    value?: any;
  }[];
}

export interface PermissionConfig {
  collections: CollectionPermission[];
  defaultAllow: boolean;
}