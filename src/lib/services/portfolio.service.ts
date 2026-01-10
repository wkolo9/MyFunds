import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import type { 
  PortfolioAssetDTO, 
  PortfolioListDTO, 
  PortfolioSummaryDTO, 
  CreatePortfolioAssetCommand, 
  UpdatePortfolioAssetCommand,
  PortfolioFilterParams,
  SectorBreakdownDTO
} from '@/types';
import { ValidationError, NotFoundError, DatabaseError, ConflictError } from '@/lib/utils/error.utils';
import { marketService } from './market.service';

export class PortfolioService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves portfolio assets for a user, enriched with market data
   */
  async getAssets(userId: string, options: PortfolioFilterParams = {}): Promise<PortfolioListDTO> {
    if (!userId) {
      throw new ValidationError('User ID is required', 'user_id');
    }

    // 1. Fetch assets from DB
    let query = this.supabase
      .from('portfolio_assets')
      .select(`
        *,
        sectors (
          name
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    if (options.sector_id) {
      if (options.sector_id === 'null') {
        query = query.is('sector_id', null);
      } else {
        query = query.eq('sector_id', options.sector_id);
      }
    }

    const { data: assets, error, count } = await query;

    if (error) {
      throw new DatabaseError(error.message);
    }

    // 2. Prepare target currency
    const targetCurrency = options.currency || 'USD';

    // 3. Enrich assets
    const enrichedAssets: PortfolioAssetDTO[] = await Promise.all(
      (assets || []).map(async (asset) => {
        try {
          const priceData = await marketService.getPrice(asset.ticker);
          let exchangeRate = 1;
          
          if (priceData.currency !== targetCurrency) {
             const rateData = await marketService.getExchangeRate(priceData.currency, targetCurrency);
             exchangeRate = rateData.rate;
          }

          const priceInTargetCurrency = priceData.price * exchangeRate;
          const quantity = parseFloat(asset.quantity);
          const currentValue = quantity * priceInTargetCurrency;

          // @ts-ignore - Supabase types join handling
          const sectorName = asset.sectors?.name || 'Other';

          return {
            ...asset,
            sector_name: sectorName,
            current_price: priceInTargetCurrency,
            current_value: currentValue,
            currency: targetCurrency
          };
        } catch (err) {
          console.error(`Failed to fetch price for ${asset.ticker}`, err);
          return {
            ...asset,
            // @ts-ignore
            sector_name: asset.sectors?.name || 'Other',
            current_price: 0,
            current_value: 0,
            currency: targetCurrency
          };
        }
      })
    );

    const totalValue = enrichedAssets.reduce((sum, asset) => sum + asset.current_value, 0);

    return {
      assets: enrichedAssets,
      total_value: totalValue,
      currency: targetCurrency,
      last_updated: new Date().toISOString(),
      total: count || 0,
    };
  }

  /**
   * Retrieves portfolio summary
   */
  async getSummary(userId: string, options: PortfolioFilterParams = {}): Promise<PortfolioSummaryDTO> {
    // Reuse getAssets to reuse enrichment logic
    const { assets, total_value, currency, last_updated } = await this.getAssets(userId, options);

    // Aggregate by sector
    const sectorMap = new Map<string, SectorBreakdownDTO>();

    // Initialize "Other" sector
    const otherSectorId = 'null'; // using string 'null' for map key
    
    for (const asset of assets) {
      const sectorId = asset.sector_id || otherSectorId;
      const sectorName = asset.sector_name;
      
      const existing = sectorMap.get(sectorId);
      if (existing) {
        existing.value += asset.current_value;
      } else {
        sectorMap.set(sectorId, {
          sector_id: asset.sector_id,
          sector_name: sectorName,
          value: asset.current_value,
          percentage: 0 // Will calculate later
        });
      }
    }

    const sectors = Array.from(sectorMap.values()).map(sector => ({
      ...sector,
      percentage: total_value > 0 ? (sector.value / total_value) * 100 : 0
    }));

    return {
      total_value,
      currency,
      sectors,
      last_updated
    };
  }

  /**
   * Creates a new portfolio asset
   */
  async createAsset(userId: string, command: CreatePortfolioAssetCommand): Promise<PortfolioAssetDTO> {
    if (!userId) throw new ValidationError('User ID is required', 'user_id');

    // 1. Check duplicate ticker
    const { data: existing, error: checkError } = await this.supabase
      .from('portfolio_assets')
      .select('id')
      .eq('user_id', userId)
      .eq('ticker', command.ticker)
      .maybeSingle();

    if (checkError) throw new DatabaseError(checkError.message);
    if (existing) {
      throw new ConflictError(`Asset with ticker ${command.ticker} already exists`);
    }

    // 2. Validate ticker with market service
    try {
      await marketService.getPrice(command.ticker);
    } catch (err) {
      if (err instanceof NotFoundError) {
         throw new ValidationError(`Invalid ticker symbol: ${command.ticker}`, 'ticker');
      }
      // If service unavailable, we might fail or proceed. Plan says 503 if provider unreachable.
      // But here we are validating input. If market service is down, we can't validate ticker.
      // We will let the error propagate (it will be caught by API handler).
      throw err;
    }

    // 3. Verify sector if provided
    if (command.sector_id) {
       const { data: sector, error: sectorError } = await this.supabase
        .from('sectors')
        .select('id')
        .eq('id', command.sector_id)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (sectorError) throw new DatabaseError(sectorError.message);
      if (!sector) throw new NotFoundError('Sector not found');
    }

    // 4. Insert
    const { data: asset, error: insertError } = await this.supabase
      .from('portfolio_assets')
      .insert({
        user_id: userId,
        ticker: command.ticker,
        quantity: command.quantity,
        sector_id: command.sector_id || null
      })
      .select(`
        *,
        sectors (
          name
        )
      `)
      .single();

    if (insertError) throw new DatabaseError(insertError.message);

    // 5. Return enriched DTO
    // We can fetch just this one asset price
    const priceData = await marketService.getPrice(asset.ticker);
    
    // Normalize to USD for creation response
    const targetCurrency = 'USD';
    let exchangeRate = 1;
    if (priceData.currency !== targetCurrency) {
         const rateData = await marketService.getExchangeRate(priceData.currency, targetCurrency);
         exchangeRate = rateData.rate;
    }

    const currentPrice = priceData.price * exchangeRate;
    const currentValue = parseFloat(asset.quantity) * currentPrice;

    // @ts-ignore
    const sectorName = asset.sectors?.name || 'Other';

    return {
      ...asset,
      sector_name: sectorName,
      current_price: currentPrice,
      current_value: currentValue,
      currency: targetCurrency 
    };
  }

  /**
   * Updates a portfolio asset
   */
  async updateAsset(userId: string, assetId: string, command: UpdatePortfolioAssetCommand): Promise<PortfolioAssetDTO> {
    // 1. Verify existence
    const { data: existing, error: findError } = await this.supabase
      .from('portfolio_assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) throw new DatabaseError(findError.message);
    if (!existing) throw new NotFoundError('Asset not found');

    // 2. Verify sector if changing
    if (command.sector_id !== undefined && command.sector_id !== null) {
      const { data: sector, error: sectorError } = await this.supabase
       .from('sectors')
       .select('id')
       .eq('id', command.sector_id)
       .eq('user_id', userId)
       .maybeSingle();
     
     if (sectorError) throw new DatabaseError(sectorError.message);
     if (!sector) throw new NotFoundError('Sector not found');
   }

   // 3. Update
   const updates: any = {};
   if (command.quantity !== undefined) updates.quantity = command.quantity;
   if (command.sector_id !== undefined) updates.sector_id = command.sector_id;

   const { data: updatedAsset, error: updateError } = await this.supabase
     .from('portfolio_assets')
     .update(updates)
     .eq('id', assetId)
     .eq('user_id', userId)
     .select(`
        *,
        sectors (
          name
        )
      `)
     .single();

    if (updateError) throw new DatabaseError(updateError.message);

    // 4. Enrich
    const priceData = await marketService.getPrice(updatedAsset.ticker);
    
    // Normalize to USD
    const targetCurrency = 'USD';
    let exchangeRate = 1;
    if (priceData.currency !== targetCurrency) {
         const rateData = await marketService.getExchangeRate(priceData.currency, targetCurrency);
         exchangeRate = rateData.rate;
    }

    const currentPrice = priceData.price * exchangeRate;
    const currentValue = parseFloat(updatedAsset.quantity) * currentPrice;

    // @ts-ignore
    const sectorName = updatedAsset.sectors?.name || 'Other';

    return {
      ...updatedAsset,
      sector_name: sectorName,
      current_price: currentPrice,
      current_value: currentValue,
      currency: targetCurrency
    };
  }

  /**
   * Deletes a portfolio asset
   */
  async deleteAsset(userId: string, assetId: string): Promise<void> {
    // 1. Verify existence
    const { data: existing, error: findError } = await this.supabase
      .from('portfolio_assets')
      .select('id')
      .eq('id', assetId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (findError) throw new DatabaseError(findError.message);
    if (!existing) throw new NotFoundError('Asset not found');

    // 2. Delete
    const { error: deleteError } = await this.supabase
      .from('portfolio_assets')
      .delete()
      .eq('id', assetId)
      .eq('user_id', userId);

    if (deleteError) throw new DatabaseError(deleteError.message);
  }
}

export function createPortfolioService(supabase: SupabaseClient<Database>): PortfolioService {
  return new PortfolioService(supabase);
}

