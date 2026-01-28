import {Input} from '@/components/ui/input';
import {FormField} from './FormField';

type NumberInputFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helperText?: string;
};

export function NumberInputField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  helperText,
}: NumberInputFieldProps) {
  return (
    <FormField id={id} label={label} helperText={helperText}>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className="h-9 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
      />
    </FormField>
  );
}
