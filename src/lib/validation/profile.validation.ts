import { z } from 'zod';

/**
 * Profile validation schemas using Zod
 * Currently minimal validation since GET /api/profile has no request body
 * Schemas defined for future use (PATCH endpoint)
 */

/**
 * Currency validation schema
 */
export const currencySchema = z.enum(['USD', 'PLN']);

/**
 * Profile response validation schema
 * Validates the structure of ProfileDTO returned by the API
 */
export const profileResponseSchema = z.object({
  user_id: z.string().uuid(),
  preferred_currency: currencySchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Update profile command validation schema
 * For future PATCH /api/profile endpoint
 */
export const updateProfileCommandSchema = z.object({
  preferred_currency: currencySchema,
});

/**
 * Authorization header validation
 * Validates Bearer token format
 */
export const authorizationHeaderSchema = z
  .string()
  .regex(/^Bearer\s+.+$/, 'Authorization header must be in format: Bearer <token>');

/**
 * Type exports for TypeScript
 */
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
export type UpdateProfileCommand = z.infer<typeof updateProfileCommandSchema>;
