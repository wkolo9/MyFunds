import type {
  PortfolioListDTO,
  PortfolioSummaryDTO,
  PortfolioAssetDTO,
  CreatePortfolioAssetCommand,
  UpdatePortfolioAssetCommand,
  Currency
} from '../../types';
import { handleResponse } from '../utils/api.utils';

export const portfolioApi = {
  getAssets: async (currency: Currency): Promise<PortfolioListDTO> => {
    const params = new URLSearchParams({ currency });
    const response = await fetch(`/api/portfolio?${params}`);
    return handleResponse<PortfolioListDTO>(response);
  },

  getSummary: async (currency: Currency): Promise<PortfolioSummaryDTO> => {
    const params = new URLSearchParams({ currency });
    const response = await fetch(`/api/portfolio/summary?${params}`);
    return handleResponse<PortfolioSummaryDTO>(response);
  },

  addAsset: async (data: CreatePortfolioAssetCommand): Promise<PortfolioAssetDTO> => {
    const response = await fetch('/api/portfolio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<PortfolioAssetDTO>(response);
  },

  updateAsset: async (id: string, data: UpdatePortfolioAssetCommand): Promise<PortfolioAssetDTO> => {
    const response = await fetch(`/api/portfolio/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<PortfolioAssetDTO>(response);
  },

  deleteAsset: async (id: string): Promise<void> => {
    const response = await fetch(`/api/portfolio/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  }
};

