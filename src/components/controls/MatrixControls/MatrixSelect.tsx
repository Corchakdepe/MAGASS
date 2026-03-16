"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLanguage } from "@/contexts/LanguageContext";

export interface MatrixOption {
  label: string;
  id: number;
}

export interface MatrixSelectProps {
  matrices: readonly MatrixOption[];
  seleccionAgreg: string; // Semicolon-separated IDs: "1;2;3"
  setSeleccionAgreg: (value: string) => void;
  placeholder?: string;
}

export function MatrixSelect({
  matrices,
  seleccionAgreg,
  setSeleccionAgreg,
  placeholder,
}: MatrixSelectProps) {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);

  // Convert semicolon-separated string to array of IDs
  const selectedIds = React.useMemo(() => {
    if (!seleccionAgreg) return [];
    return seleccionAgreg.split(';').filter(id => id !== '');
  }, [seleccionAgreg]);

  // Get selected matrix objects
  const selectedMatrices = React.useMemo(
    () => matrices.filter((m) => selectedIds.includes(String(m.id))),
    [matrices, selectedIds]
  );

  const handleToggle = (matrixId: string) => {
    let newSelectedIds: string[];

    if (selectedIds.includes(matrixId)) {
      // Remove if already selected
      newSelectedIds = selectedIds.filter(id => id !== matrixId);
    } else {
      // Add if not selected
      newSelectedIds = [...selectedIds, matrixId];
    }

    // Join back to semicolon-separated string
    setSeleccionAgreg(newSelectedIds.join(';'));
    // Don't close the popover to allow multiple selections
  };

  const handleRemoveItem = (matrixId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelectedIds = selectedIds.filter(id => id !== matrixId);
    setSeleccionAgreg(newSelectedIds.join(';'));
  };

  const handleClearAll = () => {
    setSeleccionAgreg("");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-9 px-3 text-xs rounded-md border-surface-3 bg-surface-1 hover:bg-surface-0/70"
          >
            <span className="truncate text-text-secondary">
              {placeholder || t('selectMatrices')}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0 rounded-lg border-surface-3 bg-surface-1/95 backdrop-blur-md shadow-mac-panel"
          align="start"
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder={t('searchMatrix')}
              className="h-9 text-xs border-none focus:ring-0"
            />
            <CommandList>
              <CommandEmpty className="py-3 text-xs text-text-secondary text-center">
                {t('noResults')}
              </CommandEmpty>
              <CommandGroup>
                {matrices.map((matrix) => {
                  const isSelected = selectedIds.includes(String(matrix.id));

                  return (
                    <CommandItem
                      key={matrix.id}
                      value={matrix.label}
                      onSelect={() => handleToggle(String(matrix.id))}
                      className="text-xs cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                          isSelected
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-surface-3"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate flex-1">{matrix.label}</span>
                      <span className="ml-2 text-[10px] text-text-tertiary">
                        ID: {matrix.id}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>

          {/* Footer with actions */}
          {selectedMatrices.length > 0 && (
            <div className="flex items-center justify-between border-t border-surface-3 p-2">
              <span className="text-[10px] text-text-tertiary">
                {selectedMatrices.length} {selectedMatrices.length === 1 ? t('matrix') : t('matrices')} {t('selected')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-2"
                onClick={handleClearAll}
              >
                {t('clearAll')}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected items displayed under the button in accent color */}
      {selectedMatrices.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedMatrices.map((matrix) => (
            <div
              key={matrix.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent border border-accent/20"
            >
              <span className="truncate max-w-[150px]">{matrix.label}</span>
              <button
                onClick={(e) => handleRemoveItem(String(matrix.id), e)}
                className="hover:bg-accent/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">{t('remove')}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}