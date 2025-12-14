# REST API Plan - MyFunds MVP

## 1. Resources

The API is organized around the following main resources, each corresponding to database tables:

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Profile | `profiles` | User profile settings including preferred currency |
| Sector | `sectors` | User-defined sectors for asset categorization |
| Portfolio Asset | `portfolio_assets` | Assets held in user's portfolio |
| Watchlist Item | `watchlist_items` | Stocks tracked on the 4x4 chart grid |
| Market Data | N/A (cached) | Real-time market prices and exchange rates |

## 2. Endpoints

### 2.1. Authentication

Authentication is handled by Supabase Auth. The following endpoints are provided by Supabase SDK:

#### 2.1.1. Register User

**POST** `/auth/v1/signup`

**Description**: Create a new user account with email and password.

**Request Payload**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response Payload** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": null,
    "created_at": "2025-12-10T10:00:00Z"
  },
  "session": null
}
```

**Success Codes**:
- `201 Created` - User created successfully, email verification required

**Error Codes**:
- `400 Bad Request` - Invalid email format or password too weak
- `422 Unprocessable Entity` - Email already registered

---

#### 2.1.2. Login User

**POST** `/auth/v1/token?grant_type=password`

**Description**: Authenticate user and receive access token.

**Request Payload**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response Payload** (200 OK):
```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Success Codes**:
- `200 OK` - Login successful

**Error Codes**:
- `400 Bad Request` - Invalid credentials
- `401 Unauthorized` - Email not verified

---

#### 2.1.3. Logout User

**POST** `/auth/v1/logout`

**Description**: Revoke current session token.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response Payload** (204 No Content):
```json
{}
```

**Success Codes**:
- `204 No Content` - Logout successful

**Error Codes**:
- `401 Unauthorized` - Invalid or expired token

---

### 2.2. Profile

#### 2.2.1. Get User Profile

**GET** `/api/profile`

**Description**: Retrieve current user's profile information.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response Payload** (200 OK):
```json
{
  "user_id": "uuid",
  "preferred_currency": "USD",
  "created_at": "2025-12-10T10:00:00Z",
  "updated_at": "2025-12-10T10:00:00Z"
}
```

**Success Codes**:
- `200 OK` - Profile retrieved successfully

**Error Codes**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Profile not found

---

#### 2.2.2. Update User Profile

**PATCH** `/api/profile`

**Description**: Update user's profile settings (currently only preferred currency).

**Headers**:
```
Authorization: Bearer {access_token}
```

**Request Payload**:
```json
{
  "preferred_currency": "PLN"
}
```

**Response Payload** (200 OK):
```json
{
  "user_id": "uuid",
  "preferred_currency": "PLN",
  "created_at": "2025-12-10T10:00:00Z",
  "updated_at": "2025-12-10T15:30:00Z"
}
```

**Success Codes**:
- `200 OK` - Profile updated successfully

**Error Codes**:
- `400 Bad Request` - Invalid currency code (must be USD or PLN)
- `401 Unauthorized` - Missing or invalid token

---

### 2.3. Sectors

#### 2.3.1. List User Sectors

**GET** `/api/sectors`

**Description**: Retrieve all sectors defined by the current user.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Query Parameters**:
- None (returns all user's sectors)

**Response Payload** (200 OK):
```json
{
  "sectors": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Technology",
      "created_at": "2025-12-10T10:00:00Z"
    },
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Finance",
      "created_at": "2025-12-10T11:00:00Z"
    }
  ],
  "total": 2
}
```

**Success Codes**:
- `200 OK` - Sectors retrieved successfully

**Error Codes**:
- `401 Unauthorized` - Missing or invalid token

---

#### 2.3.2. Create Sector

**POST** `/api/sectors`

**Description**: Create a new sector for asset categorization.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Request Payload**:
```json
{
  "name": "Technology"
}
```

**Response Payload** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Technology",
  "created_at": "2025-12-10T10:00:00Z"
}
```

**Success Codes**:
- `201 Created` - Sector created successfully

**Error Codes**:
- `400 Bad Request` - Missing or empty name field
- `401 Unauthorized` - Missing or invalid token
- `409 Conflict` - Sector with this name already exists for user

---

#### 2.3.3. Update Sector

**PATCH** `/api/sectors/{sector_id}`

**Description**: Update sector name.

**Headers**:
```
Authorization: Bearer {access_token}
```

**URL Parameters**:
- `sector_id` (UUID) - Sector identifier

**Request Payload**:
```json
{
  "name": "Tech & Innovation"
}
```

**Response Payload** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Tech & Innovation",
  "created_at": "2025-12-10T10:00:00Z"
}
```

