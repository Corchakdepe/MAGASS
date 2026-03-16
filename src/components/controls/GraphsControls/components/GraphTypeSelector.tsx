"use client";

import * as React from "react";
import {X} from "lucide-react";
import {cn} from "@/lib/utils";
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
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">
        {t('selection')}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-8 w-full justify-between px-2 text-xs bg-surface-1/50 border border-surface-3 hover:bg-surface-0 transition-colors focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
          >
            <span className="truncate text-left font-medium">
              {selected.length === 0
                ? t('selectGraphs')
                : `${selected.length} ${t('selected')}`}
            </span>
            <span className="ml-2 text-text-tertiary text-[10px]">▾</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[340px] max-w-[90vw] p-1.5 bg-surface-1/95 border border-surface-3 shadow-mac-panel backdrop-blur-md">
          <div className="space-y-1">
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {options.map((g) => {
                const checked = selected.includes(g.key);
                return (
                  <div
                    key={g.key}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent/10 transition-colors cursor-pointer group"
                    onClick={() => toggleGraph(g.key)}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleGraph(g.key)}
                      className="border-surface-3 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                    />
                    <span className={cn(
                      "text-xs transition-colors flex-1",
                      checked ? "text-accent font-medium" : "text-text-primary group-hover:text-text-primary"
                    )}>
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
        <div className="flex flex-wrap gap-1 pt-0.5">
          {options.filter((g) => selected.includes(g.key)).map((g) => (
            <Badge
              key={g.key}
              variant="secondary"
              className="bg-accent/10 text-accent hover:bg-accent/20 border-none px-1.5 py-0 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
              onClick={(e) => removeGraph(g.key, e)}
            >
              <span className="max-w-[120px] truncate">{g.label}</span>
              <X className="h-2.5 w-2.5 opacity-60 hover:opacity-100" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
