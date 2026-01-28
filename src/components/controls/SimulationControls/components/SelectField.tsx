import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {FormField} from './FormField';

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  helperText?: string;
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  helperText,
}: SelectFieldProps) {
  return (
    <FormField id={id} label={label} helperText={helperText}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="h-9 text-xs bg-surface-1 border border-surface-3 focus:ring-2 focus:ring-accent/25 focus:border-accent/30"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-surface-1 border border-surface-3 shadow-mac-panel">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
