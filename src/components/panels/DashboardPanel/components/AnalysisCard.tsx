import type {ReactNode} from "react";
import {CheckCircle, XCircle} from "lucide-react";

type AnalysisCardProps = {
  title: string;
  icon: ReactNode;
  iconColor: string;
  successRate: number;
  successColor: string;
  resolved: number;
  unresolved: number;
  distance: number;
};

export function AnalysisCard({
  title,
  icon,
  iconColor,
  successRate,
  successColor,
  resolved,
  unresolved,
  distance,
}: AnalysisCardProps) {
  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
        <span className={iconColor}>{icon}</span>
        {title}
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">Success Rate</span>
          <span className={`text-lg font-bold ${successColor}`}>
            {successRate.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-surface-3 rounded-full h-2">
          <div
            className={`${successColor.replace('text-', 'bg-')} h-2 rounded-full transition-all`}
            style={{width: `${successRate}%`}}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="text-center p-2 rounded bg-green-500/10">
            <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className="text-xs text-text-tertiary">Resolved</p>
            <p className="text-sm font-bold text-text-primary">{resolved}</p>
          </div>
          <div className="text-center p-2 rounded bg-red-500/10">
            <XCircle className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <p className="text-xs text-text-tertiary">Unresolved</p>
            <p className="text-sm font-bold text-text-primary">{unresolved}</p>
          </div>
        </div>
        <div className="pt-2 border-t border-surface-3">
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Distance</span>
            <span className="text-text-primary font-mono">
              {distance.toFixed(2)} km
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
