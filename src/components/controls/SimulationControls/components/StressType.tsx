import { cn } from "@/lib/utils";
import type { StressTypeValue } from "../types/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StressTypeProps {
  stressType: StressTypeValue;
  setStressType: (v: StressTypeValue) => void;
  compact?: boolean;
}

const options: Array<{ value: StressTypeValue; label: string }> = [
  { value: 0, label: "No stress" },
  { value: 1, label: "Stress Bikes" },
  { value: 2, label: "Stress Walk" },
  { value: 3, label: "Stress boss" }
];

export default function StressType({ stressType, setStressType, compact = false }: StressTypeProps) {
  const handleChange = (value: string) => {
    const numValue = parseInt(value, 10) as StressTypeValue;
    setStressType(numValue);
  };

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <label className={cn(
        "font-medium",
        compact ? "text-xs text-text-secondary" : "text-sm text-text-secondary"
      )}>
        Stress Type
      </label>
      <Select value={stressType.toString()} onValueChange={handleChange}>
        <SelectTrigger className={cn(
          "w-full",
          compact ? "h-8 text-xs" : "h-9 text-sm"
        )}>
          <SelectValue placeholder="Select stress type" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value.toString()}
              className={compact ? "text-xs" : "text-sm"}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}