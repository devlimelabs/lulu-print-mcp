import { PermissionConfig, OperationType, CollectionPermission } from "./types.js";

export class PermissionManager {
  private config: PermissionConfig;

  constructor(config: PermissionConfig) {
    this.config = config;
  }

  hasPermission(collectionId: string, operation: OperationType, documentId?: string, context?: any): boolean {
    // Default to config default if no specific permission is found
    let hasPermission = this.config.defaultAllow;
    
    // Find matching collection permission
    const collectionPermission = this.config.collections.find(
      (p) => p.collectionId === collectionId
    );
    
    if (collectionPermission) {
      // Check if operation is allowed
      hasPermission = collectionPermission.operations.includes(operation);
      
      // Check conditions if applicable
      if (hasPermission && collectionPermission.conditions && context) {
        hasPermission = this.evaluateConditions(collectionPermission, context);
      }
    }
    
    return hasPermission;
  }

  private evaluateConditions(permission: CollectionPermission, context: any): boolean {
    if (!permission.conditions || permission.conditions.length === 0) {
      return true;
    }
    
    return permission.conditions.every((condition) => {
      if (!condition.field || !condition.operator) {
        return true;
      }
      
      const fieldValue = this.getFieldValue(context, condition.field);
      const conditionValue = condition.value;
      
      switch (condition.operator) {
        case '==':
          return fieldValue === conditionValue;
        case '!=':
          return fieldValue !== conditionValue;
        case '>':
          return fieldValue > conditionValue;
        case '>=':
          return fieldValue >= conditionValue;
        case '<':
          return fieldValue < conditionValue;
        case '<=':
          return fieldValue <= conditionValue;
        case 'contains':
          return Array.isArray(fieldValue) && fieldValue.includes(conditionValue);
        default:
          return false;
      }
    });
  }

  private getFieldValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }
}