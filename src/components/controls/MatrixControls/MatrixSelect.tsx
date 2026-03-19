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
  seleccionAgreg: string;
  setSeleccionAgreg: (value: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
}

function normalizeSeleccionAgreg(value: string): string {
  if (!value) return "";
  const seen = new Set<string>();

  return value
    .split(";")
    .map((id) => id.trim())
    .filter((id) => id !== "")
    .filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .join(";");
}

export function MatrixSelect({
  matrices,
  seleccionAgreg,
  setSeleccionAgreg,
  placeholder,
  allowEmpty = false,
}: MatrixSelectProps) {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);

  const selectedIds = React.useMemo(() => {
    return normalizeSeleccionAgreg(seleccionAgreg)
      .split(";")
      .filter((id) => id !== "");
  }, [seleccionAgreg]);

  const selectedMatrices = React.useMemo(
    () => matrices.filter((m) => selectedIds.includes(String(m.id))),
    [matrices, selectedIds]
  );

  const updateSelection = (ids: string[]) => {
    const normalized = normalizeSeleccionAgreg(ids.join(";"));
    if (!allowEmpty && normalized === "") return;
    setSeleccionAgreg(normalized);
  };

  const handleToggle = (matrixId: string) => {
    let newSelectedIds: string[];

    if (selectedIds.includes(matrixId)) {
      newSelectedIds = selectedIds.filter((id) => id !== matrixId);
    } else {
      newSelectedIds = [...selectedIds, matrixId];
    }

    updateSelection(newSelectedIds);
  };

  const handleRemoveItem = (matrixId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateSelection(selectedIds.filter((id) => id !== matrixId));
  };

  const handleClearAll = () => {
    if (!allowEmpty) return;
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
              {selectedMatrices.length > 0
                ? selectedMatrices.map((m) => m.label).join(", ")
                : placeholder || t("selectMatrices")}
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
              placeholder={t("searchMatrix")}
              className="h-9 text-xs border-none focus:ring-0"
            />
            <CommandList>
              <CommandEmpty className="py-3 text-xs text-text-secondary text-center">
                {t("noResults")}
              </CommandEmpty>
              <CommandGroup>
                {matrices.map((matrix) => {
                  const isSelected = selectedIds.includes(String(matrix.id));

                  return (
                    <CommandItem
                      key={matrix.id}
                      value={`${matrix.label} ${matrix.id}`}
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

          {selectedMatrices.length > 0 && allowEmpty && (
            <div className="flex items-center justify-between border-t border-surface-3 p-2">
              <span className="text-[10px] text-text-tertiary">
                {selectedMatrices.length}{" "}
                {selectedMatrices.length === 1 ? t("matrix") : t("matrices")}{" "}
                {t("selected")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-2"
                onClick={handleClearAll}
              >
                {t("clearAll")}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {selectedMatrices.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedMatrices.map((matrix) => (
            <div
              key={matrix.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent border border-accent/20"
            >
              <span className="truncate max-w-[150px]">{matrix.label}</span>
              <button
                type="button"
                onClick={(e) => handleRemoveItem(String(matrix.id), e)}
                className="hover:bg-accent/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">{t("remove")}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
