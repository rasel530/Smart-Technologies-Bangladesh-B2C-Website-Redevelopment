'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddressTypeSelector } from './AddressTypeSelector';
import { BangladeshAddressFields } from './BangladeshAddressFields';
import { AddressValidationBadge, FieldValidationBadge } from './AddressValidationBadge';
import { useAddressManagement, type AddressType } from '@/hooks/useAddressManagement';
import { getDivisionIdByName } from '@/data/bangladesh-data';

interface AddressFormEnhancedProps {
  /** Initial address data for editing (optional) */
  initialAddress?: {
    type?: AddressType;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    division?: string;
    upazila?: string;
    postalCode?: string;
    isDefault?: boolean;
  };
  
  /** Callback when form is submitted successfully */
  onSubmit: (address: any) => void;
  
  /** Callback when form is cancelled */
  onCancel: () => void;
  
  /** Current language preference */
  language: 'en' | 'bn';
  
  /** CSS class for custom styling */
  className?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Available address types (optional, defaults to all) */
  availableTypes?: AddressType[];
  
  /** Show upazila field */
  showUpazila?: boolean;
}

/**
 * AddressFormEnhanced Component
 *
 * Enhanced address form with Bangladesh validation, real-time feedback, and address type selection.
 * Features:
 * - Address type selection (Shipping, Billing, Home, Work, Other)
 * - Bangladesh-specific address fields (Division, District, Upazila)
 * - Real-time validation with inline error messages
 * - Phone number validation (Bangladesh format)
 * - Postal code validation (4 digits)
 * - Save as default option
 * - Bilingual support (English/Bangla)
 * - Mobile-optimized layout with touch-friendly controls
 *
 * @example
 * ```tsx
 * <AddressFormEnhanced
 *   initialAddress={editingAddress}
 *   onSubmit={handleSaveAddress}
 *   onCancel={handleCancel}
 *   language="en"
 * />
 * ```
 */
