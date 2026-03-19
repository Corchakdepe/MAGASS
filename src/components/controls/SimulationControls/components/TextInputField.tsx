import {Input} from '@/components/ui/input';
import {FormField} from './FormField';

type TextInputFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
};

export function TextInputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  helperText,
}: TextInputFieldProps) {
  return (
    <FormField id={id} label={label} helperText={helperText}>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
      />
    </FormField>
  );
}
