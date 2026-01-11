import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { watchlistApi } from '@/lib/api/watchlist.client';
import { DEFAULT_USER_ID } from '@/config/constants';
import type { WatchlistItemDTO, WatchlistItemUpdate } from '@/types';

interface WatchlistState {
  items: WatchlistItemDTO[];
  isLoading: boolean;
  error: string | null;
}

export const useWatchlist = () => {
  const [state, setState] = useState<WatchlistState>({
    items: [],
    isLoading: true,
    error: null,
  });

  const fetchItems = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const data = await watchlistApi.getAll();
      const sortedItems = [...data.items].sort((a, b) => a.grid_position - b.grid_position);
      setState({ items: sortedItems, isLoading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to load watchlist' }));
      toast.error('Failed to load watchlist');
    }
  }, []);

  const addItem = useCallback(async (ticker: string) => {
    if (state.items.length >= 16) {
      toast.error('Maximum number of charts reached (16)');
      return;
    }

    if (state.items.some(item => item.ticker === ticker)) {
      toast.error('Ticker already in watchlist');
      return;
    }

    const newItemPosition = state.items.length;
    const tempId = crypto.randomUUID();
    const tempItem: WatchlistItemDTO = {
      id: tempId,
      user_id: DEFAULT_USER_ID,
      ticker,
      grid_position: newItemPosition,
      created_at: new Date().toISOString(),
      current_price: 0,
    };

    setState(prev => ({ ...prev, items: [...prev.items, tempItem] }));

    try {
      const createdItem = await watchlistApi.addItem({ ticker, grid_position: newItemPosition });
      setState(prev => ({
        ...prev,
        items: prev.items.map(item => item.id === tempId ? createdItem : item)
      }));
      toast.success(`Added ${ticker}`);
    } catch (error) {
      console.error('Failed to add item:', error);
      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== tempId)
      }));
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add item');
      }
    }
  }, [state.items]);

  const removeItem = useCallback(async (id: string) => {
    const itemToRemove = state.items.find(i => i.id === id);
    if (!itemToRemove) return;

    const previousItems = [...state.items];
    const newItems = state.items.filter(item => item.id !== id);
    
    const reindexedItems = newItems.map((item, index) => ({
      ...item,
      grid_position: index
    }));

    setState(prev => ({ ...prev, items: reindexedItems }));

    try {
      await watchlistApi.deleteItem(id);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setState(prev => ({ ...prev, items: previousItems }));
      toast.error('Failed to remove item');
    }
  }, [state.items]);

  const reorderItems = useCallback(async (newOrderIds: string[]) => {
    const currentItemsMap = new Map(state.items.map(item => [item.id, item]));
    
    const reorderedItems: WatchlistItemDTO[] = [];
    const updates: WatchlistItemUpdate[] = [];

    newOrderIds.forEach((id, index) => {
      const item = currentItemsMap.get(id);
      if (item) {
        const newItem = { ...item, grid_position: index };
        reorderedItems.push(newItem);
        
        if (item.grid_position !== index) {
          updates.push({ id, grid_position: index });
        }
      }
    });

    if (updates.length === 0) return;

    setState(prev => ({ ...prev, items: reorderedItems }));

    try {
      await watchlistApi.updatePositions({ updates });
    } catch (error) {
      console.error('Failed to update positions:', error);
      toast.error('Failed to save order');
      fetchItems();
    }
  }, [state.items, fetchItems]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items: state.items,
    isLoading: state.isLoading,
    error: state.error,
    addItem,
    removeItem,
    reorderItems,
    refresh: fetchItems
  };
};
