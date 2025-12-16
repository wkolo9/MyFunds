# API Endpoint Implementation Plan: Update User Profile

## 1. Endpoint Overview

This endpoint allows authenticated users to update their profile settings. Currently, it only supports updating the `preferred_currency` (USD or PLN). This setting affects how monetary values are displayed across the application.

## 2. Request Details

- **HTTP Method**: `PATCH`
- **URL Structure**: `/api/profile`
- **Headers**:
  - `Authorization`: `Bearer {access_token}`
  - `Content-Type`: `application/json`
- **Request Body**:
  ```json
  {
    "preferred_currency": "PLN"
  }
  ```

## 3. Used Types

- **Command Model**: `UpdateProfileCommand`
  - Defined in `src/types.ts`
  - Validated by `updateProfileCommandSchema` in `src/lib/validation/profile.validation.ts`
- **DTO**: `ProfileDTO` (alias for `ProfileEntity`)
  - Defined in `src/types.ts`

## 4. Response Details

- **Success (200 OK)**:
  - Returns the updated profile object.
  ```json
  {
    "user_id": "uuid",
    "preferred_currency": "PLN",
    "created_at": "2025-12-10T10:00:00Z",
    "updated_at": "2025-12-10T15:30:00Z"
  }
  ```

- **Error Codes**:
  - `400 Bad Request`: Invalid input (e.g., unsupported currency) or malformed JSON.
  - `401 Unauthorized`: Missing or invalid authentication token.
  - `500 Internal Server Error`: Database or server-side error.

## 5. Data Flow

1.  **Request**: Client sends PATCH request with JWT and JSON body.
2.  **Authentication**: API route verifies the user's session using Supabase Auth (`context.locals.supabase`).
3.  **Validation**: Request body is parsed and validated against `updateProfileCommandSchema`.
4.  **Service Layer**: `ProfileService.updateProfile` is called with the user ID and command object.
5.  **Database**: Supabase performs the update on the `profiles` table. RLS ensures the user can only update their own row.
6.  **Response**: The updated profile entity is returned to the client.

## 6. Security Considerations

-   **Authentication**: Strictly enforced. Access is denied if `supabase.auth.getUser()` fails or returns no user.
-   **Authorization**: Relies on Database RLS policies (`Users can update own profile`) to prevent unauthorized modifications.
-   **Input Validation**: Zod schema (`currencySchema`) strictly allows only 'USD' or 'PLN', preventing SQL injection or invalid state.

## 7. Error Handling

-   **Validation Errors**: Caught by Zod parsing; returns 400 with details about the invalid field.
-   **Auth Errors**: Returns 401 if the session is invalid.
-   **Service Errors**: Caught in the API route; logged to console and returns 500.

## 8. Implementation Steps

1.  **Update Profile Service**:
    -   Modify `src/lib/services/profile.service.ts`.
    -   Add `updateProfile(userId: string, command: UpdateProfileCommand): Promise<ProfileEntity>`.
    -   Implement the database update logic using `supabase.from('profiles').update(...)`.

2.  **Implement API Handler**:
    -   Modify `src/pages/api/profile.ts`.
    -   Export a `PATCH` function (Astro Server Endpoint).
    -   Add authentication check (get user from Supabase).
    -   Parse request body.
    -   Validate body using `updateProfileCommandSchema`.
    -   Call `profileService.updateProfile`.
    -   Return appropriate responses (200, 400, 401, 500).

3.  **Verification**:
    -   Verify the endpoint handles valid 'USD' and 'PLN' updates.
    -   Verify it rejects invalid currencies.
    -   Verify it rejects unauthenticated requests.

