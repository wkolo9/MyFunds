import { z } from 'zod';

// Common schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

// Command schemas
export const registerCommandSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginCommandSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordCommandSchema = z.object({
  email: emailSchema,
});

export const resetPasswordCommandSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Export types
export type RegisterCommand = z.infer<typeof registerCommandSchema>;
export type LoginCommand = z.infer<typeof loginCommandSchema>;
export type ForgotPasswordCommand = z.infer<typeof forgotPasswordCommandSchema>;
export type ResetPasswordCommand = z.infer<typeof resetPasswordCommandSchema>;

