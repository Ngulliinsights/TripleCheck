import React from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'textarea' | 'select' | 'file';
  value?: any;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | undefined;
  touched?: boolean | undefined;
  options?: Array<{ value: string; label: string }>;
  accept?: string; // for file inputs
  multiple?: boolean; // for file inputs
  rows?: number; // for textarea
  min?: number; // for number inputs
  max?: number; // for number inputs
  step?: number; // for number inputs
  helpText?: string; // for additional help text
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  className?: string;
  'aria-describedby'?: string | undefined;
  'aria-invalid'?: boolean;
}

export function FormField({
  name,
  label,
  type = 'text',
  value = '',
  placeholder,
  required = false,
  disabled = false,
  error,
  touched = false,
  options = [],
  accept,
  multiple = false,
  rows = 4,
  onChange,
  onBlur,
  className,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: FormFieldProps) {
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const hasError = touched && !!error;

  const commonProps = {
    id: fieldId,
    name,
    value: type === 'file' ? undefined : value,
    placeholder,
    required,
    disabled,
    onChange,
    onBlur,
    'aria-invalid': ariaInvalid ?? hasError,
    'aria-describedby': ariaDescribedBy ?? (hasError ? errorId : undefined),
    className: cn(
      hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
      className
    ),
    ...props
  };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={rows}
          />
        );

      case 'select':
        return (
          <select
            {...commonProps}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
          >
            {!required && <option value="">Select an option</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'file':
        return (
          <Input
            {...commonProps}
            type="file"
            accept={accept}
            multiple={multiple}
            value={undefined} // File inputs don't use value prop
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type={type}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
        {label}
      </Label>
      
      {renderInput()}
      
      {hasError && (
        <p
          id={errorId}
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;