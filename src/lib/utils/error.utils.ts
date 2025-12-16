import type { ErrorResponseDTO } from '../../types';

/**
 * Error handling utilities for API responses
 * Provides standardized error response creation and error management
 */

/**
 * Standard error codes used across the application
 */
export enum ErrorCode {
  // Authentication errors
  MISSING_AUTH_HEADER = 'MISSING_AUTH_HEADER',
  INVALID_AUTH_FORMAT = 'INVALID_AUTH_FORMAT',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Resource errors
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  SECTOR_NOT_FOUND = 'SECTOR_NOT_FOUND',
  ASSET_NOT_FOUND = 'ASSET_NOT_FOUND',
  WATCHLIST_ITEM_NOT_FOUND = 'WATCHLIST_ITEM_NOT_FOUND',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  INVALID_GRID_POSITION = 'INVALID_GRID_POSITION',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Generic errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

/**
 * Custom error classes for different types of errors
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(`Validation error: ${message}`);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(`Database error: ${message}`);
    this.name = 'DatabaseError';
  }
}

/**
 * Creates a standardized error response DTO
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  statusCode: number,
  field?: string
): ErrorResponseDTO {
  const errorResponse: ErrorResponseDTO = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
    },
  };

  if (field) {
    errorResponse.error.field = field;
  }

  return errorResponse;
}

/**
 * Creates a standardized error Response object for API routes
 */
export function createErrorResponseObject(
  code: ErrorCode,
  message: string,
  statusCode: number,
  field?: string
): Response {
  const errorResponse = createErrorResponse(code, message, statusCode, field);

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handles service layer errors and converts them to appropriate HTTP responses
 */
export function handleServiceError(error: unknown): Response {
  if (error instanceof ValidationError) {
    return createErrorResponseObject(
      ErrorCode.VALIDATION_ERROR,
      error.message.replace('Validation error: ', ''),
      400,
      error.field
    );
  }

  if (error instanceof Error) {
    // Handle specific service errors
    if (error.message === 'Profile not found') {
      return createErrorResponseObject(
        ErrorCode.PROFILE_NOT_FOUND,
        'Profile not found',
        404
      );
    }

    if (error.message === 'Sector not found') {
      return createErrorResponseObject(
        ErrorCode.SECTOR_NOT_FOUND,
        'Sector not found',
        404
      );
    }

    if (error.message === 'Asset not found') {
      return createErrorResponseObject(
        ErrorCode.ASSET_NOT_FOUND,
        'Asset not found',
        404
      );
    }

    if (error.message === 'Watchlist item not found') {
      return createErrorResponseObject(
        ErrorCode.WATCHLIST_ITEM_NOT_FOUND,
        'Watchlist item not found',
        404
      );
    }

    if (error.message.startsWith('Database error:')) {
      return createErrorResponseObject(
        ErrorCode.DATABASE_ERROR,
        'Internal server error',
        500
      );
    }

    // Fallback for string-based validation errors (legacy or from other sources)
    if (error.message.startsWith('Validation error:')) {
      return createErrorResponseObject(
        ErrorCode.VALIDATION_ERROR,
        error.message.replace('Validation error: ', ''),
        400
      );
    }
  }

  // Generic error handling
  console.error('Unexpected error:', error);
  return createErrorResponseObject(
    ErrorCode.INTERNAL_ERROR,
    'Internal server error',
    500
  );
}
