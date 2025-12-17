import React from 'react';
import { Toaster } from 'sonner';
import { useWatchlist } from '../hooks/useWatchlist';
import { WatchlistHeader } from './WatchlistHeader';
import { WatchlistGrid } from './WatchlistGrid';

export const WatchlistView: React.FC = () => {
  const { 
    items, 
    isLoading, 
    addItem, 
    removeItem, 
    reorderItems 
  } = useWatchlist();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8 space-y-6">
      <Toaster position="top-right" theme="dark" />
      
      <WatchlistHeader 
        onAddTicker={addItem} 
        itemCount={items.length} 
        maxItems={16}
      />

      {isLoading && items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-500" />
        </div>
      ) : (
        <WatchlistGrid 
          items={items} 
          onReorder={reorderItems} 
          onDelete={removeItem} 
        />
      )}
    </div>
  );
};
