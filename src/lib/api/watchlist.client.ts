import type {
  WatchlistListDTO,
  WatchlistItemDTO,
  CreateWatchlistItemCommand,
  BatchUpdateWatchlistItemsCommand,
  BatchUpdateWatchlistItemsDTO
} from '../../types';
import { handleResponse } from '../utils/api.utils';
import { getAuthHeaders } from '../utils/client-auth';

export const watchlistApi = {
  getAll: async (): Promise<WatchlistListDTO> => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/watchlist', {
      headers
    });
    return handleResponse<WatchlistListDTO>(response);
  },

  addItem: async (data: CreateWatchlistItemCommand): Promise<WatchlistItemDTO> => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data),
    });
    return handleResponse<WatchlistItemDTO>(response);
  },

  deleteItem: async (id: string): Promise<void> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/watchlist/${id}`, {
      method: 'DELETE',
      headers
    });
    return handleResponse<void>(response);
  },

  updatePositions: async (data: BatchUpdateWatchlistItemsCommand): Promise<BatchUpdateWatchlistItemsDTO> => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/watchlist/positions', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data),
    });
    return handleResponse<BatchUpdateWatchlistItemsDTO>(response);
  }
};

