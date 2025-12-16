# API Endpoint Implementation Plan: Portfolio Assets

## 1. Endpoint Overview

This implementation covers a set of endpoints for managing the user's financial portfolio. It enables users to:
- List owned assets with real-time market data.
- View a summary of their portfolio performance and sector allocation.
- Add, update, and remove assets.
- View values in their preferred currency (USD/PLN).

## 2. Request Details

### 2.1. List Portfolio Assets
- **HTTP Method**: `GET`
- **URL**: `/api/portfolio`
- **Parameters**:
  - `currency` (Optional, query): Target currency ('USD' | 'PLN'). Defaults to user preference.
  - `sector_id` (Optional, query): Filter by sector UUID. Use "null" for unassigned.

### 2.2. Get Portfolio Summary
- **HTTP Method**: `GET`
- **URL**: `/api/portfolio/summary`
- **Parameters**:
  - `currency` (Optional, query): Target currency ('USD' | 'PLN').

### 2.3. Create Portfolio Asset
- **HTTP Method**: `POST`
- **URL**: `/api/portfolio`
- **Request Body**:
  - `ticker` (Required, string): Asset symbol (e.g., "AAPL").
  - `quantity` (Required, string/decimal): Amount owned.
  - `sector_id` (Optional, UUID): Associated sector.

### 2.4. Update Portfolio Asset
- **HTTP Method**: `PATCH`
- **URL**: `/api/portfolio/[id]`
- **Request Body** (Partial):
  - `quantity` (Optional, string/decimal).
  - `sector_id` (Optional, UUID).

### 2.5. Delete Portfolio Asset
- **HTTP Method**: `DELETE`
- **URL**: `/api/portfolio/[id]`

## 3. Used Types

### DTOs (from `src/types.ts`)
- `PortfolioAssetDTO`: Enriched asset data.
- `PortfolioListDTO`: List response with metadata.
- `PortfolioSummaryDTO`: Aggregated value and sector breakdown.
- `CreatePortfolioAssetCommand`: Input for creation.
- `UpdatePortfolioAssetCommand`: Input for updates.

### Services Interfaces (New)
- `IMarketDataService`: Interface for fetching current prices and exchange rates.
- `MarketData`: Type for price and currency data returned by the service.

## 4. Response Details

- **200 OK**: For successful retrieval and updates. Returns JSON payload with requested data.
- **201 Created**: For successful creation. Returns the created asset object.
- **204 No Content**: For successful deletion.
- **400 Bad Request**: Invalid input (e.g., negative quantity, invalid UUID, unsupported currency).
- **401 Unauthorized**: User is not authenticated.
- **404 Not Found**: Asset or Sector not found.
- **409 Conflict**: Asset with the same ticker already exists.
- **503 Service Unavailable**: Market data provider is unreachable.

## 5. Data Flow

1.  **Request**: Client sends request with Auth Token.
2.  **Middleware**: `index.ts` verifies token and populates `locals.user`.
3.  **Route Handler**:
    - Validates input using Zod schemas (`src/lib/validation`).
    - Calls `PortfolioService`.
4.  **PortfolioService**:
    - **Read**: Fetches assets from Supabase (`portfolio_assets` table).
    - **Enrich**: Calls `MarketDataService` to get current prices for tickers.
    - **Calculate**: Computes `current_value` = `quantity` * `price`. Converts currency if needed.
    - **Aggregate**: Sums values for summary endpoints.
    - **Write**: validating business rules (e.g. duplicate ticker check) before calling Supabase.
5.  **Database**: Supabase executes queries enforcing RLS policies.
6.  **Response**: Returns formatted DTOs to the client.

## 6. Security Considerations

-   **Authentication**: All endpoints require a valid Bearer token.
-   **Authorization**: RLS policies on `portfolio_assets` table ensure users only access their own data.
-   **Input Validation**: Strict Zod validation for all inputs to prevent injection and logic errors.
-   **Market Data Reliability**: Graceful handling of external API failures (503 status) without exposing internal stack traces.

## 7. Error Handling

-   **Validation Errors**: Return 400 with field-specific error messages.
-   **Business Logic Errors**:
    -   Duplicate Ticker: 409 Conflict.
    -   Sector Not Found: 404 Not Found.
-   **External Service Errors**:
    -   Market API Down: 503 Service Unavailable.
-   **Internal Errors**: Log to console/logging service and return 500 Generic Error.

## 8. Performance Considerations

-   **Caching**: `MarketDataService` should implement short-term caching (e.g., 1-5 minutes) for stock prices to avoid hitting external API rate limits and reduce latency.
-   **Batching**: Fetch market data for all tickers in a single batch request where possible.
-   **Database Indexing**: Ensure `user_id` and `sector_id` are indexed in `portfolio_assets`.

## 9. Implementation Steps

### Step 1: Database Setup
-   Verify `portfolio_assets` table exists in Supabase.
-   Update `src/db/database.types.ts` to include the `portfolio_assets` table definition if missing, ensuring TypeScript types match the database schema.

### Step 2: Market Data Service
-   Create `src/lib/services/market.service.ts`.
-   Define `IMarketDataService` interface.
-   Implement a basic/mock version that returns dummy prices (randomized or static) for development to avoid external dependencies initially.
-   *Future*: Integrate real API (e.g., Yahoo Finance).

### Step 3: Validation Schemas
-   Create `src/lib/validation/portfolio.validation.ts`.
-   Implement Zod schemas for:
    -   `createAssetSchema`: `ticker` (string), `quantity` (positive string), `sector_id` (uuid/null).
    -   `updateAssetSchema`: `quantity`, `sector_id` (partial).
    -   `querySchema`: `currency` (enum), `sector_id` (uuid/null).

### Step 4: Portfolio Service
-   Create `src/lib/services/portfolio.service.ts`.
-   Inject `MarketDataService` dependency.
-   Implement methods:
    -   `getAssets(userId, options)`: Fetch + Enrich.
    -   `getSummary(userId, options)`: Fetch + Enrich + Aggregate.
    -   `createAsset(userId, data)`: Check duplicates -> Insert.
    -   `updateAsset(userId, assetId, data)`: Check existence -> Update.
    -   `deleteAsset(userId, assetId)`: Delete.

### Step 5: API Routes
-   Create `src/pages/api/portfolio/index.ts`: Handle GET (list) and POST (create).
-   Create `src/pages/api/portfolio/summary.ts`: Handle GET (summary).
-   Create `src/pages/api/portfolio/[id].ts`: Handle PATCH (update) and DELETE (remove).

### Step 6: Testing
-   Create unit tests for `PortfolioService` and `MarketDataService`.
-   Create integration tests for API endpoints (`src/pages/api/__tests__/portfolio.test.ts`).

