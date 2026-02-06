import type {ReactNode} from "react";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
  subtext?: string;
  color?: string;
};

export function MetricCard({
  label,
  value,
  icon,
  subtext,
  color = "rgba(0,122,255,1)",
}: MetricCardProps) {
  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-4 hover:border-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={color}>{icon}</div>
      </div>
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-bold text-text-primary mb-1">{value}</p>
      {subtext && <p className="text-xs text-text-tertiary">{subtext}</p>}
    </div>
  );
}
