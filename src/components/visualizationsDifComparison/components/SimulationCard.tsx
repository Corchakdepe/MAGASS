// src/components/visualizations/directory-subtraction/SimulationCard.tsx

import React from "react";
import {
  MapPin, CheckCircle2, Gauge, Footprints, Timer, BarChart3, Calendar, Clock,
} from "lucide-react";
import { Simulation } from "../types/types";
import { extractParams, formatDate } from "../hooks/utils";

interface Props {
  sim: Simulation;
  isSelected: boolean;
  onSelect: () => void;
}

export default function SimulationCard({ sim, isSelected, onSelect }: Props) {
  const params = extractParams(sim.name);
  const date = formatDate(sim.timestamp);

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
        isSelected
          ? "border-accent bg-accent-soft shadow-sm"
          : "border-surface-3 hover:border-accent/30 hover:bg-surface-0"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">{sim.city}</span>
          </div>
          <p className="text-xs text-text-secondary truncate">
            {sim.display_name.split("(")[0].trim()}
          </p>
        </div>
        {isSelected && <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs">
          <Gauge className="w-3.5 h-3.5 text-text-tertiary" />
          <div>
            <span className="text-text-secondary">Stress: </span>
            <span className="text-text-primary font-medium">{params.stress}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Footprints className="w-3.5 h-3.5 text-text-tertiary" />
          <div>
            <span className="text-text-secondary">Walk Cost: </span>
            <span className="text-text-primary font-medium">{params.walkCost}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Timer className="w-3.5 h-3.5 text-text-tertiary" />
          <div>
            <span className="text-text-secondary">Delta: </span>
            <span className="text-text-primary font-medium">{params.delta} min</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <BarChart3 className="w-3.5 h-3.5 text-text-tertiary" />
          <div>
            <span className="text-text-secondary">Type: </span>
            <span className="text-text-primary font-medium">ST{params.stressType}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-text-secondary border-t border-surface-3 pt-2">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono text-[10px]">{sim.name.substring(0, 15)}</span>
        </div>
      </div>
    </button>
  );
}
