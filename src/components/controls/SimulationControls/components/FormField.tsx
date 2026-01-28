import {Label} from '@/components/ui/label';
import type {ReactNode} from 'react';

type FormFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  helperText?: string;
};

export function FormField({id, label, children, helperText}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] text-text-secondary">
        {label}
      </Label>
      {children}
      {helperText && (
        <p className="text-[10px] text-text-tertiary">{helperText}</p>
      )}
    </div>
  );
}
