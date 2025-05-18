import { z } from "zod";

export const FilterSchema = z.object({
  field: z.string(),
  operator: z.enum(["==", "!=", ">", ">=", "<", "<=", "array-contains", "in", "array-contains-any", "not-in"]),
  value: z.any()
});

export const OrderBySchema = z.object({
  field: z.string(),
  direction: z.enum(["asc", "desc"])
});

export function validateJsonObject(json: string): Record<string, any> | null {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}