import { z } from 'zod';

/**
 * Validation schema for creating a new sector
 * - name: 1-36 characters, required
 */
export const createSectorSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(36, 'Name must be 36 characters or less')
    .trim(),
});

/**
 * Validation schema for updating a sector
 * - name: 1-36 characters, required
 */
export const updateSectorSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(36, 'Name must be 36 characters or less')
    .trim(),
});

