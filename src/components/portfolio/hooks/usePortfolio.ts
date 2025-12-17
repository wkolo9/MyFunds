import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { 
  PortfolioAssetDTO, 
  PortfolioSummaryDTO, 
  Currency, 
  CreatePortfolioAssetCommand, 
  UpdatePortfolioAssetCommand 
} from '../../../types';
import { portfolioApi } from '../../../lib/api/portfolio.client';

export const usePortfolio = () => {
  const [assets, setAssets] = useState<PortfolioAssetDTO[]>([]);
  const [summary, setSummary] = useState<PortfolioSummaryDTO | null>(null);
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPortfolio = useCallback(async (curr: Currency, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const [assetsData, summaryData] = await Promise.all([
        portfolioApi.getAssets(curr),
        portfolioApi.getSummary(curr)
      ]);
      setAssets(assetsData.assets);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      toast.error('Failed to load portfolio data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPortfolio('USD');
  }, [fetchPortfolio]);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    fetchPortfolio(newCurrency, false);
  }, [fetchPortfolio]);

  const refresh = useCallback(() => {
    fetchPortfolio(currency, false);
  }, [currency, fetchPortfolio]);

  const addAsset = useCallback(async (data: CreatePortfolioAssetCommand) => {
    try {
      await portfolioApi.addAsset(data);
      toast.success('Asset added successfully');
      refresh();
    } catch (error) {
      console.error('Failed to add asset:', error);
      toast.error('Failed to add asset');
      throw error;
    }
  }, [refresh]);

  const editAsset = useCallback(async (id: string, data: UpdatePortfolioAssetCommand) => {
    try {
      await portfolioApi.updateAsset(id, data);
      toast.success('Asset updated successfully');
      refresh();
    } catch (error) {
      console.error('Failed to update asset:', error);
      toast.error('Failed to update asset');
      throw error;
    }
  }, [refresh]);

  const removeAsset = useCallback(async (id: string) => {
    try {
      await portfolioApi.deleteAsset(id);
      toast.success('Asset removed successfully');
      refresh();
    } catch (error) {
      console.error('Failed to remove asset:', error);
      toast.error('Failed to remove asset');
      throw error;
    }
  }, [refresh]);

  return {
    assets,
    summary,
    currency,
    isLoading,
    isRefreshing,
    setCurrency,
    addAsset,
    editAsset,
    removeAsset,
    refresh
  };
};

