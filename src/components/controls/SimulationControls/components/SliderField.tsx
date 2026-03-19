import {FormField} from './FormField';

type SliderFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  helperText?: string;
};

export function SliderField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  unit = '%',
  helperText,
}: SliderFieldProps) {
  return (
    <FormField id={id} label={label} helperText={helperText}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-accent"
        />
        <span className="w-12 text-right text-xs font-medium text-text-primary">
          {value}{unit}
        </span>
      </div>
    </FormField>
  );
}
