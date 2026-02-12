// components/SimulationHistoryItem.tsx

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { SimulationHistoryItem as SimulationItem } from '../../types/historySidebar';

interface SimulationHistoryItemProps {
  item: SimulationItem;
  isSelected: boolean;
  isDeleting: boolean;
  onSelect: (item: SimulationItem) => void;
  onDeleteClick: (simfolder: string, e: React.MouseEvent) => void;
}

export function SimulationHistoryItem({
  item,
  isSelected,
  isDeleting,
  onSelect,
  onDeleteClick
}: SimulationHistoryItemProps) {
  return (
    <div className="flex items-center gap-2 group">
      <Button
        variant={isSelected ? 'default' : 'outline'}
        className="flex-1 justify-start text-left hover:bg-surface-2 transition-colors overflow-hidden"
        onClick={() => onSelect(item)}
        disabled={isDeleting}
      >
        <div className="truncate w-full">
          <div className="font-medium truncate">
            {item.name || item.simname || item.simfolder}
          </div>
          <div className="text-xs opacity-50 truncate">
            {item.created}
          </div>
        </div>
      </Button>

      <button
        onClick={(e) => onDeleteClick(item.simfolder, e)}
        className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all flex-shrink-0"
        title="Delete simulation"
        disabled={isDeleting}
      >
        {isDeleting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}