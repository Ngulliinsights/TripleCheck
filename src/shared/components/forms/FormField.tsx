import React from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { cn } from '../../utils/cn'

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'textarea' | 'select';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  disabled = false,
  className,
  inputClassName,
  labelClassName,
  errorClassName,
  helpText,
  options,
  rows = 4,
  min,
  max,
  step,
  autoComplete,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}) => {
  const hasError = touched && error;
  const isValid = touched && !error && value;
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  const baseInputClasses = cn(
    'transition-colors duration-200',
    hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
    isValid && 'border-green-500 focus:border-green-500 focus:ring-green-500',
    disabled && 'opacity-50 cursor-not-allowed',
    inputClassName
  );

  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      name,
      value: value || '',
      onChange,
      onBlur,
      disabled,
      required,
      placeholder,
      className: baseInputClasses,
      'aria-invalid': ariaInvalid || hasError,
      'aria-describedby': cn(
        ariaDescribedBy,
        hasError && errorId,
        helpText && helpId
      ).trim() || undefined,
      autoComplete,
    };

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
              baseInputClasses
            )}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            min={min}
            max={max}
            step={step}
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
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={fieldId}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          hasError && 'text-red-600',
          isValid && 'text-green-600',
          labelClassName
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative">
        {renderInput()}
        
        {/* Validation icons */}
        {(hasError || isValid) && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {hasError && (
              <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
            )}
            {isValid && (
              <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
            )}
          </div>
        )}
      </div>

      {/* Help text */}
      {helpText && !hasError && (
        <p
          id={helpId}
          className="text-xs text-muted-foreground"
        >
          {helpText}
        </p>
      )}

      {/* Error message */}
      {hasError && (
        <p
          id={errorId}
          className={cn(
            'text-xs text-red-600 flex items-center gap-1',
            errorClassName
          )}
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;