**Success Codes**:
- `200 OK` - Sector updated successfully

**Error Codes**:
- `400 Bad Request` - Missing or empty name field
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Sector not found
- `409 Conflict` - Sector with this name already exists for user

---

#### 2.3.4. Delete Sector

**DELETE** `/api/sectors/{sector_id}`

**Description**: Delete a sector. Assets assigned to this sector will have their sector_id set to NULL (moved to "Other" category).

**Headers**:
```
Authorization: Bearer {access_token}
```

**URL Parameters**:
- `sector_id` (UUID) - Sector identifier

**Response Payload** (204 No Content):
```json
{}
```

**Success Codes**:
- `204 No Content` - Sector deleted successfully

**Error Codes**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Sector not found

---

### 2.4. Portfolio Assets

#### 2.4.1. List Portfolio Assets

**GET** `/api/portfolio`

**Description**: Retrieve all assets in user's portfolio with current market data.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `currency` (optional, string) - Display currency (USD or PLN). Defaults to user's preferred currency.
- `sector_id` (optional, UUID) - Filter by sector. Use "null" for unassigned assets.

**Response Payload** (200 OK):
```json
{
  "assets": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "ticker": "AAPL",
      "quantity": "10.0000000000",
      "sector_id": "uuid",
      "sector_name": "Technology",
      "current_price": 175.50,
      "current_value": 1755.00,
      "currency": "USD",
      "created_at": "2025-12-10T10:00:00Z",
      "updated_at": "2025-12-10T10:00:00Z"
    },
    {
      "id": "uuid",
      "user_id": "uuid",
      "ticker": "BTC",
      "quantity": "0.5000000000",
      "sector_id": null,
      "sector_name": "Other",
      "current_price": 45000.00,
      "current_value": 22500.00,
      "currency": "USD",
      "created_at": "2025-12-10T11:00:00Z",
      "updated_at": "2025-12-10T11:00:00Z"
    }
  ],
  "total_value": 24255.00,
  "currency": "USD",
  "last_updated": "2025-12-10T14:30:00Z",
  "total": 2
}
```

**Success Codes**:
- `200 OK` - Portfolio retrieved successfully

**Error Codes**:
- `400 Bad Request` - Invalid currency or sector_id parameter
- `401 Unauthorized` - Missing or invalid token
- `503 Service Unavailable` - Market data API unavailable

---

#### 2.4.2. Get Portfolio Summary

**GET** `/api/portfolio/summary`

**Description**: Get portfolio total value and sector breakdown.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `currency` (optional, string) - Display currency (USD or PLN). Defaults to user's preferred currency.

**Response Payload** (200 OK):
```json
{
  "total_value": 24255.00,
  "currency": "USD",
  "sectors": [
    {
      "sector_id": "uuid",
      "sector_name": "Technology",
      "value": 1755.00,
      "percentage": 7.24
    },
    {
      "sector_id": null,
      "sector_name": "Other",
      "value": 22500.00,
      "percentage": 92.76
    }
  ],
  "last_updated": "2025-12-10T14:30:00Z"
}
```

**Success Codes**:
- `200 OK` - Summary retrieved successfully

**Error Codes**:
- `400 Bad Request` - Invalid currency parameter
- `401 Unauthorized` - Missing or invalid token
- `503 Service Unavailable` - Market data API unavailable

---

#### 2.4.3. Create Portfolio Asset

**POST** `/api/portfolio`

