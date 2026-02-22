'use client';

import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Validation status type
 */
export type ValidationStatus = 'valid' | 'warning' | 'error' | 'loading' | 'none';

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  messageBn: string;
}

interface AddressValidationBadgeProps {
  /** Current validation status */
  status: ValidationStatus;
  
  /** Validation errors to display */
  errors?: ValidationError[];
  
  /** Current language preference */
  language: 'en' | 'bn';
  
  /** CSS class for custom styling */
  className?: string;
  
  /** Show detailed error messages */
  showDetails?: boolean;
  
  /** Custom message to display */
  customMessage?: string;
  customMessageBn?: string;
  
  /** Compact mode (smaller size) */
  compact?: boolean;
}

/**
 * Status configuration with icons and colors
 */
const STATUS_CONFIG: Record<
  ValidationStatus,
  {
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
    borderColor: string;
    label: { en: string; bn: string };
  }
> = {
  valid: {
    icon: <CheckCircle className="h-5 w-5" />,
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    label: { en: 'Valid', bn: 'বৈধ' },
  },
  warning: {
    icon: <AlertCircle className="h-5 w-5" />,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    label: { en: 'Warning', bn: 'সতর্কতা' },
  },
  error: {
    icon: <XCircle className="h-5 w-5" />,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    label: { en: 'Invalid', bn: 'অবৈধ' },
  },
  loading: {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    label: { en: 'Validating...', bn: 'যাচাই করা হচ্ছে...' },
  },
  none: {
    icon: null,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    label: { en: 'Not validated', bn: 'যাচাই করা হয়নি' },
  },
};

/**
 * AddressValidationBadge Component
 *
 * Displays address validation status with visual feedback.
 * Features:
 * - Success/warning/error states with appropriate icons
 * - Bilingual support (English/Bangla)
 * - Mobile-friendly display
 * - Optional detailed error messages
 * - Compact mode for space-constrained layouts
 *
 * @example
 * ```tsx
 * <AddressValidationBadge
 *   status="valid"
 *   language="en"
 *   showDetails={true}
 * />
 * ```
 */
export const AddressValidationBadge: React.FC<AddressValidationBadgeProps> = ({
  status,
  errors = [],
  language,
  className = '',
  showDetails = false,
  customMessage,
  customMessageBn,
  compact = false,
}) => {
  const config = STATUS_CONFIG[status];
  const hasErrors = errors.length > 0;

  // Determine message to display
  const getMessage = (): string => {
    if (customMessage) return customMessage;
    if (customMessageBn && language === 'bn') return customMessageBn;
    
    if (status === 'error' && hasErrors) {
      return language === 'en'
        ? `${errors.length} error${errors.length > 1 ? 's' : ''} found`
        : `${errors.length}টি ত্রুটি পাওয়া গেছে`;
    }
    
    return config.label[language];
  };

  return (
    <div className={cn('address-validation-badge', className)}>
      {/* Compact mode */}
      {compact ? (
        <div className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
          config.bgColor,
          config.textColor,
          config.borderColor,
          'border'
        )}>
          {config.icon}
          <span>{getMessage()}</span>
        </div>
      ) : (
        /* Full mode */
        <div className={cn(
          'flex items-start gap-3 p-4 rounded-lg border',
          config.bgColor,
          config.borderColor
        )}>
          {/* Status icon */}
          <div className={cn(
            'flex-shrink-0',
            config.textColor
          )}>
            {config.icon}
          </div>
          
          {/* Status message */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-medium',
              config.textColor
            )}>
              {getMessage()}
            </p>
            
            {/* Detailed error messages */}
            {showDetails && hasErrors && (
              <ul className="mt-2 space-y-1">
                {errors.map((error, index) => (
                  <li
                    key={`${error.field}-${index}`}
                    className="text-sm opacity-90"
                  >
                    {language === 'en' ? error.message : error.messageBn}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * FieldValidationBadge Component
 *
 * Smaller badge for individual field validation.
 * Useful for inline validation feedback in forms.
 */
interface FieldValidationBadgeProps {
  /** Current validation status */
  status: 'valid' | 'error' | 'none';
  
  /** Error message to display */
  error?: string;
  errorBn?: string;
  
  /** Current language preference */
  language: 'en' | 'bn';
  
  /** CSS class for custom styling */
  className?: string;
}

export const FieldValidationBadge: React.FC<FieldValidationBadgeProps> = ({
  status,
  error,
  errorBn,
  language,
  className = '',
}) => {
  if (status === 'none') return null;

  const isError = status === 'error';
  const bgColor = isError ? 'bg-red-50' : 'bg-green-50';
  const textColor = isError ? 'text-red-800' : 'text-green-800';
  const borderColor = isError ? 'border-red-200' : 'border-green-200';
  const icon = isError ? (
    <XCircle className="h-4 w-4" />
  ) : (
    <CheckCircle className="h-4 w-4" />
  );

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium border',
      bgColor,
      textColor,
      borderColor,
      className
    )}>
      {icon}
      <span>
        {error && language === 'en' ? error : errorBn || error}
      </span>
    </div>
  );
};

export default AddressValidationBadge;
