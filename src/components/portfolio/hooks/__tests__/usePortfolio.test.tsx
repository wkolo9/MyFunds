import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePortfolio } from '../usePortfolio';
import { portfolioApi } from '../../../../lib/api/portfolio.client';
import { toast } from 'sonner';
import type { PortfolioAssetDTO, PortfolioSummaryDTO, CreatePortfolioAssetCommand, PortfolioListDTO } from '../../../../types';

// Mock dependencies
vi.mock('../../../../lib/api/portfolio.client', () => ({
  portfolioApi: {
    getAssets: vi.fn(),
    getSummary: vi.fn(),
    addAsset: vi.fn(),
    updateAsset: vi.fn(),
    deleteAsset: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('usePortfolio Hook', () => {
  // Sample test data
  const mockAssets: PortfolioListDTO = {
    assets: [
      {
        id: '1',
        ticker: 'AAPL',
        quantity: '10',
        current_price: 150,
        current_value: 1500,
        sector_id: 'tech',
        sector_name: 'Technology',
        updated_at: '2024-01-01',
        currency: 'USD',
        user_id: '',
        created_at: ''
      },
    ],
    total_value: 1500,
    currency: 'USD',
    last_updated: '2024-01-01',
    total: 1
  };

  const mockSummary: PortfolioSummaryDTO = {
    total_value: 1500,
    sectors: [{ sector_name: 'Technology', value: 1500, percentage: 100, sector_id: 'tech' }],
    currency: 'USD',
    last_updated: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and data fetching', () => {
    it('should fetch portfolio data for default currency (USD) on mount', async () => {
      // Arrange
      vi.mocked(portfolioApi.getAssets).mockResolvedValue(mockAssets);
      vi.mocked(portfolioApi.getSummary).mockResolvedValue(mockSummary);

      // Act
      const { result } = renderHook(() => usePortfolio());

      // Assert - initial state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.assets).toEqual([]);

      // Wait for effects
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert - state after loading
      expect(portfolioApi.getAssets).toHaveBeenCalledWith('USD');
      expect(portfolioApi.getSummary).toHaveBeenCalledWith('USD');
      expect(result.current.assets).toEqual(mockAssets.assets);
      expect(result.current.summary).toEqual(mockSummary);
    });

    it('should handle error during data fetching', async () => {
      // Arrange
      vi.mocked(portfolioApi.getAssets).mockRejectedValue(new Error('Network error'));
      vi.mocked(portfolioApi.getSummary).mockResolvedValue(mockSummary); // Even if one succeeds

      // Act
      const { result } = renderHook(() => usePortfolio());

      // Wait for effects
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(toast.error).toHaveBeenCalledWith('Failed to load portfolio data');
      expect(result.current.assets).toEqual([]); // Should remain empty
    });
  });

  describe('Currency management (setCurrency)', () => {
    it('should change currency and refresh data without full loader', async () => {
      // Arrange
      vi.mocked(portfolioApi.getAssets).mockResolvedValue(mockAssets);
      vi.mocked(portfolioApi.getSummary).mockResolvedValue(mockSummary);
      const { result } = renderHook(() => usePortfolio());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Act
      act(() => {
        result.current.setCurrency('PLN');
      });

      // Assert
      expect(result.current.currency).toBe('PLN');
      // setCurrency calls fetchPortfolio with showLoading=false, so isRefreshing should be true
      // Note: This happens very quickly, so it might be hard to catch synchronously,
      // but we check if API was called with the new currency.
      
      await waitFor(() => {
        expect(portfolioApi.getAssets).toHaveBeenCalledWith('PLN');
        expect(portfolioApi.getSummary).toHaveBeenCalledWith('PLN');
      });
    });
  });

  describe('Mutations (Add/Edit/Delete)', () => {
    // Setup for each mutation test - initial data loaded
    beforeEach(() => {
      vi.mocked(portfolioApi.getAssets).mockResolvedValue(mockAssets);
      vi.mocked(portfolioApi.getSummary).mockResolvedValue(mockSummary);
    });

    it('addAsset should call API, show success and refresh data', async () => {
      // Arrange
      vi.mocked(portfolioApi.addAsset).mockResolvedValue({ ...mockAssets.assets[0], id: '2' });
      const { result } = renderHook(() => usePortfolio());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Reset fetch mocks to check if they were called again
      vi.mocked(portfolioApi.getAssets).mockClear();

      const newAsset: CreatePortfolioAssetCommand = {
        ticker: 'MSFT',
        quantity: '5',
        sector_id: null
      };

      // Act
      await act(async () => {
        await result.current.addAsset(newAsset);
      });

      // Assert
      expect(portfolioApi.addAsset).toHaveBeenCalledWith(newAsset);
      expect(toast.success).toHaveBeenCalledWith('Asset added successfully');
      // Check if refresh was called (fetch with USD currency)
      expect(portfolioApi.getAssets).toHaveBeenCalledWith('USD');
    });

    it('addAsset should handle error and rethrow', async () => {
      // Arrange
      const error = new Error('Invalid ticker');
      vi.mocked(portfolioApi.addAsset).mockRejectedValue(error);
      const { result } = renderHook(() => usePortfolio());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Act & Assert
      await expect(
        act(async () => {
          await result.current.addAsset({ ticker: 'BAD', quantity: '1', sector_id: null });
        })
      ).rejects.toThrow('Invalid ticker');

      expect(toast.error).toHaveBeenCalledWith('Failed to add asset');
    });

    it('editAsset should update asset and refresh list', async () => {
        // Arrange
        vi.mocked(portfolioApi.updateAsset).mockResolvedValue({ ...mockAssets.assets[0] });
        const { result } = renderHook(() => usePortfolio());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        
        vi.mocked(portfolioApi.getAssets).mockClear();
  
        // Act
        await act(async () => {
          await result.current.editAsset('1', { quantity: '20' });
        });
  
        // Assert
        expect(portfolioApi.updateAsset).toHaveBeenCalledWith('1', { quantity: '20' });
        expect(toast.success).toHaveBeenCalledWith('Asset updated successfully');
        expect(portfolioApi.getAssets).toHaveBeenCalled();
      });

      it('removeAsset should remove asset and refresh list', async () => {
        // Arrange
        vi.mocked(portfolioApi.deleteAsset).mockResolvedValue(undefined);
        const { result } = renderHook(() => usePortfolio());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        
        vi.mocked(portfolioApi.getAssets).mockClear();
  
        // Act
        await act(async () => {
          await result.current.removeAsset('1');
        });
  
        // Assert
        expect(portfolioApi.deleteAsset).toHaveBeenCalledWith('1');
        expect(toast.success).toHaveBeenCalledWith('Asset removed successfully');
        expect(portfolioApi.getAssets).toHaveBeenCalled();
      });
  });
});
