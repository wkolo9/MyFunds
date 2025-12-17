import type {
  WatchlistListDTO,
  WatchlistItemDTO,
  CreateWatchlistItemCommand,
  BatchUpdateWatchlistItemsCommand,
  BatchUpdateWatchlistItemsDTO
} from '../../types';
import { handleResponse } from '../utils/api.utils';

export const watchlistApi = {
  getAll: async (): Promise<WatchlistListDTO> => {
    const response = await fetch('/api/watchlist');
    return handleResponse<WatchlistListDTO>(response);
  },

  addItem: async (data: CreateWatchlistItemCommand): Promise<WatchlistItemDTO> => {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<WatchlistItemDTO>(response);
  },

  deleteItem: async (id: string): Promise<void> => {
    const response = await fetch(`/api/watchlist/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  updatePositions: async (data: BatchUpdateWatchlistItemsCommand): Promise<BatchUpdateWatchlistItemsDTO> => {
    const response = await fetch('/api/watchlist/positions', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<BatchUpdateWatchlistItemsDTO>(response);
  }
};

