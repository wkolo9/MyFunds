# API Endpoint Implementation Plan: Watchlist Items

## 1. Endpoint Overview

The Watchlist API allows users to manage their tracked stocks on a 4x4 grid (16 items max). It supports listing items, adding new stocks, reordering them (single or batch updates), and removing them. The endpoints ensure valid grid positions (0-15) and prevent duplicates.

## 2. Request Details

### 2.1. List Watchlist Items
- **HTTP Method**: `GET`
- **URL**: `/api/watchlist`
- **Authentication**: Required (Bearer Token)

### 2.2. Create Watchlist Item
- **HTTP Method**: `POST`
- **URL**: `/api/watchlist`
- **Request Body**:
  ```json
  {
    "ticker": "AAPL",
    "grid_position": 0
  }
  ```

### 2.3. Update Watchlist Items
- **HTTP Method**: `PATCH`
- **URL**: `/api/watchlist`
- **Request Body**:
  ```json
  {
    "updates": [
      { "id": "uuid-1", "grid_position": 1 },
      { "id": "uuid-2", "grid_position": 0 },
      { "id": "uuid-3", "ticker": "MSFT" }
    ]
  }
  ```
- **Note**: 1. This endpoint handles batch updates for both position and ticker. You can update just the position, just the ticker, or both.
2. This endpoint handles both single and batch updates. If moving a single item to 
an empty spot, send an array of one. If swapping or reordering, send multiple updates.

### 2.4. Delete Watchlist Item
- **HTTP Method**: `DELETE`
- **URL**: `/api/watchlist/[id]`

## 3. Used Types

These types are defined in `src/types.ts`:

- **DTOs**:
  - `WatchlistItemDTO`: Represents a watchlist item with current price.
  - `WatchlistListDTO`: Response for listing items.
  - `BatchUpdateWatchlistItemsDTO`: Response for batch updates.

- **Command Models**:
  - `CreateWatchlistItemCommand`: `{ ticker: string, grid_position: number }`
  - `WatchlistItemUpdate`: `{ id: string, grid_position?: number, ticker?: string }`
  - `BatchUpdateWatchlistItemsCommand`: `{ updates: WatchlistItemUpdate[] }`

## 4. Response Details

- **GET /api/watchlist**: `200 OK` with `WatchlistListDTO`.
- **POST /api/watchlist**: `201 Created` with `WatchlistItemDTO`.
- **PATCH /api/watchlist**: `200 OK` with `BatchUpdateWatchlistItemsDTO`.
- **DELETE /api/watchlist/[id]**: `204 No Content`.

**Status Codes**:
- `200`: Success.
- `201`: Created.
- `204`: Deleted.
- `400`: Validation error (invalid grid position, missing ticker).
- `401`: Unauthorized.
- `404`: Item not found.
- `409`: Conflict (duplicate ticker, occupied position).
- `422`: Unprocessable Entity (max 16 items reached).
- `503`: Market Data API unavailable.

## 5. Data Flow

1.  **Request**: Client sends request with JWT.
2.  **Middleware**: Validates token, extracts `user_id`.
3.  **Route Handler**: Parses input using Zod schemas.
4.  **Service Layer** (`WatchlistService`):
    -   Validates business logic (e.g., max items, position availability).
    -   Calls `MarketService` (if available) to validate ticker or fetch prices.
    -   Interacts with Supabase `watchlist_items` table.
5.  **Database**: Executes query with RLS enforcement.
6.  **Response**: Service enriches data (adds prices) and returns DTO.

## 6. Security Considerations

-   **Authentication**: Enforced via Middleware.
-   **Authorization**: RLS ensures users can only access/modify their own items.
-   **Validation**:
    -   Strict Zod schemas for inputs.
    -   Server-side validation of grid positions (must be 0-15).
    -   Server-side check for duplicates to prevent unique constraint violations.

## 7. Error Handling

-   **Duplicate Ticker**: Catch unique constraint violation -> Return `409 Conflict`.
-   **Occupied Position**: Check before update -> Return `409 Conflict`.
-   **Max Items**: Check count before insert -> Return `422 Unprocessable Entity`.
-   **Invalid Ticker**: Market API check fails -> Return `400 Bad Request` or `404 Not Found`.

## 8. Performance Considerations

-   **Batch Updates**: Use a single transactional RPC or parallel promises (if RPC not available) for batch updates to minimize round trips and ensure atomicity.
-   **Caching**: Leverage `MarketService` caching for price lookups to avoid rate limits on external APIs.

## 9. Implementation Steps

1.  **Create Validation Schemas**:
    -   Create `src/lib/validation/watchlist.validation.ts`.
    -   Define Zod schemas for create, update, and batch update commands.

2.  **Implement Watchlist Service**:
    -   Create `src/lib/services/watchlist.service.ts`.
    -   Implement `getWatchlist(userId)`: Fetch items + prices.
    -   Implement `createWatchlistItem(userId, data)`: Check limit, validate ticker, insert.
    -   Implement `batchUpdateItems(userId, updates)`: Handle multiple updates (position and ticker), ensuring uniqueness and validity.
    -   Implement `deleteWatchlistItem(userId, itemId)`.

3.  **Implement API Routes**:
    -   Create `src/pages/api/watchlist/index.ts` (GET, POST, PATCH).
    -   Create `src/pages/api/watchlist/[id].ts` (DELETE).
    -   Integrate `WatchlistService` and `apiHandler` wrapper.

4.  **Tests**:
    -   Add unit tests in `src/lib/services/__tests__/watchlist.service.test.ts`.
    -   Add integration tests in `src/pages/api/__tests__/watchlist.test.ts`.

