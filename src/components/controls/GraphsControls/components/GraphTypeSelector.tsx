"use client";

import * as React from "react";
import {X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Badge} from "@/components/ui/badge";
import {Label} from "@/components/ui/label";
import {Checkbox} from "@/components/ui/checkbox";
import {useLanguage} from "@/contexts/LanguageContext";
import type {GraphOption, GraphKey} from "../types/graphControls";

interface GraphTypeSelectorProps {
  options: readonly GraphOption[];
  selected: GraphKey[];
  onChange: (selected: GraphKey[]) => void;
}

export function GraphTypeSelector({options, selected, onChange}: GraphTypeSelectorProps) {
  const {t} = useLanguage();
  const [open, setOpen] = React.useState(false);

  const toggleGraph = (graphKey: GraphKey) => {
    const checked = selected.includes(graphKey);
    if (checked) {
      onChange(selected.filter((k) => k !== graphKey));
    } else {
      onChange([...selected, graphKey]);
    }
  };

  const removeGraph = (graphKey: GraphKey, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((k) => k !== graphKey));
  };

  return (
    <div className="space-y-2">
      <Label className="text-[11px] text-text-secondary">{t('selection')}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9 w-full justify-between px-2 text-xs bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
          >
            <span className="truncate text-left">
              {selected.length === 0
                ? t('selectGraphs')
                : `${selected.length} ${t('selected')}`}
            </span>
            <span className="ml-2 text-text-tertiary">▾</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[340px] max-w-[90vw] p-3 bg-surface-1 border border-surface-3 shadow-mac-panel">
          <div className="space-y-2">
            {/* Options list */}
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {options.map((g) => {
                const checked = selected.includes(g.key);
                return (
                  <div
                    key={g.key}
                    className="flex items-center gap-2 p-2 rounded hover:bg-surface-0/70 transition-colors"
                    onClick={() => toggleGraph(g.key)}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleGraph(g.key)}
                    />
                    <span className="text-xs text-text-primary cursor-pointer flex-1">
                      {g.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {options.filter((g) => selected.includes(g.key)).map((g) => (
            <Badge
              key={g.key}
              variant="secondary"
              className="bg-surface-0 text-text-primary border border-surface-3 flex items-center gap-1 cursor-pointer hover:bg-surface-0/70 transition-colors"
              onClick={(e) => removeGraph(g.key, e)}
            >
              <span>{g.label}</span>
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
