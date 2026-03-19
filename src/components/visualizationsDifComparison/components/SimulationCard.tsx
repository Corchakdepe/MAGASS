// src/components/visualizations/directory-subtraction/components/SimulationCard.tsx
import React from "react";
import { MapPin, CheckCircle2, Gauge, Footprints, Timer, BarChart3 } from "lucide-react";
import { Simulation } from "../types/types";
import { extractParams, formatDate } from "../hooks/utils";

interface Props {
  sim: Simulation;
  isSelected: boolean;
  onSelect: () => void;
}

export default function SimulationCard({ sim, isSelected, onSelect }: Props) {
  const params = extractParams(sim.name);
  const date   = formatDate(sim.timestamp);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
        hover:bg-surface-2 group
        ${isSelected ? "bg-accent/5" : ""}
      `}
    >
      {/* City badge */}
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold
        ${isSelected ? "bg-accent text-white" : "bg-surface-3 text-text-secondary"}
      `}>
        {sim.city.substring(0, 2).toUpperCase()}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-text-primary truncate">
            {sim.display_name.split("(")[0].trim()}
          </span>
          {isSelected && <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />}
        </div>
        {/* Param pills */}
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[10px] text-text-tertiary font-code flex items-center gap-0.5">
            <Gauge className="w-2.5 h-2.5" />{params.stress}
          </span>
          <span className="text-[10px] text-text-tertiary font-code flex items-center gap-0.5">
            <Footprints className="w-2.5 h-2.5" />{params.walkCost}
          </span>
          <span className="text-[10px] text-text-tertiary font-code flex items-center gap-0.5">
            <Timer className="w-2.5 h-2.5" />Δ{params.delta}
          </span>
          <span className="text-[10px] text-text-tertiary font-code flex items-center gap-0.5">
            <BarChart3 className="w-2.5 h-2.5" />ST{params.stressType}
          </span>
        </div>
      </div>

      {/* Date */}
      <span className="text-[10px] text-text-tertiary shrink-0 hidden sm:block">{date}</span>
    </button>
  );
}
