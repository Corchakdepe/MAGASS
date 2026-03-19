"use client";

import * as React from "react";
import {Download, Maximize2, Settings} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChartToolbarProps {
  onExport?: () => void;
  onFullscreen?: () => void;
  onSettings?: () => void;
}

export function ChartToolbar({
  onExport,
  onFullscreen,
  onSettings,
}: ChartToolbarProps) {
  return (
    <div className="flex items-center gap-1">
      {onExport && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
      {onFullscreen && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onFullscreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}
      {onSettings && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Chart Settings</h4>
              {/* Add settings here */}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
