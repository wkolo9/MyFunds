import { z } from 'zod';

export const createAssetSchema = z.object({
  ticker: z.string().min(1, "Ticker is required").max(10, "Ticker is too long"),
  quantity: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Quantity must be a positive number"),
  sector_id: z.string().uuid().nullable().optional(),
});

export const updateAssetSchema = z.object({
  quantity: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Quantity must be a positive number").optional(),
  sector_id: z.string().uuid().nullable().optional(),
}).refine(data => data.quantity !== undefined || data.sector_id !== undefined, {
  message: "At least one field must be provided for update"
});

export const querySchema = z.object({
  currency: z.enum(['USD', 'PLN']).optional(),
  sector_id: z.union([z.string().uuid(), z.literal('null')]).optional(),
});

