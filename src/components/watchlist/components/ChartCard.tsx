import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, GripVertical } from 'lucide-react';
import { CandleChart } from './CandleChart';
import type { WatchlistItemDTO } from '@/types';

interface ChartCardProps {
  item: WatchlistItemDTO;
  onDelete: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export const ChartCard: React.FC<ChartCardProps> = ({ item, onDelete, dragHandleProps }) => {
  return (
    <Card className="flex h-[320px] flex-col overflow-hidden bg-slate-950 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-0">
        <div className="flex items-center gap-2">
          {dragHandleProps && (
             <Button
             variant="ghost"
             size="icon"
             className="h-6 w-6 cursor-grab text-slate-500 hover:text-slate-300 active:cursor-grabbing"
             {...dragHandleProps}
           >
             <GripVertical className="h-4 w-4" />
           </Button>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-slate-100">{item.ticker}</span>
            <span className="text-xs text-slate-400">
                {/* TODO: Display price */}
               {/* Display price if available, otherwise just currency placeholder or fetch it */}
               {/* Note: In real app price might come from websocket or polling. 
                   Here we rely on item.current_price or chart last candle. 
                   For now, showing simple ticker info. */}
               {item.current_price ? `$${item.current_price.toFixed(2)}` : 'Loading...'}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onDelete}
          className="h-6 w-6 text-slate-500 hover:text-red-400 hover:bg-transparent"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        <CandleChart ticker={item.ticker} height={280} />
      </CardContent>
    </Card>
  );
};

