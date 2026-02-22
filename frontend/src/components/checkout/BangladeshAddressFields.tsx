'use client';

import React from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  divisions,
  getDistrictsByDivision,
  getUpazilasByDistrict,
  getDivisionById,
  getDistrictById,
  getUpazilaById,
} from '@/data/bangladesh-data';
import type { AddressType } from '@/hooks/useAddressManagement';

interface BangladeshAddressFieldsProps {
  /** Selected division ID */
  division: string;
  
  /** Selected district ID */
  district: string;
  
  /** Selected upazila ID (optional) */
  upazila: string;
  
  /** Callback when division changes */
  onDivisionChange: (divisionId: string) => void;
  
  /** Callback when district changes */
  onDistrictChange: (districtId: string) => void;
  
  /** Callback when upazila changes */
  onUpazilaChange: (upazilaId: string) => void;
  
  /** Validation errors */
  errors?: Record<string, string>;
  
  /** Validation errors in Bangla */
  errorsBn?: Record<string, string>;
  
  /** Current language preference */
  language: 'en' | 'bn';
  
  /** CSS class for custom styling */
  className?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Show upazila field (optional) */
  showUpazila?: boolean;
  
  /** Address type for context */
  addressType?: AddressType;
}

/**
 * BangladeshAddressFields Component
 *
 * Provides Bangladesh-specific address fields with cascading dropdowns.
 * Features:
 * - Division dropdown (8 divisions)
 * - District dropdown (filtered by selected division, 64 districts)
 * - Upazila dropdown (optional, filtered by selected district)
 * - Real-time validation feedback
 * - Bilingual support (English/Bangla)
 * - Mobile-responsive layout
 * - Touch-friendly controls (min 44px tap targets)
 *
 * @example
 * ```tsx
 * <BangladeshAddressFields
 *   division={formData.division}
 *   district={formData.district}
 *   upazila={formData.upazila}
 *   onDivisionChange={handleDivisionChange}
 *   onDistrictChange={handleDistrictChange}
 *   onUpazilaChange={handleUpazilaChange}
 *   errors={errors}
 *   language="en"
 * />
 * ```
 */
export const BangladeshAddressFields: React.FC<BangladeshAddressFieldsProps> = ({
  division,
  district,
  upazila,
  onDivisionChange,
  onDistrictChange,
  onUpazilaChange,
  errors = {},
  errorsBn = {},
  language,
  className = '',
  disabled = false,
  showUpazila = true,
  addressType,
}) => {
  // Get available options based on selections
  const districts = division ? getDistrictsByDivision(division) : [];
  const upazilas = district ? getUpazilasByDistrict(district) : [];

  // Get selected values for display
  const selectedDivision = getDivisionById(division);
  const selectedDistrict = getDistrictById(district);
  const selectedUpazila = getUpazilaById(upazila);

  // Helper to get error message
  const getError = (field: string): string | undefined => {
    return errors[field] || errorsBn[field];
  };

  const hasError = (field: string): boolean => !!getError(field);

  return (
    <div className={cn('bangladesh-address-fields space-y-4', className)}>
      {/* Division Field */}
      <div>
        <label
          htmlFor="division"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {language === 'en' ? 'Division' : 'বিভাগ'}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          id="division"
          value={division}
          onChange={(e) => onDivisionChange(e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'min-h-[44px]', // Touch-friendly
            hasError('division')
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-invalid={hasError('division')}
          aria-describedby={hasError('division') ? 'division-error' : undefined}
        >
          <option value="">
            {language === 'en' ? 'Select Division' : 'বিভাগ নির্বাচন করুন'}
          </option>
          {divisions.map((div) => (
            <option key={div.id} value={div.id}>
              {language === 'bn' ? div.nameBn : div.name}
            </option>
          ))}
        </select>
        {hasError('division') && (
          <p
            id="division-error"
            className="mt-1 text-sm text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{getError('division')}</span>
          </p>
        )}
      </div>

      {/* District Field */}
      <div>
        <label
          htmlFor="district"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {language === 'en' ? 'District' : 'জেলা'}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          id="district"
          value={district}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={disabled || !division}
          className={cn(
            'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'min-h-[44px]', // Touch-friendly
            hasError('district')
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-invalid={hasError('district')}
          aria-describedby={hasError('district') ? 'district-error' : undefined}
        >
          <option value="">
            {language === 'en' ? 'Select District' : 'জেলা নির্বাচন করুন'}
          </option>
          {districts.map((dist) => (
            <option key={dist.id} value={dist.id}>
              {language === 'bn' ? dist.nameBn : dist.name}
            </option>
          ))}
        </select>
        {hasError('district') && (
          <p
            id="district-error"
            className="mt-1 text-sm text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{getError('district')}</span>
          </p>
        )}
      </div>

      {/* Upazila Field (Optional) */}
      {showUpazila && (
        <div>
          <label
            htmlFor="upazila"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {language === 'en' ? 'Upazila (Optional)' : 'উপজেলা (ঐচ্ছিক)'}
          </label>
          <select
            id="upazila"
            value={upazila}
            onChange={(e) => onUpazilaChange(e.target.value)}
            disabled={disabled || !district}
            className={cn(
              'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'min-h-[44px]', // Touch-friendly
              hasError('upazila')
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-invalid={hasError('upazila')}
            aria-describedby={hasError('upazila') ? 'upazila-error' : undefined}
          >
            <option value="">
              {language === 'en' ? 'Select Upazila (Optional)' : 'উপজেলা নির্বাচন করুন (ঐচ্ছিক)'}
            </option>
            {upazilas.map((upa) => (
              <option key={upa.id} value={upa.id}>
                {language === 'bn' ? upa.nameBn : upa.name}
              </option>
            ))}
          </select>
          {hasError('upazila') && (
            <p
              id="upazila-error"
              className="mt-1 text-sm text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{getError('upazila')}</span>
            </p>
          )}
        </div>
      )}

      {/* Address Summary (when all fields are selected) */}
      {selectedDivision && selectedDistrict && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">
                {language === 'en' ? 'Selected Location:' : 'নির্বাচিত অবস্থান:'}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {selectedUpazila && (
                  <>
                    {language === 'bn' ? selectedUpazila.nameBn : selectedUpazila.name},{' '}
                  </>
                )}
                {language === 'bn' ? selectedDistrict.nameBn : selectedDistrict.name},{' '}
                {language === 'bn' ? selectedDivision.nameBn : selectedDivision.name}
              </p>
              {addressType && (
                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  {language === 'en' ? `Address Type: ${addressType}` : `ঠিকানার ধরন: ${addressType}`}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BangladeshAddressFields;
