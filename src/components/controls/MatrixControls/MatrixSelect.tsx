"use client";

import * as React from "react";
import {Check, ChevronsUpDown} from "lucide-react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {useLanguage} from "@/contexts/LanguageContext";

export interface MatrixOption {
  label: string;
  id: number;
}

export interface MatrixSelectProps {
  matrices: readonly MatrixOption[];
  seleccionAgreg: string;
  setSeleccionAgreg: (value: string) => void;
}

export function MatrixSelect({
  matrices,
  seleccionAgreg,
  setSeleccionAgreg,
}: MatrixSelectProps) {
  const {t} = useLanguage();
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => matrices.find((m) => String(m.id) === seleccionAgreg) ?? null,
    [matrices, seleccionAgreg]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 text-xs rounded-md border-surface-3 bg-surface-1 hover:bg-surface-0/70"
        >
          <span className="truncate">
            {selected ? selected.label : t('selectMatrix')}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-2 rounded-lg border-surface-3 bg-surface-1/95 backdrop-blur-md shadow-mac-panel"
        align="start"
      >
        <Command className="bg-transparent">
          <CommandInput placeholder={t('searchMatrix')} className="h-9 text-xs" />
          <CommandList>
            <CommandEmpty className="py-2 text-xs text-text-secondary">
              {t('noResults')}
            </CommandEmpty>
            <CommandGroup>
              {matrices.map((matrix) => {
                const isSelected = String(matrix.id) === seleccionAgreg;
                return (
                  <CommandItem
                    key={matrix.id}
                    value={matrix.label}
                    onSelect={() => {
                      setSeleccionAgreg(String(matrix.id));
                      setOpen(false);
                    }}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100 text-accent" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{matrix.label}</span>
                    <span className="ml-auto text-[10px] text-text-tertiary">
                      {matrix.id}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>

        <div className="pt-2">
          <Button
            variant="ghost"
            className="w-full h-8 text-xs text-text-secondary hover:bg-surface-0/70"
            onClick={() => {
              setSeleccionAgreg("");
              setOpen(false);
            }}
          >
            {t('clearSelection')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
