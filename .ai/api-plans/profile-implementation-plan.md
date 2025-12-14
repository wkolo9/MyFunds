# API Endpoint Implementation Plan: Get User Profile

## 1. Endpoint Overview

The GET /api/profile endpoint retrieves the current authenticated user's profile information, including their preferred currency and account timestamps. This endpoint serves as the primary way for the frontend to access user-specific settings and preferences. The endpoint leverages Supabase's Row Level Security (RLS) policies to ensure users can only access their own profile data.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/profile`
- **Parameters**:
  - **Required**: 
    - `Authorization` header: Bearer token for user authentication
  - **Optional**: None
- **Request Body**: None (GET endpoint)

## 3. Used Types

- **Response Types**:
  - `ProfileDTO`: Primary response type matching database entity structure
  - `ErrorResponseDTO`: Standardized error response format
- **Entity Types**:
  - `ProfileEntity`: Database table structure (user_id, preferred_currency, created_at, updated_at)

## 4. Response Details

**Success Response (200 OK)**:
```json
{
  "user_id": "uuid",
  "preferred_currency": "USD",
  "created_at": "2025-12-10T10:00:00Z",
  "updated_at": "2025-12-10T10:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authorization token
- `404 Not Found`: User authenticated but profile record doesn't exist
- `500 Internal Server Error`: Database or server-side errors

## 5. Data Flow

1. **Authentication Check**: Validate Bearer token via Supabase auth
2. **User Context Extraction**: Extract user_id from authenticated session
3. **Database Query**: Query profiles table using Supabase client from context.locals
4. **RLS Enforcement**: Database policies automatically filter to user's own profile
5. **Response Formatting**: Transform entity data to ProfileDTO format
6. **Error Handling**: Catch and transform database/auth errors to appropriate HTTP responses

## 6. Security Considerations

- **Authentication Required**: All requests must include valid Bearer token
- **Authorization**: RLS policies prevent access to other users' profiles
- **Input Validation**: Minimal validation needed, but Authorization header format should be checked
- **Data Exposure**: Only user's own profile data is accessible
- **Token Security**: Never log full tokens, use proper error masking
- **Rate Limiting**: Consider implementing rate limiting for profile access (future enhancement)

## 7. Error Handling

- **401 Unauthorized**:
  - Missing Authorization header
  - Invalid token format
  - Expired or invalid token
  - Message: "Authentication required"

- **404 Not Found**:
  - User authenticated but no profile record exists
  - Message: "Profile not found"

- **500 Internal Server Error**:
  - Database connection failures
  - Supabase client errors
  - Unexpected server errors
  - Message: "Internal server error"

All errors follow the standardized ErrorResponseDTO format with appropriate error codes and timestamps.

## 8. Performance

- **Database Query**: Simple SELECT query with indexed user_id
- **Caching**: Consider caching profile data if accessed frequently
- **Connection Pooling**: Leverage Supabase's built-in connection management
- **Response Size**: Minimal payload (4 fields)
- **Concurrent Access**: RLS ensures isolation between users

## 9. Implementation Steps

1. **Create Profile Service** (`src/lib/services/profile.service.ts`):
   - Implement `getProfile(userId: string): Promise<ProfileEntity>` function
   - Handle database queries using SupabaseClient
   - Add proper error handling and logging

2. **Create Zod Validation Schema** (`src/lib/validation/profile.validation.ts`):
   - Define schema for any future input validation
   - Currently minimal (only auth validation)

3. **Implement API Route** (`src/pages/api/profile.ts`):
   - Use uppercase GET handler
   - Set `export const prerender = false`
   - Extract supabase client from `context.locals`
   - Validate authentication
   - Call profile service,
   - Return appropriate response or error

4. **Add Error Handling Utilities**:
   - Create error response helpers in `src/lib/utils/error.utils.ts`
   - Implement consistent error formatting

5. **Update Middleware** (if needed):
   - Ensure authentication middleware is properly configured
   - Add any profile-specific middleware if required

6. **Testing Implementation**:
   - Unit tests for profile service
   - Integration tests for API endpoint
   - Test authentication scenarios (valid/invalid tokens)
   - Test error cases (404 for missing profiles)

7. **Documentation Updates**:
   - Update API documentation if needed, with short comment
