type ProgressBarProps = {
  label: string;
  value: number;
  percentage: number;
  gradient: string;
};

export function ProgressBar({label, value, percentage, gradient}: ProgressBarProps) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-mono">{value.toFixed(2)} km</span>
      </div>
      <div className="w-full bg-surface-3 rounded-full h-3">
        <div
          className={`${gradient} h-3 rounded-full transition-all`}
          style={{width: `${percentage.toFixed(1)}%`}}
        />
      </div>
    </div>
  );
}
