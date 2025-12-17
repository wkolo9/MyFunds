/**
 * MyFunds MVP - Type Definitions
 * 
 * This file contains:
 * - Database Entity types (inferred from database schema)
 * - DTO (Data Transfer Object) types for API responses
 * - Command Model types for API requests
 * 
 * All DTOs are derived from and connected to database entities.
 */

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================
// These types represent the database table structures and will eventually
// be replaced by auto-generated types from Supabase CLI

/**
 * Supported currencies in the application
 */

export type Currency = 'USD' | 'PLN';

/**
 * Profile entity - represents user settings and preferences
 * Table: profiles
 */

export interface ProfileEntity {
  user_id: string; // UUID, references auth.users(id)
  preferred_currency: Currency;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Sector entity - represents user-defined category for assets
 * Table: sectors
 */
export interface SectorEntity {
  id: string; // UUID
  user_id: string; // UUID, references profiles(user_id)
  name: string;
  created_at: string; // ISO 8601 timestamp
}

/**
 * Portfolio Asset entity - represents an asset held in user's portfolio
 * Table: portfolio_assets
 */
export interface PortfolioAssetEntity {
  id: string; // UUID
  user_id: string; // UUID, references profiles(user_id)
  ticker: string;
  quantity: string; // String to preserve decimal precision
  sector_id: string | null; // UUID, references sectors(id), nullable
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Watchlist Item entity - represents a stock tracked on the 4x4 grid
 * Table: watchlist_items
 */
export interface WatchlistItemEntity {
  id: string; // UUID
  user_id: string; // UUID, references profiles(user_id)
  ticker: string;
  grid_position: number; // SMALLINT, 0-15
  created_at: string; // ISO 8601 timestamp
}

// ============================================================================
// PROFILE DTOs AND COMMAND MODELS
// ============================================================================

/**
 * Profile DTO - returned by GET /api/profile
 * Directly maps to ProfileEntity
 */
export type ProfileDTO = ProfileEntity;

/**
 * Update Profile Command - request body for PATCH /api/profile
 * Only preferred_currency can be updated
 */
export interface UpdateProfileCommand {
  preferred_currency: Currency
}

// ============================================================================
// SECTOR DTOs AND COMMAND MODELS
// ============================================================================

/**
 * Sector DTO - represents a single sector in API responses
 * Directly maps to SectorEntity
 */
export type SectorDTO = SectorEntity;

/**
 * Sectors List DTO - returned by GET /api/sectors
 */
export interface SectorsListDTO {
  sectors: SectorDTO[];
  total: number;
}

/**
 * Create Sector Command - request body for POST /api/sectors
 */
export interface CreateSectorCommand {
  name: string;
}

/**
 * Update Sector Command - request body for PATCH /api/sectors/:id
 */
export interface UpdateSectorCommand {
  name: string;
}

// ============================================================================
// PORTFOLIO ASSET DTOs AND COMMAND MODELS
// ============================================================================

/**
 * Portfolio Asset DTO - represents an asset with market data enrichment
 * Extends PortfolioAssetEntity with computed fields
 */
export interface PortfolioAssetDTO extends PortfolioAssetEntity {
  sector_name: string; // Denormalized sector name, "Other" if sector_id is null
  current_price: number; // Market price fetched from external API
  current_value: number; // Calculated as quantity * current_price
  currency: Currency; // Currency in which prices are displayed
}

/**
 * Portfolio List DTO - returned by GET /api/portfolio
 */
export interface PortfolioListDTO {
  assets: PortfolioAssetDTO[];
  total_value: number; // Sum of all asset current_value
  currency: Currency;
  last_updated: string; // ISO 8601 timestamp of last market data update
  total: number; // Number of assets
}

/**
 * Sector Breakdown Item - represents portfolio value grouped by sector
 */
export interface SectorBreakdownDTO {
  sector_id: string | null; // null represents "Other" category
  sector_name: string;
  value: number; // Total value of assets in this sector
  percentage: number; // Percentage of total portfolio value (0-100)
}

/**
 * Portfolio Summary DTO - returned by GET /api/portfolio/summary
 */
export interface PortfolioSummaryDTO {
  total_value: number;
  currency: Currency;
  sectors: SectorBreakdownDTO[];
  last_updated: string; // ISO 8601 timestamp
}

/**
 * Create Portfolio Asset Command - request body for POST /api/portfolio
 */
export interface CreatePortfolioAssetCommand {
  ticker: string;
  quantity: string; // String to preserve decimal precision
  sector_id?: string | null; // Optional, null or undefined = "Other"
}

/**
 * Update Portfolio Asset Command - request body for PATCH /api/portfolio/:id
 * All fields are optional (partial update)
 */
export interface UpdatePortfolioAssetCommand {
  quantity?: string; // String to preserve decimal precision
  sector_id?: string | null; // null = move to "Other"
}

// ============================================================================
// WATCHLIST ITEM DTOs AND COMMAND MODELS
// ============================================================================

/**
 * Watchlist Item DTO - represents a watchlist item with current price
 * Extends WatchlistItemEntity with market data enrichment
 */
export interface WatchlistItemDTO extends WatchlistItemEntity {
  current_price: number; // Market price fetched from external API
}

/**
 * Watchlist List DTO - returned by GET /api/watchlist
 */
export interface WatchlistListDTO {
  items: WatchlistItemDTO[];
  last_updated: string; // ISO 8601 timestamp of last market data update
  total: number; // Number of items
  max_items: 16; // Maximum allowed items (4x4 grid)
}

/**
 * Create Watchlist Item Command - request body for POST /api/watchlist
 */
export interface CreateWatchlistItemCommand {
  ticker: string;
  grid_position: number; // Must be 0-15
}

/**
 * Update Watchlist Item Position Command - request body for PATCH /api/watchlist/:id
 */
export interface UpdateWatchlistItemPositionCommand {
  grid_position: number; // Must be 0-15
}

/**
 * Watchlist Item Update - single item in batch update
 */
export interface WatchlistItemUpdate {
  id: string; // UUID of the watchlist item
  grid_position?: number; // New position (0-15)
  ticker?: string; // New ticker
}

/**
 * Batch Update Watchlist Items Command - request body for PATCH /api/watchlist
 */
export interface BatchUpdateWatchlistItemsCommand {
  updates: WatchlistItemUpdate[];
}

/**
 * Batch Update Watchlist Items Response - returned by PATCH /api/watchlist
 */
export interface BatchUpdateWatchlistItemsDTO {
  items: WatchlistItemDTO[];
}

// ============================================================================
// MARKET DATA DTOs
// ============================================================================

/**
 * Candle Data - represents a single OHLC candle
 * Used for charting
 */
export interface CandleData {
  time: string; // 'yyyy-mm-dd'
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Asset Price DTO - returned by GET /api/market/price/:ticker
 */
export interface AssetPriceDTO {
  ticker: string;
  price: number;
  currency: Currency;
  timestamp: string; // ISO 8601 timestamp
  cached: boolean; // Whether data was served from cache
}

/**
 * Exchange Rate DTO - returned by GET /api/market/exchange-rate
 */
export interface ExchangeRateDTO {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: string; // ISO 8601 timestamp
  cached: boolean; // Whether data was served from cache
}

/**
 * Market Data Status DTO - returned by GET /api/market/status
 */
export interface MarketDataStatusDTO {
  status: 'operational' | 'degraded' | 'down';
  last_updated: string; // ISO 8601 timestamp
  cache_ttl_seconds: number; // Time to live for cached data
  next_refresh: string; // ISO 8601 timestamp
}

// ============================================================================
// ERROR RESPONSE DTOs
// ============================================================================

/**
 * API Error Response - standardized error format for all endpoints
 */
export interface ErrorResponseDTO {
  error: {
    code: string; // Error code (e.g., "VALIDATION_ERROR", "NOT_FOUND")
    message: string; // Human-readable error message
    field?: string; // Field that caused the error (for validation errors)
    timestamp: string; // ISO 8601 timestamp
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Common query parameters for currency conversion
 */
export interface CurrencyQueryParams {
  currency?: Currency;
}

/**
 * Filter parameters for portfolio queries
 */
export interface PortfolioFilterParams extends CurrencyQueryParams {
  sector_id?: string | 'null'; // 'null' string to filter for unassigned assets
}