export const AddressFormEnhanced: React.FC<AddressFormEnhancedProps> = ({
  initialAddress,
  onSubmit,
  onCancel,
  language,
  className = '',
  disabled = false,
  availableTypes,
  showUpazila = true,
}) => {
  const { validateAddress, validateField, getValidationRules } = useAddressManagement();
  const [formData, setFormData] = useState({
    type: initialAddress?.type || 'SHIPPING' as AddressType,
    firstName: initialAddress?.firstName || '',
    lastName: initialAddress?.lastName || '',
    phone: initialAddress?.phone || '',
    address: initialAddress?.address || '',
    addressLine2: initialAddress?.addressLine2 || '',
    city: initialAddress?.city || '',
    district: initialAddress?.district || '',
    division: initialAddress?.division || '',
    upazila: initialAddress?.upazila || '',
    postalCode: initialAddress?.postalCode || '',
    isDefault: initialAddress?.isDefault || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorsBn, setErrorsBn] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate form data
  const validateForm = (): boolean => {
    const validation = validateAddress(formData);
    setErrors(validation.errors);
    setErrorsBn(validation.errorsBn);
    return validation.isValid;
  };

  // Real-time field validation
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on change if it has been touched
    if (touched[field]) {
      const fieldError = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: fieldError || '' }));
      setErrorsBn(prev => ({ ...prev, [field]: fieldError || '' }));
    }
  };

  // Handle address type change
  const handleAddressTypeChange = (type: AddressType) => {
    setFormData(prev => ({ ...prev, type }));
    setTouched(prev => ({ ...prev, type: true }));
  };

  // Handle division change
  const handleDivisionChange = (divisionId: string) => {
    setFormData(prev => ({
      ...prev,
      division: divisionId,
      district: '',
      upazila: '',
    }));
    setTouched(prev => ({ ...prev, division: true, district: true, upazila: true }));
    setErrors(prev => ({ ...prev, division: '', district: '', upazila: '' }));
    setErrorsBn(prev => ({ ...prev, division: '', district: '', upazila: '' }));
  };

  // Handle district change
  const handleDistrictChange = (districtId: string) => {
    setFormData(prev => ({
      ...prev,
      district: districtId,
      upazila: '',
    }));
    setTouched(prev => ({ ...prev, district: true, upazila: true }));
    setErrors(prev => ({ ...prev, district: '', upazila: '' }));
    setErrorsBn(prev => ({ ...prev, district: '', upazila: '' }));
  };

  // Handle upazila change
  const handleUpazilaChange = (upazilaId: string) => {
    setFormData(prev => ({ ...prev, upazila: upazilaId }));
    setTouched(prev => ({ ...prev, upazila: true }));
    setErrors(prev => ({ ...prev, upazila: '' }));
    setErrorsBn(prev => ({ ...prev, upazila: '' }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setErrorsBn({});

    try {
      // Convert division ID to uppercase name for backend
      const divisionId = formData.division;
      const divisionName = divisionId ? getDivisionIdByName(divisionId) : '';
      
      const formDataWithDivisionName = {
        ...formData,
        division: divisionName,
      };

      await onSubmit(formDataWithDivisionName);
      setSuccess(true);
      
      // Auto-close after success
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err?.message || 
        (language === 'en' ? 'Failed to save address' : 'ঠিকানা সংরক্ষণ করতে ব্যর্থ হয়েছে');
      setErrors({ submit: errorMessage });
      setErrorsBn({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get validation rules for hints
  const validationRules = getValidationRules();

  return (
    <div className={cn('address-form-enhanced space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'en' ? 'Address Details' : 'ঠিকানার বিবরণী'}
        </h2>
        <button
          onClick={onCancel}
          disabled={disabled || isSubmitting}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          aria-label={language === 'en' ? 'Close' : 'বন্ধ করুন'}
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
          <Check className="h-5 w-5 text-green-600 mr-2" />
          <p className="text-sm text-green-800">
            {language === 'en' ? 'Address saved successfully!' : 'ঠিকানা সফলভাবে সংরক্ষণ হয়েছে!'}
          </p>
        </div>
      )}

      {/* Submit error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Address Type Selector */}
        <AddressTypeSelector
          selectedType={formData.type}
          onSelect={handleAddressTypeChange}
          language={language}
          availableTypes={availableTypes}
          disabled={disabled || isSubmitting}
          showValidationHints={true}
        />

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {language === 'en' ? 'First Name' : 'প্রথম নাম'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
              disabled={disabled || isSubmitting}
              className={cn(
                'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'min-h-[44px]', // Touch-friendly
                errors.firstName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              placeholder={language === 'en' ? 'Enter first name' : 'প্রথম নাম লিখুন'}
              minLength={2}
              maxLength={50}
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
            {errors.firstName && (
              <p id="firstName-error" className="mt-1 text-sm text-red-600">
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {language === 'en' ? 'Last Name' : 'শেষ নাম'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
              disabled={disabled || isSubmitting}
              className={cn(
                'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'min-h-[44px]', // Touch-friendly
                errors.lastName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              placeholder={language === 'en' ? 'Enter last name' : 'শেষ নাম লিখুন'}
              minLength={2}
              maxLength={50}
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <p id="lastName-error" className="mt-1 text-sm text-red-600">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {language === 'en' ? 'Phone Number' : 'ফোন নম্বর'}
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
            disabled={disabled || isSubmitting}
            className={cn(
              'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'min-h-[44px]', // Touch-friendly
              errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-gray-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            placeholder={language === 'en' ? '+8801XXXXXXXXX' : '+8801XXXXXXXXX'}
            pattern={validationRules.phone.pattern.source}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-sm text-red-600">
              {errors.phone}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {language === 'en' ? 'Format: +8801XXXXXXXXX or 01XXXXXXXXX' : 'ফরম্যাট: +8801XXXXXXXXX বা 01XXXXXXXXX'}
          </p>
        </div>

        {/* Address Line 1 */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {language === 'en' ? 'Address' : 'ঠিকানা'}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, address: true }))}
            disabled={disabled || isSubmitting}
            className={cn(
              'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'min-h-[44px]', // Touch-friendly
              errors.address ? 'border-red-300 focus:ring-red-500' : 'border-gray-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            placeholder={language === 'en' ? 'Street address, house number' : 'রাস্তা, বাড়ি নম্বর'}
            minLength={3}
            maxLength={100}
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? 'address-error' : undefined}
          />
          {errors.address && (
            <p id="address-error" className="mt-1 text-sm text-red-600">
              {errors.address}
            </p>
          )}
        </div>

        {/* Address Line 2 */}
        <div>
          <label
            htmlFor="addressLine2"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {language === 'en' ? 'Address Line 2 (Optional)' : 'ঠিকানা লাইন ২ (ঐচ্ছিক)'}
          </label>
          <input
            id="addressLine2"
            type="text"
            value={formData.addressLine2}
            onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, addressLine2: true }))}
            disabled={disabled || isSubmitting}
            className={cn(
              'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'min-h-[44px]', // Touch-friendly
              errors.addressLine2 ? 'border-red-300 focus:ring-red-500' : 'border-gray-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            placeholder={language === 'en' ? 'Apartment, suite, unit, etc.' : 'অ্যাপার্টমেন্ট, স্যুট, ইউনিট, ইত্যাদি'}
            maxLength={100}
            aria-invalid={!!errors.addressLine2}
            aria-describedby={errors.addressLine2 ? 'addressLine2-error' : undefined}
          />
          {errors.addressLine2 && (
            <p id="addressLine2-error" className="mt-1 text-sm text-red-600">
              {errors.addressLine2}
            </p>
          )}
        </div>

        {/* City */}
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {language === 'en' ? 'City' : 'শহর'}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, city: true }))}
            disabled={disabled || isSubmitting}
            className={cn(
              'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'min-h-[44px]', // Touch-friendly
              errors.city ? 'border-red-300 focus:ring-red-500' : 'border-gray-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            placeholder={language === 'en' ? 'Enter city name' : 'শহরের নাম লিখুন'}
            maxLength={100}
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? 'city-error' : undefined}
          />
          {errors.city && (
            <p id="city-error" className="mt-1 text-sm text-red-600">
              {errors.city}
            </p>
          )}
        </div>

        {/* Bangladesh Address Fields */}
        <BangladeshAddressFields
          division={formData.division}
          district={formData.district}
          upazila={formData.upazila}
          onDivisionChange={handleDivisionChange}
          onDistrictChange={handleDistrictChange}
          onUpazilaChange={handleUpazilaChange}
          errors={errors}
          errorsBn={errorsBn}
          language={language}
          disabled={disabled || isSubmitting}
          showUpazila={showUpazila}
          addressType={formData.type}
        />

        {/* Postal Code */}
        <div>
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {language === 'en' ? 'Postal Code' : 'পোস্টাল কোড'}
          </label>
          <input
            id="postalCode"
            type="text"
            value={formData.postalCode}
            onChange={(e) => handleFieldChange('postalCode', e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, postalCode: true }))}
            disabled={disabled || isSubmitting}
            className={cn(
              'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'min-h-[44px]', // Touch-friendly
              errors.postalCode ? 'border-red-300 focus:ring-red-500' : 'border-gray-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            placeholder={language === 'en' ? 'Enter postal code' : 'পোস্টাল কোড লিখুন'}
            pattern={validationRules.postalCode.pattern.source}
            maxLength={4}
            aria-invalid={!!errors.postalCode}
            aria-describedby={errors.postalCode ? 'postalCode-error' : undefined}
          />
          {errors.postalCode && (
            <p id="postalCode-error" className="mt-1 text-sm text-red-600">
              {errors.postalCode}
            </p>
          )}
        </div>

        {/* Set as Default */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            checked={formData.isDefault}
            onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
            disabled={disabled || isSubmitting}
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0"
          />
          <label
            htmlFor="isDefault"
            className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
          >
            {language === 'en' ? 'Set as default address' : 'ডিফল্ট ঠিকানা হিসেবে সেট করুন'}
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled || isSubmitting}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === 'en' ? 'Cancel' : 'বাতিল'}
          </button>
          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>
                  {language === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...'}
                </span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>
                  {language === 'en' ? 'Save Address' : 'ঠিকানা সংরক্ষণ করুন'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddressFormEnhanced;
