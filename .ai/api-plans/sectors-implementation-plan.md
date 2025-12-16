# API Endpoint Implementation Plan: Sectors

## 1. Endpoint Overview

The Sectors API allows users to manage custom categories for their assets. It supports listing, creating, updating, and deleting sectors. These sectors are used to categorize portfolio assets.

## 2. Request Details

### 2.1. List User Sectors
- **HTTP Method**: `GET`
- **URL**: `/api/sectors`
- **Parameters**: None
- **Request Body**: None

### 2.2. Create Sector
- **HTTP Method**: `POST`
- **URL**: `/api/sectors`
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "name": "Technology"
  }
  ```
  - **Required**: `name`

### 2.3. Update Sector
- **HTTP Method**: `PATCH`
- **URL**: `/api/sectors/[id]`
- **Parameters**:
  - **Required**: `id` (UUID) in URL path
- **Request Body**:
  ```json
  {
    "name": "Tech & Innovation"
  }
  ```
  - **Required**: `name`

### 2.4. Delete Sector
- **HTTP Method**: `DELETE`
- **URL**: `/api/sectors/[id]`
- **Parameters**:
  - **Required**: `id` (UUID) in URL path
- **Request Body**: None

## 3. Used Types

These types are defined in `src/types.ts`:

- **DTOs**:
  - `SectorDTO`: `{ id: string, user_id: string, name: string, created_at: string }`
  - `SectorsListDTO`: `{ sectors: SectorDTO[], total: number }`

- **Command Models**:
  - `CreateSectorCommand`: `{ name: string }`
  - `UpdateSectorCommand`: `{ name: string }`

## 3. Response Details

### 3.1. List User Sectors
- **Status**: `200 OK`
- **Payload**: `SectorsListDTO`

### 3.2. Create Sector
- **Status**: `201 Created`
- **Payload**: `SectorDTO`

### 3.3. Update Sector
- **Status**: `200 OK`
- **Payload**: `SectorDTO`

### 3.4. Delete Sector
- **Status**: `204 No Content`
- **Payload**: Empty body

## 4. Data Flow

1.  **Request**: Client sends HTTP request to `/api/sectors` endpoints.
2.  **Middleware**: `src/middleware/index.ts` validates JWT and injects `locals.user`.
3.  **API Route**:
    -   `src/pages/api/sectors/index.ts` handles GET (list) and POST (create).
    -   `src/pages/api/sectors/[id].ts` handles PATCH (update) and DELETE (delete).
4.  **Service Layer**: `SectorService` (`src/lib/services/sector.service.ts`) contains business logic.
5.  **Database**: Interacts with Supabase `sectors` table.
    -   RLS policies automatically restrict access to the authenticated user's data.

## 5. Security Considerations

-   **Authentication**: All endpoints require a valid Bearer token (Supabase Auth).
-   **Authorization**:
    -   Row Level Security (RLS) on the `sectors` table enforces that users can only view/modify their own sectors.
    -   Service layer should double-check ownership for robust error messaging (e.g., distinguishing 404 vs 403, though 404 is preferred for security).
-   **Input Validation**:
    -   Zod schemas must validate `name` length (1-36 chars) and type.
    -   Path parameters (`id`) must be valid UUIDs.
-   **Rate Limiting**: Standard API rate limiting (if configured at edge/middleware).

## 6. Error Handling

-   **400 Bad Request**: Validation failure (empty name, invalid UUID).
-   **401 Unauthorized**: Missing or invalid JWT.
-   **404 Not Found**: Sector ID does not exist for the user.
-   **409 Conflict**:
    -   Duplicate sector name (unique constraint on `user_id, name`).
-   **422 Unprocessable Entity**:
    -   Maximum sector limit reached (32 sectors).
-   **500 Internal Server Error**: Database connection issues or unexpected errors.

## 7. Performance Considerations

-   **Caching**: Sector lists change infrequently; could be cached but strict freshness is usually required for user settings.
-   **Database**: Ensure `user_id` is indexed (Supabase foreign keys usually are).
-   **Pagination**: Currently returns all sectors 

## 8. Implementation Steps

1.  **Define Zod Schemas**: Create validation schemas in `src/lib/validation/sector.validation.ts` (new file) for create and update commands.
2.  **Create Service**: Implement `SectorService` in `src/lib/services/sector.service.ts`.
    -   `listSectors(userId)`
    -   `createSector(userId, command)`: Check max limit (32), check name uniqueness, insert.
    -   `updateSector(userId, sectorId, command)`: Check name uniqueness, update.
    -   `deleteSector(userId, sectorId)`: Delete.
3.  **Implement API Routes**:
    -   Create `src/pages/api/sectors/index.ts` for GET/POST.
    -   Create `src/pages/api/sectors/[id].ts` for PATCH/DELETE.
    -   Use `api.utils.ts` for standardized responses and error handling.
4.  **Unit Tests**: Create `src/lib/services/__tests__/sector.service.test.ts` to test business logic (limits, naming).
5.  **Integration Tests**: Create `src/pages/api/__tests__/sectors.test.ts` to test endpoints.

