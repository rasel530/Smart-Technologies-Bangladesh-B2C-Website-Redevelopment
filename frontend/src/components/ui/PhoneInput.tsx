import React, { useState, useEffect } from 'react';
import { Phone, Eye, EyeOff } from 'lucide-react';
import { validateBangladeshPhone, getOperatorColor, formatPhoneNumber, formatPhoneInput } from '@/lib/phoneValidation';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  errorBn?: string;
  label?: string;
  labelBn?: string;
  placeholder?: string;
  placeholderBn?: string;
  required?: boolean;
  disabled?: boolean;
  language?: 'en' | 'bn';
  className?: string;
  showValidation?: boolean;
  showOperatorInfo?: boolean;
  allowInternationalToggle?: boolean;
  onValidationChange?: (validation: any) => void;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onBlur,
  error,
  errorBn,
  label,
  labelBn,
  placeholder = '+8801XXXXXXXXX',
  placeholderBn = '+8801XXXXXXXXX',
  required = false,
  disabled = false,
  language = 'en',
  className,
  showValidation = true,
  showOperatorInfo = true,
  allowInternationalToggle = true,
  onValidationChange
}) => {
  const [focused, setFocused] = useState(false);
  const [format, setFormat] = useState<'international' | 'local'>('local');
  const [validation, setValidation] = useState(() => validateBangladeshPhone(value));
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Update validation when value changes (with debouncing)
  useEffect(() => {
    const timer = setTimeout(() => {
      const newValidation = validateBangladeshPhone(debouncedValue);
      setValidation(newValidation);
      onValidationChange?.(newValidation);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [debouncedValue]);

  // Sync debounced value with prop
  useEffect(() => {
    setDebouncedValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = formatPhoneInput(e.target.value);
    setDebouncedValue(newValue);
    onChange(newValue);
  };

  const handleInputFocus = () => {
    setFocused(true);
  };

  const handleInputBlur = () => {
    setFocused(false);
    if (onBlur) onBlur();
  };

  const handleFormatToggle = () => {
    const newFormat = format === 'international' ? 'local' : 'international';
    setFormat(newFormat);
    
    // Convert current value to new format
    if (validation.isValid && validation.normalizedPhone) {
      const convertedValue = format === 'international' 
        ? validation.normalizedPhone.substring(3) // Remove +880
        : `+880${validation.normalizedPhone.substring(3)}`; // Add +880
      onChange(convertedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only digits, backspace, delete, and + for international format
    const allowedChars = format === 'international' 
      ? '0123456789+'
      : '0123456789';

    if (!allowedChars.includes(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
      e.preventDefault();
    }
  };

  const displayLabel = language === 'bn' && labelBn ? labelBn : label;
  const displayError = language === 'bn' && errorBn ? errorBn : error;
  const displayPlaceholder = language === 'bn' && placeholderBn ? placeholderBn : placeholder;

  const formatDisplayValue = (phone: string) => {
    if (!phone) return '';
    
    return formatPhoneNumber(phone, 'display');
  };

  const getOperatorLogo = (operator?: string) => {
    const logos: Record<string, string> = {
      'Grameenphone': '/assets/operators/grameenphone.png',
      'Robi': '/assets/operators/robi.png',
      'Banglalink': '/assets/operators/banglalink.png',
      'Airtel': '/assets/operators/airtel.png',
      'Teletalk': '/assets/operators/teletalk.png'
    };
    
    return operator ? logos[operator] : null;
  };

  const getValidationMessage = () => {
    if (!validation.isValid && validation.error) {
      return (
        <div className="text-sm text-red-600 mt-1" role="alert">
          {displayError}
        </div>
      );
    }

    if (validation.isValid && showValidation) {
      return (
        <div className="mt-2 space-y-1">
          {validation.type === 'mobile' && validation.operator && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <span className="font-medium">
                ✓ {language === 'bn' ? 'বৈধ বাংলাদেশ ফোন নম্বর' : 'Valid Bangladesh mobile number'}
              </span>
              <span className={cn('font-medium', getOperatorColor(validation.operator))}>
                ({validation.operator})
              </span>
              {showOperatorInfo && (
                <div className="flex items-center space-x-1">
                  <img 
                    src={getOperatorLogo(validation.operator)} 
                    alt={validation.operator}
                    className="w-4 h-4 mr-2"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                  <div className="text-xs text-secondary-500">
                    <div>{validation.network}</div>
                    <div className="font-medium">{validation.operator}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {validation.type === 'landline' && validation.areaInfo && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <span className="font-medium">
                ✓ {language === 'bn' ? 'বৈধ বাংলাদেশ ল্যান্ডলাইন নম্বর' : 'Valid Bangladesh landline number'}
              </span>
              <span className="text-blue-600">
                ({validation.areaInfo.area})
              </span>
            </div>
          )}

          <div className="text-xs text-secondary-500">
            {language === 'bn' ? 'ধরন:' : 'Type:'}{' '}
            <span className="font-medium">
              {validation.type === 'mobile' 
                ? (language === 'bn' ? 'মোবাইল' : 'Mobile')
                : (language === 'bn' ? 'ল্যান্ডলাইন' : 'Landline')
              }
            </span>
          </div>

          {validation.format && (
            <div className="text-xs text-secondary-500">
              {language === 'bn' ? 'ফরম্যাট:' : 'Format:'}{' '}
              <span className="font-medium">
                {validation.format === 'international' 
                  ? (language === 'bn' ? 'আন্তর্জাতিক' : 'International')
                  : (language === 'bn' ? 'স্থানীয়' : 'Local')
                }
              </span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-1">
      {displayLabel && (
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {displayLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Phone 
            className={cn(
              'h-4 w-4',
              validation.isValid ? 'text-green-500' : 'text-gray-400',
              focused && 'ring-2 ring-primary-500',
              disabled && 'bg-gray-50'
            )} 
          />
        </div>

        <input
          type="tel"
          value={formatDisplayValue(debouncedValue)}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={displayPlaceholder}
          disabled={disabled}
          className={cn(
            'w-full pl-10 pr-10 px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200',
            {
              'border-red-300 focus:ring-red-500': displayError,
              'border-green-300 focus:ring-green-500': validation.isValid && focused,
              'bg-gray-50': disabled
            },
            className
          )}
          aria-label={displayLabel}
          aria-describedby={displayError ? 'phone-error' : showValidation ? 'phone-validation' : undefined}
          aria-invalid={!!displayError}
          aria-required={required}
          inputMode="tel"
          autoComplete="tel"
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {value && (
            <div className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center',
              validation.isValid ? 'bg-green-100' : 'bg-red-100'
            )}>
              <div className={cn(
                'w-3 h-3 rounded-full',
                validation.isValid ? 'bg-green-500' : 'bg-red-500'
              )} />
            </div>
          )}
        </div>

        {displayError && (
          <p id="phone-error" className="text-sm text-red-600 mt-1" role="alert">
            {displayError}
          </p>
        )}

        {getValidationMessage()}
      </div>

      {/* Format Toggle */}
      {allowInternationalToggle && validation.isValid && (
        <div className="mt-3 flex items-center space-x-2">
          <span className="text-sm text-secondary-600">
            {language === 'bn' ? 'ফরম্যাট:' : 'Format:'}{' '}
          </span>
          <button
            type="button"
            onClick={handleFormatToggle}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200',
              format === 'international' 
                ? 'bg-primary-600 text-white hover:bg-primary-700' 
                : 'bg-secondary-200 text-secondary-800 hover:bg-secondary-300'
            )}
          >
            {format === 'international' 
              ? (language === 'bn' ? 'স্থানীয়' : 'Local')
              : (language === 'bn' ? 'আন্তর্জাতিক' : 'International')
            }
          </button>
        </div>
      )}

      {/* Format Guide */}
      {showValidation && value && (
        <div className="mt-3 p-3 bg-secondary-50 rounded-md border border-secondary-200">
          <p className="text-xs font-medium text-secondary-700 mb-2">
            {language === 'bn' ? 'সমর্তিত ফরম্যাট:' : 'Accepted formats:'}
          </p>
          <ul className="text-xs text-secondary-600 space-y-1">
            <li>• +8801XXXXXXXXX</li>
            <li>• +88013XXXXXXX</li>
            <li>• +88014XXXXXXX</li>
            <li>• +88015XXXXXXX</li>
            <li>• +88016XXXXXXX</li>
            <li>• +88017XXXXXXX</li>
            <li>• +88018XXXXXXX</li>
            <li>• +88019XXXXXXX</li>
            <li>• 01XXXXXXXXX</li>
          </ul>
          
          {validation.operator && validation.type === 'mobile' && (
            <div className="mt-2 pt-2 border-t border-secondary-200">
              <p className="text-xs font-medium text-secondary-700 mb-2">
                {language === 'bn' ? 'অপারেটর:' : 'Operator:'}{' '}
              </p>
              <div className="flex items-center space-x-2">
                <img 
                  src={getOperatorLogo(validation.operator)} 
                  alt={validation.operator}
                  className="w-6 h-6 mr-2"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
                <div>
                  <div className="text-sm font-medium text-secondary-900">{validation.operator}</div>
                  <div className="text-xs text-secondary-500">{validation.network}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { PhoneInput };