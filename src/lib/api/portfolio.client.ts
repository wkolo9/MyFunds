import type {
  PortfolioListDTO,
  PortfolioSummaryDTO,
  PortfolioAssetDTO,
  CreatePortfolioAssetCommand,
  UpdatePortfolioAssetCommand,
  Currency
} from '../../types';
import { handleResponse } from '../utils/api.utils';
import { getAuthHeaders } from '../utils/client-auth';

export const portfolioApi = {
  getAssets: async (currency: Currency): Promise<PortfolioListDTO> => {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ currency });
    const response = await fetch(`/api/portfolio?${params}`, {
      headers
    });
    return handleResponse<PortfolioListDTO>(response);
  },

  getSummary: async (currency: Currency): Promise<PortfolioSummaryDTO> => {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ currency });
    const response = await fetch(`/api/portfolio/summary?${params}`, {
      headers
    });
    return handleResponse<PortfolioSummaryDTO>(response);
  },

  addAsset: async (data: CreatePortfolioAssetCommand): Promise<PortfolioAssetDTO> => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/portfolio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data),
    });
    return handleResponse<PortfolioAssetDTO>(response);
  },

  updateAsset: async (id: string, data: UpdatePortfolioAssetCommand): Promise<PortfolioAssetDTO> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/portfolio/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data),
    });
    return handleResponse<PortfolioAssetDTO>(response);
  },

  deleteAsset: async (id: string): Promise<void> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/portfolio/${id}`, {
      method: 'DELETE',
      headers
    });
    return handleResponse<void>(response);
  }
};