**Description**: Add a new asset to user's portfolio.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Request Payload**:
```json
{
  "ticker": "AAPL",
  "quantity": "10.5",
  "sector_id": "uuid"
}
```

**Response Payload** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "ticker": "AAPL",
  "quantity": "10.5000000000",
  "sector_id": "uuid",
  "sector_name": "Technology",
  "current_price": 175.50,
  "current_value": 1842.75,
  "currency": "USD",
  "created_at": "2025-12-10T15:00:00Z",
  "updated_at": "2025-12-10T15:00:00Z"
}
```

**Success Codes**:
- `201 Created` - Asset added successfully

**Error Codes**:
- `400 Bad Request` - Missing required fields, invalid quantity, or ticker not found in market API
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Specified sector_id doesn't exist
- `409 Conflict` - Asset with this ticker already exists in portfolio
- `503 Service Unavailable` - Market data API unavailable for ticker validation

---

#### 2.4.4. Update Portfolio Asset

**PATCH** `/api/portfolio/{asset_id}`

**Description**: Update asset quantity or sector assignment.

**Headers**:
```
Authorization: Bearer {access_token}
```

**URL Parameters**:
- `asset_id` (UUID) - Asset identifier

**Request Payload**:
```json
{
  "quantity": "15.0",
  "sector_id": "uuid"
}
```

**Response Payload** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "ticker": "AAPL",
  "quantity": "15.0000000000",
  "sector_id": "uuid",
  "sector_name": "Technology",
  "current_price": 175.50,
  "current_value": 2632.50,
  "currency": "USD",
  "created_at": "2025-12-10T10:00:00Z",
  "updated_at": "2025-12-10T15:30:00Z"
}
```

**Success Codes**:
- `200 OK` - Asset updated successfully

**Error Codes**:
- `400 Bad Request` - Invalid quantity (must be positive)
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Asset or sector not found

---

#### 2.4.5. Delete Portfolio Asset

**DELETE** `/api/portfolio/{asset_id}`

**Description**: Remove an asset from user's portfolio.

**Headers**:
```
Authorization: Bearer {access_token}
```

**URL Parameters**:
- `asset_id` (UUID) - Asset identifier

**Response Payload** (204 No Content):
```json
{}
```

**Success Codes**:
- `204 No Content` - Asset deleted successfully

**Error Codes**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Asset not found

---

### 2.5. Watchlist Items

#### 2.5.1. List Watchlist Items

**GET** `/api/watchlist`

**Description**: Retrieve all items in user's watchlist with their grid positions.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Query Parameters**:
- None

**Response Payload** (200 OK):
```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "ticker": "AAPL",
      "grid_position": 0,
      "current_price": 175.50,
      "created_at": "2025-12-10T10:00:00Z"
    },
    {
      "id": "uuid",
      "user_id": "uuid",
      "ticker": "MSFT",
      "grid_position": 1,
      "current_price": 380.25,
      "created_at": "2025-12-10T11:00:00Z"
    }
  ],
  "last_updated": "2025-12-10T14:30:00Z",
  "total": 2,
  "max_items": 16
}
```

**Success Codes**:
- `200 OK` - Watchlist retrieved successfully

**Error Codes**:
- `401 Unauthorized` - Missing or invalid token
- `503 Service Unavailable` - Market data API unavailable

---

#### 2.5.2. Create Watchlist Item

**POST** `/api/watchlist`

**Description**: Add a new stock to the watchlist grid.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Request Payload**:
```json
{
  "ticker": "AAPL",
  "grid_position": 0
}
```

