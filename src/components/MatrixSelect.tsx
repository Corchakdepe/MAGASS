"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useLanguage } from "@/contexts/LanguageContext";

export type MatrixOption = {
  label: string;
  id: number;
};

export type MatrixSelectProps = {
  matrices: MatrixOption[];
  seleccionAgreg: string; // store selected id as string
  setSeleccionAgreg: (value: string) => void;
};

export function MatrixSelect({ matrices, seleccionAgreg, setSeleccionAgreg }: MatrixSelectProps) {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => matrices.find((m) => String(m.id) === seleccionAgreg) ?? null,
    [matrices, seleccionAgreg],
  );

  return (
    <div className="space-y-1 min-w-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={[
              "w-full justify-between h-9 px-2 text-xs",
              "bg-surface-1 border border-surface-3",
              "text-text-primary",
              "hover:bg-surface-0",
              "focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30",
            ].join(" ")}
          >
            <span className={selected ? "truncate" : "truncate text-text-secondary"}>
              {selected ? selected.label : t('selectMatrix')}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-text-tertiary" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[320px] max-w-[90vw] p-0 bg-surface-1 border border-surface-3 shadow-mac-panel">
          <Command>
            <CommandInput placeholder={t('searchMatrix')} className="text-xs" />
            <CommandEmpty>{t('noResults')}</CommandEmpty>

            <CommandGroup>
              {/* Optional "clear" row */}
              <CommandItem
                value="__clear__"
                onSelect={() => {
                  setSeleccionAgreg("");
                  setOpen(false);
                }}
                className="text-xs text-text-secondary"
              >
                {t('removeSelection')}
              </CommandItem>

              {matrices.map((m) => {
                const isSelected = String(m.id) === seleccionAgreg;

                return (
                  <CommandItem
                    key={m.id}
                    value={m.label}
                    onSelect={() => {
                      setSeleccionAgreg(String(m.id));
                      setOpen(false);
                    }}
                    className="text-xs"
                  >
                    <span className="truncate">{m.label}</span>
                    <Check
                      className={[
                        "ml-auto h-4 w-4",
                        isSelected ? "opacity-100 text-accent" : "opacity-0",
                      ].join(" ")}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Small helper text (optional) */}
      <div className="text-[10px] text-text-tertiary">
        {t('value')}: <code className="font-mono">{seleccionAgreg || "—"}</code>
      </div>
    </div>
  );
}
