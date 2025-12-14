<conversation_summary> <decisions>

The database will be based on Supabase (PostgreSQL), utilizing the built-in auth.users table for authentication.

A public profiles table will be created (with user_id as PK and FK to auth.users.id), storing user preferences (e.g., preferred_currency with a default of 'USD').

The portfolio_assets table will contain user_id, ticker, and quantity. A UNIQUE(user_id, ticker) constraint will be applied.

The quantity field in portfolio_assets will receive the DECIMAL(20, 10) type to handle both large quantities and precise fractional crypto assets (up to 8 decimal places).

A CHECK (quantity > 0) constraint will be added to portfolio_assets.

A sectors table will be created (user_id, name) with a UNIQUE(user_id, name) constraint.

Linking an asset to a sector will be achieved through a NULLABLE foreign key sector_id in the portfolio_assets table. A NULL value represents the default "Other" sector (PRD 3.3).

The user deleting a sector will set sector_id to NULL in associated assets (ON DELETE SET NULL).

A watchlist_items table will be created (user_id, ticker, grid_position) with UNIQUE(user_id, ticker) and UNIQUE(user_id, grid_position) constraints.

The UNIQUE constraint on grid_position will not be DEFERRABLE, as this was deemed redundant for the MVP (US-303).

Creating a record in profiles will be automated using a PostgreSQL trigger (e.g., handle_new_user function) executed AFTER INSERT ON auth.users.

All foreign keys pointing to user_id (in profiles, portfolio_assets, sectors, watchlist_items) will have the ON DELETE CASCADE option set to ensure all user data is deleted along with their auth account.

Validation of sector names (e.g., checking for empty strings) will not be implemented at the database level; the frontend will be responsible for this.

The database will not store any data fetched from the API (prices, exchange rates), in accordance with the backend caching requirement (PRD 3.6).

The database will not store information about the asset's base currency (e.g., "USD" for AAPL).

RLS (Row Level Security) will be enabled on all tables (profiles, portfolio_assets, sectors, watchlist_items).

Full RLS policies (SELECT, INSERT, UPDATE, DELETE) will be defined for all tables, restricting access exclusively to the data owner (based on auth.uid() = user_id).

No user data will be publicly readable.

</decisions>

<matched_recommendations>

Utilizing Supabase's built-in auth.users table for authentication and creating a separate profiles table (1-to-1) to store application metadata (like preferred_currency), linked by user_id.

Employing the DECIMAL(20, 10) type for financial fields (quantity) to guarantee the precision required for fractional cryptocurrency values, avoiding issues with FLOAT types.

Modeling dynamic user sectors in a separate sectors table and representing the "Other" sector (PRD 3.3) as NULL in the foreign key in the portfolio_assets table.

Using ON DELETE SET NULL for the sector_id foreign key so that deleting a sector does not delete the asset but moves it to the "Other" category.

Using a PostgreSQL trigger (AFTER INSERT ON auth.users) to automatically create a linked record in profiles, simplifying registration logic.

Using ON DELETE CASCADE for user_id foreign keys (pointing to profiles, which points to auth.users) to ensure automatic data cleanup upon user account deletion.

Strictly separating user-entered data (ticker, quantity – stored in the database) from market data (prices, exchange rates – cached in the backend according to PRD 3.6).

Implementing comprehensive RLS policies (SELECT, INSERT, UPDATE, DELETE) on all user data tables, utilizing auth.uid() for filtering and verification (USING and WITH CHECK).

Indexing all user_id columns (by default via foreign keys) to ensure high performance for queries filtered by RLS.

</matched_recommendations>

<database_planning_summary>

Core Database Schema Requirements
The PostgreSQL database schema will be implemented within the Supabase platform. The main objective is to securely store manually entered user data for the MyFunds application MVP. The database will not store historical data (PRD 3.6) or market data (prices, exchange rates), which will be cached in the backend.

Key Entities and Their Relationships
Authentication (Supabase Auth):

The auth.users table (provided by Supabase) stores user identity (email, password).

User Profiles (profiles):

Relationship: 1-to-1 with auth.users.

Fields: user_id (PK, FK to auth.users.id, ON DELETE CASCADE), preferred_currency (TEXT, NOT NULL, DEFAULT 'USD').

Automation: Records automatically created by an AFTER INSERT ON auth.users trigger.

Sectors (sectors):

Relationship: Many-to-1 with profiles.

Fields: id (PK), user_id (FK to profiles.user_id, ON DELETE CASCADE), name (TEXT, NOT NULL).

Constraints: UNIQUE(user_id, name).

Portfolio Assets (portfolio_assets):

Relationship: Many-to-1 with profiles, Many-to-1 (Optional) with sectors.

Fields: id (PK), user_id (FK to profiles.user_id, ON DELETE CASCADE), ticker (TEXT, NOT NULL), quantity (DECIMAL(20, 10), NOT NULL), sector_id (FK to sectors.id, NULLABLE, ON DELETE SET NULL).

Constraints: UNIQUE(user_id, ticker), CHECK(quantity > 0).

Logic: sector_id = NULL is interpreted as the "Other" sector.

Watchlist Items (watchlist_items):

Relationship: Many-to-1 with profiles.

Fields: id (PK), user_id (FK to profiles.user_id, ON DELETE CASCADE), ticker (TEXT, NOT NULL), grid_position (SMALLINT, NOT NULL).

Constraints: UNIQUE(user_id, ticker), UNIQUE(user_id, grid_position).

Important Security and Scalability Considerations
Security (RLS): Row Level Security will be enabled on all four tables (profiles, sectors, portfolio_assets, watchlist_items).

Policies: Strict SELECT, INSERT, UPDATE, and DELETE policies will be defined for each table, based on auth.uid() = user_id. No data will be publicly readable, which is consistent with PRD 4.0.

Data Integrity: The use of ON DELETE CASCADE for user_id ensures that deleting a user account cleans up all their data. The use of ON DELETE SET NULL for sector_id prevents asset loss when a sector is deleted.

Performance (Indexes): Foreign keys on user_id and sector_id columns will automatically create indexes, which are crucial for the performance of RLS-filtered queries.

</database_planning_summary>

<unresolved_issues> No unresolved issues identified. All points raised in the discussion have been clarified or resulted in a specific design decision. </unresolved_issues> </conversation_summary>