**Response Payload** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "ticker": "AAPL",
  "grid_position": 0,
  "current_price": 175.50,
  "created_at": "2025-12-10T15:00:00Z"
}
```

**Success Codes**:
- `201 Created` - Watchlist item added successfully

**Error Codes**:
- `400 Bad Request` - Missing required fields, invalid grid_position (must be 0-15), or ticker not found in market API
- `401 Unauthorized` - Missing or invalid token
- `409 Conflict` - Ticker already exists in watchlist OR grid position already occupied
- `422 Unprocessable Entity` - Maximum watchlist items (16) reached
- `503 Service Unavailable` - Market data API unavailable for ticker validation

---

#### 2.5.3. Update Watchlist Item Position

**PATCH** `/api/watchlist/{item_id}`

**Description**: Update grid position of a watchlist item (for drag & drop reordering).

**Headers**:
```
Authorization: Bearer {access_token}
```

**URL Parameters**:
- `item_id` (UUID) - Watchlist item identifier

**Request Payload**:
```json
{
  "grid_position": 5
}
```

**Response Payload** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "ticker": "AAPL",
  "grid_position": 5,
  "current_price": 175.50,
  "created_at": "2025-12-10T10:00:00Z"
}
```

**Success Codes**:
- `200 OK` - Position updated successfully

**Error Codes**:
- `400 Bad Request` - Invalid grid_position (must be 0-15)
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Watchlist item not found
- `409 Conflict` - Target grid position already occupied

---

#### 2.5.4. Batch Update Watchlist Positions

**PATCH** `/api/watchlist/positions`

**Description**: Update multiple watchlist item positions in a single transaction (for drag & drop swaps).

**Headers**:
```
Authorization: Bearer {access_token}
```

**Request Payload**:
```json
{
  "updates": [
    {
      "id": "uuid1",
      "grid_position": 1
    },
    {
      "id": "uuid2",
      "grid_position": 0
    }
  ]
}
```

**Response Payload** (200 OK):
```json
{
  "items": [
    {
      "id": "uuid1",
      "user_id": "uuid",
      "ticker": "AAPL",
      "grid_position": 1,
      "current_price": 175.50,
      "created_at": "2025-12-10T10:00:00Z"
    },
    {
      "id": "uuid2",
      "user_id": "uuid",
      "ticker": "MSFT",
      "grid_position": 0,
      "current_price": 380.25,
      "created_at": "2025-12-10T11:00:00Z"
    }
  ]
}
```

**Success Codes**:
- `200 OK` - Positions updated successfully

**Error Codes**:
- `400 Bad Request` - Invalid grid_position values or duplicate positions in request
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - One or more watchlist items not found
- `409 Conflict` - Position conflicts detected

---

#### 2.5.5. Delete Watchlist Item

**DELETE** `/api/watchlist/{item_id}`

**Description**: Remove a stock from the watchlist grid.

**Headers**:
```
Authorization: Bearer {access_token}
```

**URL Parameters**:
- `item_id` (UUID) - Watchlist item identifier

**Response Payload** (204 No Content):
```json
{}
```

**Success Codes**:
- `204 No Content` - Watchlist item deleted successfully

**Error Codes**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Watchlist item not found

---

### 2.6. Market Data

#### 2.6.1. Get Asset Price

**GET** `/api/market/price/{ticker}`

**Description**: Get current price for a specific ticker. Data is cached for 1 hour.

**Headers**:
```
Authorization: Bearer {access_token}
```

**URL Parameters**:
- `ticker` (string) - Asset ticker symbol

**Query Parameters**:
- `currency` (optional, string) - Target currency (USD or PLN). Defaults to USD.

**Response Payload** (200 OK):
```json
{
  "ticker": "AAPL",
  "price": 175.50,
  "currency": "USD",
  "timestamp": "2025-12-10T14:30:00Z",
  "cached": true
}
```

**Success Codes**:
- `200 OK` - Price retrieved successfully

**Error Codes**:
- `400 Bad Request` - Invalid ticker or currency parameter
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Ticker not found in market data API
- `503 Service Unavailable` - Market data API unavailable

---

#### 2.6.2. Get Exchange Rate

**GET** `/api/market/exchange-rate`

**Description**: Get current USD/PLN exchange rate. Data is cached for 1 hour.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `from` (string) - Source currency (USD or PLN)
- `to` (string) - Target currency (USD or PLN)

**Response Payload** (200 OK):
```json
{
  "from": "USD",
  "to": "PLN",
  "rate": 4.05,
  "timestamp": "2025-12-10T14:30:00Z",
  "cached": true
}
```

