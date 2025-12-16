import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { 
  WatchlistListDTO, 
  WatchlistItemDTO, 
  CreateWatchlistItemCommand, 
  BatchUpdateWatchlistItemsCommand, 
  BatchUpdateWatchlistItemsDTO,
  WatchlistItemEntity,
  WatchlistItemUpdate
} from '../../types';
import { ValidationError, NotFoundError, DatabaseError, ConflictError } from '../utils/error.utils';
import { marketService } from './market.service';

/**
 * Watchlist Service - handles watchlist-related database operations
 */
export class WatchlistService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves watchlist items for a user, enriched with market data
   */
  async getWatchlist(userId: string): Promise<WatchlistListDTO> {
    if (!userId) {
      throw new ValidationError('User ID is required', 'user_id');
    }

    // 1. Fetch items from DB
    const { data: items, error, count } = await this.supabase
      .from('watchlist_items')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('grid_position', { ascending: true });

    if (error) {
      throw new DatabaseError(error.message);
    }

    const watchlistItems = items || [];

    // 2. Fetch current prices for all tickers
    // We do this in parallel for efficiency
    const itemsWithPrices: WatchlistItemDTO[] = await Promise.all(
      watchlistItems.map(async (item) => {
        try {
          // Fetch price from market service (cached)
          const priceData = await marketService.getPrice(item.ticker);
          return {
            ...item,
            current_price: priceData.price,
          };
        } catch (err) {
          // If price fetch fails, return 0 or last known price (if we had it)
          // For now, we'll return 0 to indicate error/missing data without breaking the whole list
          console.error(`Failed to fetch price for ${item.ticker}`, err);
          return {
            ...item,
            current_price: 0,
          };
        }
      })
    );

    return {
      items: itemsWithPrices,
      last_updated: new Date().toISOString(),
      total: count || 0,
      max_items: 16,
    };
  }

  /**
   * Creates a new watchlist item
   */
  async createWatchlistItem(userId: string, command: CreateWatchlistItemCommand): Promise<WatchlistItemDTO> {
    if (!userId) throw new ValidationError('User ID is required', 'user_id');

    // 1. Validate grid position
    if (command.grid_position < 0 || command.grid_position > 15) {
      throw new ValidationError('Grid position must be between 0 and 15', 'grid_position');
    }

    // 2. Check max items limit (16)
    const { count, error: countError } = await this.supabase
      .from('watchlist_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw new DatabaseError(countError.message);
    if (count !== null && count >= 16) {
      throw new ValidationError('Maximum limit of 16 watchlist items reached', 'watchlist');
    }

    // 3. Check if ticker already exists for this user
    const { data: existingTicker, error: tickerError } = await this.supabase
      .from('watchlist_items')
      .select('id')
      .eq('user_id', userId)
      .eq('ticker', command.ticker)
      .maybeSingle();

    if (tickerError) throw new DatabaseError(tickerError.message);
    if (existingTicker) {
      throw new ConflictError(`Ticker ${command.ticker} is already in your watchlist`);
    }

    // 4. Check if position is occupied
    const { data: existingPosition, error: positionError } = await this.supabase
      .from('watchlist_items')
      .select('id')
      .eq('user_id', userId)
      .eq('grid_position', command.grid_position)
      .maybeSingle();

    if (positionError) throw new DatabaseError(positionError.message);
    if (existingPosition) {
      throw new ConflictError(`Grid position ${command.grid_position} is already occupied`);
    }

    // 5. Validate ticker with Market Service
    try {
      await marketService.getPrice(command.ticker);
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw new ValidationError(`Invalid ticker symbol: ${command.ticker}`, 'ticker');
      }
      // If market service is down, we might allow it or fail. 
      // Plan says: "Invalid Ticker: Market API check fails -> Return 400 or 404".
      // We'll treat it as validation error if not found.
      throw err; 
    }

    // 6. Insert item
    const { data, error } = await this.supabase
      .from('watchlist_items')
      .insert({
        user_id: userId,
        ticker: command.ticker,
        grid_position: command.grid_position,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);

    // 7. Return DTO with price
    const priceData = await marketService.getPrice(data.ticker);
    return {
      ...data,
      current_price: priceData.price,
    };
  }

  /**
   * Batch updates watchlist items (positions and/or tickers)
   */
  /**
   * Batch updates watchlist items (positions and/or tickers)
   */
  async batchUpdateItems(userId: string, command: BatchUpdateWatchlistItemsCommand): Promise<BatchUpdateWatchlistItemsDTO> {
    if (!userId) throw new ValidationError('User ID is required', 'user_id');
    if (!command.updates || command.updates.length === 0) {
      throw new ValidationError('No updates provided', 'updates');
    }

    // 1. Fetch current state
    const currentItems = await this.fetchCurrentItems(userId);
    const itemMap = new Map(currentItems.map(item => [item.id, item]));

    // 2. Prepare and validate working state
    const workingState = this.applyUpdates(currentItems, command.updates);
    
    // 3. Validate constraints on the final state
    this.validateWatchlistState(workingState);

    // 4. Persist changes
    const updatedData = await this.persistUpdates(userId, workingState);

    // 5. Enrich with market data
    return {
      items: await this.enrichItemsWithPrices(updatedData)
    };
  }

  // --- Private Helpers ---

  private async fetchCurrentItems(userId: string): Promise<WatchlistItemEntity[]> {
    const { data: currentItems, error: fetchError } = await this.supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) throw new DatabaseError(fetchError.message);
    if (!currentItems) throw new NotFoundError('Watchlist items');
    return currentItems;
  }

  private applyUpdates(currentItems: WatchlistItemEntity[], updates: WatchlistItemUpdate[]): WatchlistItemEntity[] {
    // Deep copy to avoid mutating original state references if any
    const workingState = currentItems.map(item => ({ ...item }));

    for (const update of updates) {
      const itemIndex = workingState.findIndex(item => item.id === update.id);
      if (itemIndex === -1) {
        throw new NotFoundError(`Watchlist item ${update.id}`);
      }
      
      if (update.grid_position !== undefined) {
        workingState[itemIndex].grid_position = update.grid_position;
      }
      
      if (update.ticker !== undefined) {
        workingState[itemIndex].ticker = update.ticker;
      }
    }
    return workingState;
  }

  private validateWatchlistState(items: WatchlistItemEntity[]): void {
    const usedPositions = new Set<number>();
    const usedTickers = new Set<string>();

    for (const item of items) {
      // Validate position range
      if (item.grid_position < 0 || item.grid_position > 15) {
        throw new ValidationError(`Invalid grid position ${item.grid_position} for item ${item.ticker}`, 'grid_position');
      }

      // Check unique position
      if (usedPositions.has(item.grid_position)) {
         throw new ConflictError(`Grid position ${item.grid_position} is duplicated in the update`);
      }
      usedPositions.add(item.grid_position);

      // Check unique ticker
      if (usedTickers.has(item.ticker)) {
        throw new ConflictError(`Ticker ${item.ticker} is duplicated`);
      }
      usedTickers.add(item.ticker);
    }
  }

  private async persistUpdates(userId: string, items: WatchlistItemEntity[]): Promise<WatchlistItemEntity[]> {
    const { data, error } = await this.supabase
      .from('watchlist_items')
      .upsert(items.map(item => ({
        id: item.id,
        user_id: userId,
        ticker: item.ticker,
        grid_position: item.grid_position,
        created_at: item.created_at
      })))
      .select();

    if (error) throw new DatabaseError(error.message);
    return data || [];
  }

  private async enrichItemsWithPrices(items: WatchlistItemEntity[]): Promise<WatchlistItemDTO[]> {
    return Promise.all(
      items.map(async (item) => {
        try {
          const priceData = await marketService.getPrice(item.ticker);
          return { ...item, current_price: priceData.price };
        } catch (e) {
          // Fallback for individual item failures
          return { ...item, current_price: 0 };
        }
      })
    );
  }


  /**
   * Deletes a watchlist item
   */
  async deleteWatchlistItem(userId: string, itemId: string): Promise<void> {
    if (!userId) throw new ValidationError('User ID is required', 'user_id');
    if (!itemId) throw new ValidationError('Item ID is required', 'id');

    // 1. Check existence
    const { data: existing, error: findError } = await this.supabase
      .from('watchlist_items')
      .select('id')
      .eq('id', itemId)
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) throw new DatabaseError(findError.message);
    if (!existing) throw new NotFoundError('Watchlist item');

    // 2. Delete
    const { error } = await this.supabase
      .from('watchlist_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) throw new DatabaseError(error.message);
  }
}

/**
 * Factory function to create WatchlistService instance
 */
export function createWatchlistService(supabase: SupabaseClient<Database>): WatchlistService {
  return new WatchlistService(supabase);
}

