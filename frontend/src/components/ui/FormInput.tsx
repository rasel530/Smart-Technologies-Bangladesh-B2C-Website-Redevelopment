import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  label?: string;
  labelBn?: string;
  error?: string;
  errorBn?: string;
  helperText?: string;
  helperTextBn?: string;
  required?: boolean;
  language?: 'en' | 'bn';
  value?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      className,
      type = 'text',
      label,
      labelBn,
      error,
      errorBn,
      helperText,
      helperTextBn,
      required = false,
      language = 'en',
      id,
      ...props
    },
    ref
  ) => {
    const displayLabel = language === 'bn' && labelBn ? labelBn : label;
    const displayError = language === 'bn' && errorBn ? errorBn : error;
    const displayHelper = language === 'bn' && helperTextBn ? helperTextBn : helperText;

    return (
      <div className="space-y-1">
        {displayLabel && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-secondary-700 mb-1"
          >
            {displayLabel}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          id={id}
          className={cn(
            'w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200',
            {
              'border-red-300 focus:ring-red-500': displayError,
              'bg-gray-50': props.disabled,
            },
            className
          )}
          ref={ref}
          aria-describedby={displayError ? `${id}-error` : displayHelper ? `${id}-helper` : undefined}
          aria-invalid={!!displayError}
          aria-required={required}
          {...props}
        />
        {displayError && (
          <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
            {displayError}
          </p>
        )}
        {displayHelper && !displayError && (
          <p id={`${id}-helper`} className="text-sm text-secondary-500">
            {displayHelper}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export { FormInput };