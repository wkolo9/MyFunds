# PostgreSQL Database Schema - MyFunds MVP

## 1. Tables

### 1.1. profiles

This table is managed by Supabase Auth

| Column | Type | Constraints | Description |
| ------------------ | ----------- | -------------------------------------------------------- | --------------------------------------------- |
| user_id | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | User Identifier |
| preferred_currency | TEXT | NOT NULL, DEFAULT 'USD' | Preferred display currency (USD or PLN) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Profile creation date |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Date of last update |

### 1.2. sectors

Stores user-defined sectors for asset categorization.

| Column | Type | Constraints | Description |
| ---------- | ----------- | -------------------------------------------------------- | ----------------------- |
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Sector Identifier |
| user_id | UUID | NOT NULL, REFERENCES profiles(user_id) ON DELETE CASCADE | Sector Owner |
| name | TEXT | NOT NULL | Sector Name |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Sector creation date |

*Constraints:*

- UNIQUE(user_id, name) - a user cannot have two sectors with the same name

### 1.3. portfolio_assets

Stores assets in the user's portfolio (ticker and quantity).

| Column | Type | Constraints | Description |
| ---------- | --------------- | -------------------------------------------------------- | ------------------------------------ |
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Asset Identifier |
| user_id | UUID | NOT NULL, REFERENCES profiles(user_id) ON DELETE CASCADE | Asset Owner |
| ticker | TEXT | NOT NULL | Asset symbol/ticker (e.g., AAPL, BTC) |
| quantity | DECIMAL(20, 10) | NOT NULL, CHECK(quantity > 0) | Quantity of units held |
| sector_id | UUID | NULLABLE, REFERENCES sectors(id) ON DELETE SET NULL | Assigned Sector (NULL = "Other") |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Asset addition date |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Date of last update |

*Constraints:*

- UNIQUE(user_id, ticker) - a user cannot have duplicates of the same asset
- CHECK(quantity > 0) - quantity must be positive

### 1.4. watchlist_items

Stores companies watched by the user on the chart grid (4x4).

| Kolumna       | Typ         | Ograniczenia                                               | Opis                       |
| ------------- | ----------- | ---------------------------------------------------------- | -------------------------- |
| id            | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()                     | Identyfikator elementu     |
| user_id       | UUID        | NOT NULL, REFERENCES profiles(user_id) ON DELETE CASCADE   | Właściciel elementu        |
| ticker        | TEXT        | NOT NULL                                                   | Symbol/ticker spółki       |
| grid_position | SMALLINT    | NOT NULL, CHECK(grid_position >= 0 AND grid_position < 16) | Pozycja w siatce (0-15)    |
| created_at    | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                                    | Data dodania do watchlisty |


| Column         | Type         | Constraints                                               | Description                |
| -------------- | -----------  | -------------------------------------------------------- | -------------------------- |
| id             | UUID         | PRIMARY KEY, DEFAULT gen_random_uuid()                   | Item Identifier            |
| user_id        | UUID         | NOT NULL, REFERENCES profiles(user_id) ON DELETE CASCADE | Item Owner                 |
| ticker         | TEXT         | NOT NULL                                                 | Company symbol/ticker      |
| grid_position  | SMALLINT     | NOT NULL, CHECK(grid_position >= 0 AND grid_position < 16)| Position in the grid (0-15)|
| created_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                                  | Date added to watchlist    |


*Constraints:*

- UNIQUE(user_id, ticker) - a user cannot watch the same ticker multiple times
- UNIQUE(user_id, grid_position) - each grid position can be occupied only once
- CHECK(grid_position >= 0 AND grid_position < 16) - maximum 16 positions (4x4)

## 2. Table Relationships

auth.users (Supabase)
    ↓ 1:1 (ON DELETE CASCADE)
profiles
    ↓ 1:N (ON DELETE CASCADE)
    ├── sectors
    ├── portfolio_assets ──→ sectors (N:1, ON DELETE SET NULL)
    └── watchlist_items

### Relationship Details:

- *auth.users → profiles*: 1-to-1, automatically created by a trigger
- *profiles → sectors*: 1-to-many, a user can have multiple sectors
- *profiles → portfolio_assets*: 1-to-many, a user can have multiple assets
- *sectors → portfolio_assets*: 1-to-many (optional), a sector can contain multiple assets
- *profiles → watchlist_items*: 1-to-many, a user can watch multiple companies