**Success Codes**:
- `200 OK` - Exchange rate retrieved successfully

**Error Codes**:
- `400 Bad Request` - Invalid currency parameters
- `401 Unauthorized` - Missing or invalid token
- `503 Service Unavailable` - Exchange rate API unavailable

---

#### 2.6.3. Get Market Data Status

**GET** `/api/market/status`

**Description**: Get status of market data cache and last update time.

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response Payload** (200 OK):
```json
{
  "status": "operational",
  "last_updated": "2025-12-10T14:30:00Z",
  "cache_ttl_seconds": 3600,
  "next_refresh": "2025-12-10T15:30:00Z"
}
```

**Success Codes**:
- `200 OK` - Status retrieved successfully

**Error Codes**:
- `401 Unauthorized` - Missing or invalid token

---

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

**Supabase Auth with JWT Tokens**

The API uses Supabase's built-in authentication system, which provides:

1. **Token-based authentication** using JSON Web Tokens (JWT)
2. **Email verification** after registration
3. **Secure password storage** with automatic hashing
4. **Session management** with access and refresh tokens
5. **Token refresh** mechanism for long-lived sessions

### 3.2. Authentication Flow

1. **Registration**:
   - User submits email and password to `/auth/v1/signup`
   - Supabase creates user account and sends verification email
   - Database trigger automatically creates profile record
   - User must verify email before logging in

2. **Login**:
   - User submits credentials to `/auth/v1/token?grant_type=password`
   - Supabase validates credentials and returns access token + refresh token
   - Access token expires after 1 hour
   - Refresh token can be used to obtain new access token

3. **API Requests**:
   - Client includes access token in `Authorization: Bearer {token}` header
   - API validates token on each request
   - Token contains user ID for authorization

4. **Logout**:
   - Client calls `/auth/v1/logout` to revoke current session
   - Token is invalidated server-side

### 3.3. Authorization with Row Level Security (RLS)

All data access is secured using PostgreSQL Row Level Security policies:

1. **User Isolation**: Users can only access their own data
   - RLS policies filter all queries by `auth.uid() = user_id`
   - Enforced at database level, preventing unauthorized access

2. **Resource Ownership**: All operations (SELECT, INSERT, UPDATE, DELETE) verify ownership
   - Profile: User can only manage their own profile
   - Sectors: User can only manage sectors they created
   - Portfolio Assets: User can only manage assets in their portfolio
   - Watchlist Items: User can only manage items in their watchlist

3. **Sector Assignment**: Users can only assign assets to their own sectors
   - Foreign key validation ensures sector_id references user's sector
   - ON DELETE SET NULL ensures asset remains if sector is deleted

### 3.4. Token Validation

All protected endpoints (excluding auth endpoints) require:

1. **Valid JWT token** in Authorization header
2. **Non-expired token** (checked automatically by Supabase)
3. **Verified email** (enforced by Supabase Auth)

Invalid or missing tokens return `401 Unauthorized`.

### 3.5. Security Best Practices

1. **HTTPS Only**: All API communication must use HTTPS in production
2. **Password Requirements**: Minimum 8 characters (enforced by Supabase)
3. **Rate Limiting**: Implement rate limiting on auth endpoints to prevent brute force attacks
4. **CORS Configuration**: Restrict allowed origins to application domain
5. **Input Validation**: All inputs validated before processing
6. **SQL Injection Prevention**: Use parameterized queries (handled by Supabase client)

---

## 4. Validation and Business Logic

### 4.1. Profiles Validation

**Database Constraints**:
- `user_id`: Must reference valid auth.users(id)
- `preferred_currency`: Must be non-null, defaults to 'USD'

**API Validation**:
- `preferred_currency`: Must be exactly 'USD' or 'PLN' (case-sensitive)

**Business Logic**:
- Profile is automatically created via database trigger when user registers
- Profile cannot be deleted independently (CASCADE deleted with auth.users)
- Currency preference is used as default for portfolio and market data queries

---

