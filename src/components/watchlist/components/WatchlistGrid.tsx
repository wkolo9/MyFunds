import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableChartCard } from './SortableChartCard';
import { ChartCard } from './ChartCard';
import type { WatchlistItemDTO } from '@/types';

interface WatchlistGridProps {
  items: WatchlistItemDTO[];
  onReorder: (newOrderIds: string[]) => void;
  onDelete: (id: string) => void;
}

export const WatchlistGrid: React.FC<WatchlistGridProps> = ({ items, onReorder, onDelete }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(items, oldIndex, newIndex);
      onReorder(newOrder.map(item => item.id));
    }

    setActiveId(null);
  };

  const activeItem = items.find(item => item.id === activeId);

  if (items.length === 0) {
    return (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 text-muted-foreground">
            <p>Your watchlist is empty.</p>
            <p className="text-sm">Add a ticker above to get started.</p>
        </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <SortableChartCard 
              key={item.id} 
              item={item} 
              onDelete={onDelete} 
            />
          ))}
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeId && activeItem ? (
           <div className="opacity-80">
              <ChartCard 
                item={activeItem} 
                onDelete={() => {}} 
              />
           </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
