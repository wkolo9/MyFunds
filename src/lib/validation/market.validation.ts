import { z } from 'zod';

/**
 * Market Data validation schemas
 */

/**
 * Ticker validation schema
 * Alphanumeric, 1-10 characters, uppercase
 */
export const tickerSchema = z
  .string()
  .min(1, 'Ticker cannot be empty')
  .max(10, 'Ticker cannot exceed 10 characters')
  .regex(/^[A-Z0-9.\-^]+$/, 'Ticker must be alphanumeric')
  .transform((val) => val.toUpperCase());

/**
 * Ticker path parameter schema
 */
export const tickerParamSchema = z.object({
  ticker: tickerSchema,
});

