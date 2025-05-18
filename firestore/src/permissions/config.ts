import { PermissionConfig } from "./types.js";
import fs from "fs";

export function loadPermissionConfig(configPath: string): PermissionConfig {
  try {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    
    const configData = fs.readFileSync(configPath, "utf8");
    return JSON.parse(configData) as PermissionConfig;
  } catch (error) {
    throw new Error(`Failed to load permission config: ${error.message}`);
  }
}

export function createDefaultConfig(): PermissionConfig {
  return {
    collections: [],
    defaultAllow: false
  };
}

export function createReadOnlyConfig(collections: string[]): PermissionConfig {
  return {
    collections: collections.map(collectionId => ({
      collectionId,
      operations: ['read', 'query']
    })),
    defaultAllow: false
  };
}

export function createFullAccessConfig(): PermissionConfig {
  return {
    collections: [],
    defaultAllow: true
  };
}