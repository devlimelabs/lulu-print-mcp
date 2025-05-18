// Type definitions for Tailwind Designer MCP

// Supported design websites
export type DesignSite = "dribbble" | "behance" | "siteinspire";

// Design search result item
export interface DesignSearchResult {
  title: string;
  thumbnailUrl: string | null;
  pageUrl: string | null;
}

// Design search response
export interface DesignSearchResponse {
  site: DesignSite;
  query?: string;
  resultsCount: number;
  results: DesignSearchResult[];
}

// Saved design image
export interface SavedImage {
  id: string;
  url: string;
  sourceUrl: string;
  sourceSite: DesignSite;
  localPath: string;
  title: string;
  timestamp: string;
  tags: string[];
}

// Component types
export type ComponentType = 
  | "card" 
  | "button" 
  | "navbar" 
  | "hero" 
  | "footer" 
  | "form" 
  | "sidebar" 
  | "modal" 
  | "pricing" 
  | "feature";

// Color scheme options
export type ColorScheme = 
  | "match"
  | "light"
  | "dark"
  | "colorful"
  | "monochrome"
  | "brand";

// Component complexity levels
export type ComplexityLevel = "simple" | "medium" | "complex";