### 4.2. Sectors Validation

**Database Constraints**:
- `user_id`: Must reference valid profiles(user_id)
- `name`: Must be non-null, non-empty
- UNIQUE(`user_id`, `name`): User cannot have duplicate sector names

**API Validation**:
- `name`: 
  - Required field
  - Must not be empty string
  - Maximum length: 36 characters
  - Trim whitespace before validation

**Business Logic**:
- Sector "Other" is a special virtual sector (sector_id = NULL) and cannot be created
- When sector is deleted, associated assets have sector_id set to NULL (appear in "Other")
- Sector names are not case-sensitive
- User can have up to 16 sectors (max limit 16)

---

### 4.3. Portfolio Assets Validation

**Database Constraints**:
- `user_id`: Must reference valid profiles(user_id)
- `ticker`: Must be non-null, non-empty
- `quantity`: Must be a number, could be fractional, CHECK(quantity > 0)
- `sector_id`: Must reference valid sectors(id) or NULL
- UNIQUE(`user_id`, `ticker`): User cannot have duplicate tickers

**API Validation**:
- `ticker`:
  - Required field
  - Must be uppercase, alphanumeric
  - Maximum length: 20 characters
  - Must exist in market data API (validated on creation)
  
- `quantity`:
  - Required field
  - Must be numeric, positive (> 0)
  - Maximum 10 decimal places
  - Maximum 10 digits before decimal point
  - Minimum value: 0.0000000001 (for cryptocurrencies)

- `sector_id`:
  - Optional field (NULL = "Other")
  - Must reference user's own sector if provided
  - Validated against sectors table

**Business Logic**:
- Asset ticker is validated against market API before creation
- If market API is unavailable, return 503 error
- Current price is fetched from cached market data
- When displaying portfolio:
  - Aggregate total value across all assets
  - Calculate sector breakdown percentages
  - Convert to requested currency using cached exchange rate
- Assets with NULL sector_id appear in "Other" category
- Duplicate ticker prevention ensures one entry per asset per user
- Quantity updates recalculate portfolio totals immediately

---

### 4.4. Watchlist Items Validation

**Database Constraints**:
- `user_id`: Must reference valid profiles(user_id)
- `ticker`: Must be non-null, non-empty
- `grid_position`: Must be SMALLINT, CHECK(grid_position >= 0 AND grid_position < 16)
- UNIQUE(`user_id`, `ticker`): User cannot watch same ticker multiple times
- UNIQUE(`user_id`, `grid_position`): Each grid position can only hold one item

**API Validation**:
- `ticker`:
  - Required field
  - Must be uppercase, alphanumeric
  - Maximum length: 20 characters
  - Must exist in market data API (validated on creation)

- `grid_position`:
  - Required field on creation
  - Must be integer between 0 and 15 (inclusive)
  - Must not be occupied by another item
  - On batch update, all positions must be unique

**Business Logic**:
- Maximum 16 watchlist items per user (4x4 grid)
- Grid positions are 0-indexed (0-15)
- When adding item:
  - Validate ticker exists in market API
  - Check position is not occupied
  - Check total count < 16
- When deleting item:
  - Position becomes available for new items
  - No automatic reordering of other items
- Drag & Drop implementation:
  - Use batch update endpoint to swap positions atomically
  - Validate no duplicate positions in transaction
  - Frontend handles visual feedback
- Current price is fetched from cached market data for display

---

### 4.5. Market Data Validation and Caching

**Caching Logic**:
- **TTL (Time To Live)**: 1 hour (3600 seconds)
- **Cache Key Structure**: 
  - Asset prices: `price:{ticker}`
  - Exchange rates: `exchange:{from}:{to}`
- **Cache Refresh**: 
  - Automatic refresh on cache miss
  - Return cached data if API fails and cache exists
  - Return 503 if API fails and no cached data available

**API Validation**:
- `ticker`: Must be valid ticker format (uppercase, alphanumeric)
- `currency`: Must be 'USD' or 'PLN'
- `from`/`to`: Must be 'USD' or 'PLN' for exchange rates

