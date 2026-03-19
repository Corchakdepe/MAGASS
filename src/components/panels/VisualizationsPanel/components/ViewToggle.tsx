"use client";

import * as React from "react";
import {BarChart3, Map} from "lucide-react";
import {cn} from "@/lib/utils";
import type {VisualizationType} from "../types/visualizations";

interface ViewToggleProps {
  activeView: VisualizationType;
  onViewChange: (view: VisualizationType) => void;
}

export function ViewToggle({activeView, onViewChange}: ViewToggleProps) {
  const views: {id: VisualizationType; label: string; icon: typeof BarChart3}[] =
    [
      {id: "graphs", label: "Graphs", icon: BarChart3},
      {id: "maps", label: "Maps", icon: Map},
    ];

  return (
    <div className="flex gap-1 p-1 bg-surface-0 rounded-lg border border-surface-3">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              isActive
                ? "bg-accent text-white"
                : "text-text-secondary hover:bg-surface-1"
            )}
          >
            <Icon className="h-4 w-4" />
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
