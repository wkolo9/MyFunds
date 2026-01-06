import { z } from 'zod';

export const createWatchlistItemSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required').max(10, 'Ticker is too long'),
  grid_position: z.number().int().min(0).max(15, 'Grid position must be between 0 and 15'),
});

export const watchlistItemUpdateSchema = z.object({
  id: z.string().uuid('Invalid item ID'),
  grid_position: z.number().int().min(0).max(15, 'Grid position must be between 0 and 15').optional(),
  ticker: z.string().min(1).max(10).optional(),
}).refine(data => data.grid_position !== undefined || data.ticker !== undefined, {
  message: "At least one of 'grid_position' or 'ticker' must be provided",
});

export const batchUpdateWatchlistItemsSchema = z.object({
  updates: z.array(watchlistItemUpdateSchema).min(1, 'At least one update is required'),
});

export type CreateWatchlistItemSchema = z.infer<typeof createWatchlistItemSchema>;
export type BatchUpdateWatchlistItemsSchema = z.infer<typeof batchUpdateWatchlistItemsSchema>;