**Business Logic**:
- Market data is shared across all users (same ticker has same price)
- Price conversion uses cached exchange rate
- If external API is unavailable:
  - Return cached data if available (even if expired)
  - Display "Data temporarily unavailable" message
  - Show timestamp of last successful fetch
- Cache warming strategy:
  - Pre-fetch common tickers on server startup
  - Background job refreshes cache every 55 minutes
- Error handling:
  - Log API failures for monitoring
  - Graceful degradation with cached data
  - Clear error messages to users

---

### 4.6. Error Handling Standards

**Error Response Format**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity must be greater than 0",
    "field": "quantity",
    "timestamp": "2025-12-10T15:30:00Z"
  }
}
```

**Error Categories**:

1. **Validation Errors (400)**:
   - Invalid input format
   - Missing required fields
   - Constraint violations
   - Field: specific field that failed validation

2. **Authentication Errors (401)**:
   - Missing token
   - Invalid token
   - Expired token
   - Unverified email

3. **Authorization Errors (403)**:
   - Attempting to access another user's resources
   - (Primarily handled by RLS, rarely exposed)

4. **Not Found Errors (404)**:
   - Resource doesn't exist
   - Ticker not found in market API

5. **Conflict Errors (409)**:
   - Duplicate ticker in portfolio
   - Duplicate sector name
   - Duplicate ticker in watchlist
   - Grid position already occupied

6. **Unprocessable Entity (422)**:
   - Business logic violations
   - Maximum watchlist items reached

7. **Service Unavailable (503)**:
   - External API down
   - Market data unavailable
   - Message includes estimated retry time

**Business Logic Error Handling**:
- Early return pattern for validation errors
- Transaction rollback on database errors
- Graceful degradation for external API failures
- Clear, user-friendly error messages
- Internal error logging for debugging

---

### 4.7. Performance

**Performance Optimizations**:
- Database indexes on frequently queried columns
- Market data caching reduces API calls
- RLS policies use indexed columns (user_id)
- Single query for portfolio summary with aggregation
- Batch operations for watchlist position updates

---

## 5. Implementation Notes

### 5.1. API Endpoint Organization

API endpoints are organized using Astro's file-based routing in `/src/pages/api/`:

```
/src/pages/api/
  ├── profile.ts                    # GET, PATCH /api/profile
  ├── sectors/
  │   ├── index.ts                  # GET, POST /api/sectors
  │   └── [id].ts                   # PATCH, DELETE /api/sectors/:id
  ├── portfolio/
  │   ├── index.ts                  # GET, POST /api/portfolio
  │   ├── [id].ts                   # PATCH, DELETE /api/portfolio/:id
  │   └── summary.ts                # GET /api/portfolio/summary
  ├── watchlist/
  │   ├── index.ts                  # GET, POST /api/watchlist
  │   ├── [id].ts                   # PATCH, DELETE /api/watchlist/:id
  │   └── positions.ts              # PATCH /api/watchlist/positions
  └── market/
      ├── price/[ticker].ts         # GET /api/market/price/:ticker
      ├── exchange-rate.ts          # GET /api/market/exchange-rate
      └── status.ts                 # GET /api/market/status
```

### 5.2. Middleware

Middleware is defined in `/src/middleware/index.ts` and handles:
- JWT token validation
- User authentication
- Request logging
- Error handling wrapper
- CORS headers

### 5.3. Service Layer

Business logic is organized in `/src/lib/` services:
- `portfolio.service.ts`: Portfolio calculations, aggregations
- `market.service.ts`: Market data fetching, caching
- `sector.service.ts`: Sector management logic
- `watchlist.service.ts`: Watchlist operations

### 5.4. Database Types

TypeScript types are auto-generated from Supabase schema:
- `/src/db/database.types.ts`: Generated types
- `/src/types.ts`: Additional DTOs and business entities

### 5.5. Testing Strategy

- **Unit Tests**: Business logic in services
- **Integration Tests**: API endpoints with test database
- **API Contract Tests**: Validate request/response schemas