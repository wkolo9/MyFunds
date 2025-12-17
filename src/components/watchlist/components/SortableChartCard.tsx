import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChartCard } from './ChartCard';
import type { WatchlistItemDTO } from '@/types';

interface SortableChartCardProps {
  item: WatchlistItemDTO;
  onDelete: (id: string) => void;
}

export const SortableChartCard: React.FC<SortableChartCardProps> = ({ item, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ChartCard 
        item={item} 
        onDelete={() => onDelete(item.id)} 
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

