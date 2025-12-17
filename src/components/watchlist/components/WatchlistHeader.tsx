import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface WatchlistHeaderProps {
  onAddTicker: (ticker: string) => Promise<void>;
  itemCount: number;
  maxItems: number;
}

export const WatchlistHeader: React.FC<WatchlistHeaderProps> = ({ 
  onAddTicker, 
  itemCount, 
  maxItems 
}) => {
  const [ticker, setTicker] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicker = ticker.trim().toUpperCase();
    
    if (!cleanTicker) return;

    if (itemCount >= maxItems) {
      toast.error(`Maximum limit of ${maxItems} items reached`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddTicker(cleanTicker);
      setTicker('');
    } catch (error) {
      // Error is handled by the hook usually, but we catch here to stop loading state if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Watchlist</h1>
        <p className="text-slate-400">Monitor your favorite stocks in real-time.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-sm items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="text"
            placeholder="Add Ticker (e.g. AAPL)"
            className="pl-9 bg-slate-950 border-slate-800 focus:border-slate-700"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <Button 
          type="submit" 
          disabled={isSubmitting || !ticker.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isSubmitting ? (
             <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> Add
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