## 3. Indexes

Indexes automatically created by foreign keys:

- profiles(user_id) - PRIMARY KEY
- sectors(user_id) - for RLS-filtered queries
- portfolio_assets(user_id) - for RLS-filtered queries
- portfolio_assets(sector_id) - for JOIN with sectors
- watchlist_items(user_id) - for RLS-filtered queries

Additional indexes (optional, for optimization):

CREATE INDEX idx_portfolio_assets_ticker ON portfolio_assets(ticker);
CREATE INDEX idx_watchlist_items_ticker ON watchlist_items(ticker);

## 4. Triggers

### 4.1. Automatic User Profile Creation

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, preferred_currency)
  VALUES (NEW.id, 'USD');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

### 4.2. Automatic updated_at Update

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_assets_updated_at
  BEFORE UPDATE ON portfolio_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

## 5. Row Level Security (RLS)

### 5.1. Enabling RLS

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

### 5.2. RLS Policies for profiles

-- SELECT: a user can only read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: a user can only create their own profile (handled by trigger)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: a user can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: a user can only delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

### 5.3. RLS Policies for sectors

-- SELECT: a user can only read their own sectors
CREATE POLICY "Users can view own sectors"
  ON sectors FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: a user can only create their own sectors
CREATE POLICY "Users can insert own sectors"
  ON sectors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: a user can only update their own sectors
CREATE POLICY "Users can update own sectors"
  ON sectors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: a user can only delete their own sectors
CREATE POLICY "Users can delete own sectors"
  ON sectors FOR DELETE
  USING (auth.uid() = user_id);

### 5.4. RLS Policies for portfolio_assets

-- SELECT: a user can only read their own assets
CREATE POLICY "Users can view own assets"
  ON portfolio_assets FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: a user can only add their own assets
CREATE POLICY "Users can insert own assets"
  ON portfolio_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: a user can only update their own assets
CREATE POLICY "Users can update own assets"
  ON portfolio_assets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: a user can only delete their own assets
CREATE POLICY "Users can delete own assets"
  ON portfolio_assets FOR DELETE
  USING (auth.uid() = user_id);

### 5.5. RLS Policies for watchlist_items

-- SELECT: a user can only read their own watchlist
CREATE POLICY "Users can view own watchlist"
  ON watchlist_items FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: a user can only add to their own watchlist
CREATE POLICY "Users can insert own watchlist items"
  ON watchlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: a user can only update their own watchlist
CREATE POLICY "Users can update own watchlist items"
  ON watchlist_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: a user can only delete from their own watchlist
CREATE POLICY "Users can delete own watchlist items"
  ON watchlist_items FOR DELETE
  USING (auth.uid() = user_id);

## 6. Design Notes

### 6.1. DECIMAL Type for quantity

DECIMAL(20, 10) was chosen for the quantity field in portfolio_assets to ensure:

- Precision up to 10 decimal places (required for cryptocurrencies, e.g., 0.00000001 BTC)
- Handling of large quantities (up to 10 digits before the decimal point)
- Avoidance of floating-point rounding issues

### 6.2. "Other" Sector

Assets not assigned to any sector have sector_id = NULL, which is interpreted as the "Other" sector at the application level (consistent with PRD 3.3).

### 6.3. ON DELETE SET NULL for sector_id

Deleting a sector does not delete the assets but moves them to the "Other" category (sets sector_id to NULL).

### 6.4. ON DELETE CASCADE for user_id

Deleting a user account automatically deletes all associated data (profile, sectors, assets, watchlist).

### 6.5. No Storage of Market Data

The database does not store:

- Asset prices
- Exchange rates
- Portfolio value history
- Company names (only tickers)

This data is retrieved from the API and cached in the backend (consistent with PRD 3.6).

### 6.6. 4x4 Chart Grid

Grid positions are numbered from 0 to 15 (16 positions). The CHECK(grid_position >= 0 AND grid_position < 16) constraint enforces the maximum number of charts.

### 6.7. Application-Side Validation

The following validations are handled by the frontend/backend, not by the database:

- Verification of ticker existence in the API
- Validation of sector names (non-empty strings)
- Checking currency availability (USD/PLN)

### 6.8. Supabase Auth

Utilizing the built-in Supabase auth.users table provides:

- Secure password storage (hashing)
- Email verification
- Session management
- Integration with the Supabase SDK