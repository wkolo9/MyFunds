# API Endpoint Implementation Plan: Market Data

## 1. Endpoint Overview

This plan covers the implementation of the Market Data API endpoints, which provide real-time (cached) asset prices and exchange rates. These endpoints are essential for displaying up-to-date market information. The implementation will include a service layer with caching capabilities and integration with an external market data provider (simulated for MVP).

## 2. Request Details

### 2.1. Get Asset Price
- **HTTP Method**: `GET`
- **URL**: `/api/market/price/[ticker]`
- **Parameters**:
  - **Path**: `ticker` (Required, string) - The asset symbol (e.g., 'AAPL').
- **Auth**: Required (Bearer Token).
- **Note**: This endpoint returns the price in the asset's base currency (typically USD). Currency conversion is handled on the client side using the exchange rate.

### 2.2. Get Exchange Rate
- **HTTP Method**: `GET`
- **URL**: `/api/market/exchange-rate`
- **Parameters**: None.
- **Auth**: Required (Bearer Token).
- **Note**: This endpoint currently supports only the USD to PLN exchange rate.

### 2.3. Get Market Data Status
- **HTTP Method**: `GET`
- **URL**: `/api/market/status`
- **Parameters**: None.
- **Auth**: Required (Bearer Token).

## 3. Used Types

**DTOs (from `src/types.ts`)**:
- `AssetPriceDTO`
- `ExchangeRateDTO`
- `MarketDataStatusDTO`

**Validation Schemas**:
- `TickerSchema` (Path param validation)

## 4. Response Details

- **Success (200)**: Returns the corresponding DTO as JSON.
- **Errors**:
  - `400 Bad Request`: Invalid ticker format.
  - `401 Unauthorized`: Missing or invalid session.
  - `404 Not Found`: Ticker not found.
  - `503 Service Unavailable`: Market data provider error.

## 5. Data Flow

1.  **Request**: Client sends request with JWT token.
2.  **Auth**: Middleware/Helper validates the token.
3.  **Validation**: Zod schema validates the ticker.
4.  **Service**: `MarketDataService` checks internal cache.
    - **Hit**: Returns cached data.
    - **Miss**: Fetches from external provider (Mock/Real), updates cache, returns data.
5.  **Response**: JSON payload with `cached` flag.

## 6. Security Considerations

- **Authentication**: Strict enforcement of Supabase Auth via `getAuthenticatedUser`.
- **Validation**: Enforce alphanumeric format for tickers to prevent injection.
- **External API Safety**: Handle external API failures gracefully (timeouts, limits).

## 7. Error Handling

Use `src/lib/utils/error.utils.ts` to standardize errors:
- `ErrorCode.VALIDATION_ERROR` -> 400
- `ErrorCode.INVALID_TOKEN` -> 401
- `ErrorCode.NOT_FOUND` -> 404
- `ErrorCode.INTERNAL_ERROR` / Custom 503 -> 503

## 8. Performance Considerations

- **Caching**: Implement an in-memory cache (e.g., `Map` or simple object) in `MarketDataService` with a 1-hour TTL.
  - *Note*: In a serverless environment, in-memory cache may reset on cold starts. This is acceptable for the MVP.

## 9. Implementation Steps

### Step 1: Create Validation Schemas
Create `src/lib/validation/market.validation.ts`:
- Define Zod schema for `ticker` validation (alphanumeric, reasonable length).

### Step 2: Implement Market Data Service
Create `src/lib/services/market.service.ts`:
- Define `MarketDataService` class.
- Implement `SimpleCache` mechanism (Map with timestamp).
- Implement `getPrice(ticker)`:
  - Check cache.
  - If miss, simulate fetch (or call real API).
  - Return `AssetPriceDTO` (defaulting to USD).
- Implement `getExchangeRate()`:
  - Check cache.
  - If miss, fetch/simulate USD/PLN rate.
  - Return `ExchangeRateDTO` (hardcoded from='USD', to='PLN').
- Implement `getStatus()`:
  - Return health status and next refresh time.
- Export `createMarketService` factory.

### Step 3: Implement API Routes
1.  **Price Endpoint**: `src/pages/api/market/price/[ticker].ts`
    - Extract `ticker` from `params`.
    - Validate `ticker`.
    - Call `marketService.getPrice(ticker)`.
2.  **Exchange Rate Endpoint**: `src/pages/api/market/exchange-rate.ts`
    - Call `marketService.getExchangeRate()`.
3.  **Status Endpoint**: `src/pages/api/market/status.ts`
    - Call `marketService.getStatus()`.

### Step 4: Testing
- Verify successful responses for known tickers.
- Verify 404 for unknown tickers.
- Verify caching behavior (second request has `cached: true`).
- Verify exchange rate returns valid USD/PLN data.
