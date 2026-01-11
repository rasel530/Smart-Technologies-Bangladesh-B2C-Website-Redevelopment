'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Save, X, Check } from 'lucide-react';
import { Address, CreateAddressRequest, AddressAPI } from '@/lib/api/profile';
import { useAuth } from '@/contexts/AuthContext';
import { BangladeshAddress } from '@/components/ui/BangladeshAddress';
import { getDivisionById, getDistrictById, getUpazilaById, getDivisionIdByName, getDistrictIdByName, getUpazilaIdByName } from '@/data/bangladesh-data';

interface AddressFormProps {
  address?: Address;
  onSubmit: (address: Address) => void;
  onCancel: () => void;
  language: 'en' | 'bn';
}

const AddressForm: React.FC<AddressFormProps> = ({
  address,
  onSubmit,
  onCancel,
  language,
}) => {
  const { user } = useAuth();
  const isEditMode = !!address;

  const [formData, setFormData] = useState<CreateAddressRequest>({
    type: 'SHIPPING',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    addressLine2: '',
    city: '',
    district: '',
    division: '',
    upazila: '',
    postalCode: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorsBn, setErrorsBn] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (address) {
      // Backend stores:
      // - division: NAME (uppercase, e.g., "DHAKA")
      // - district: ID (e.g., "301")
      // - upazila: ID (e.g., "30101")
      
      // Get division name for display (from database)
      const divisionName = address.division || '';
      // Convert division NAME to ID for Select component
      const divisionId = getDivisionIdByName(divisionName) || '';
      
      console.log('[AddressForm] ===== ADDRESS LOAD DEBUG =====');
      console.log('[AddressForm] Raw address data:', address);
      console.log('[AddressForm] Division name from DB:', divisionName);
      console.log('[AddressForm] Converted division ID:', divisionId);
      console.log('[AddressForm] District ID from DB:', address.district);
      console.log('[AddressForm] Upazila ID from DB:', address.upazila);
      console.log('[AddressForm] Setting form data:', {
        division: divisionId,
        district: address.district,
        upazila: address.upazila
      });

      setFormData({
        type: address.type,
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone || '',
        address: address.address,
        addressLine2: address.addressLine2 || '',
        city: address.city,
        district: address.district, // Already an ID from backend
        division: divisionId, // Use ID for Select component
        upazila: address.upazila || '', // Already an ID from backend
        postalCode: address.postalCode || '',
        isDefault: address.isDefault,
      });
    }
  }, [address]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newErrorsBn: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = language === 'en' ? 'First name is required' : 'প্রথম নাম প্রয়োজনীয়';
      newErrorsBn.firstName = 'প্রথম নাম প্রয়োজনীয়';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = language === 'en' ? 'Last name is required' : 'শেষ নাম প্রয়োজনীয়';
      newErrorsBn.lastName = 'শেষ নাম প্রয়োজনীয়';
    }

    if (!formData.address.trim()) {
      newErrors.address = language === 'en' ? 'Address is required' : 'ঠিকানা প্রয়োজনীয়';
      newErrorsBn.address = 'ঠিকানা প্রয়োজনীয়';
    }

    if (!formData.city.trim()) {
      newErrors.city = language === 'en' ? 'City is required' : 'শহর প্রয়োজনীয়';
      newErrorsBn.city = 'শহর প্রয়োজনীয়';
    }

    if (!formData.division) {
      newErrors.division = language === 'en' ? 'Division is required' : 'বিভাগ প্রয়োজনীয়';
      newErrorsBn.division = 'বিভাগ প্রয়োজনীয়';
    }

    if (!formData.district) {
      newErrors.district = language === 'en' ? 'District is required' : 'জেলা প্রয়োজনীয়';
      newErrorsBn.district = 'জেলা প্রয়োজনীয়';
    }

    if (!formData.upazila) {
      newErrors.upazila = language === 'en' ? 'Upazila is required' : 'উপজেলা প্রয়োজনীয়';
      newErrorsBn.upazila = 'উপজেলা প্রয়োজনীয়';
    }

    setErrors(newErrors);
    setErrorsBn(newErrorsBn);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if user is authenticated
    if (!user || !user.id) {
      const errorMessage = language === 'en' 
        ? 'You must be logged in to save addresses' 
        : 'ঠিকানা সংরক্ষণ করতে লগইন করতে হবে';
      setErrors({ submit: errorMessage });
      setErrorsBn({ submit: errorMessage });
      return;
    }

    setIsLoading(true);
    setErrors({});
    setErrorsBn({});
    setSuccess(false);

    try {
      // Get userId from authenticated user object
      const userId = user.id;
      
      console.log('[AddressForm] User ID from useAuth():', userId);
      console.log('[AddressForm] Form data before submission:', formData);
      
      // Convert division ID to uppercase name for backend validation
      const divisionId = formData.division;
      const divisionName = getDivisionById(divisionId)?.name.toUpperCase() || '';
      
      const formDataWithDivisionName = {
        ...formData,
        division: divisionName
      };
      
      console.log('[AddressForm] Division ID:', divisionId, '-> Division Name:', divisionName);
      console.log('[AddressForm] Form data after division conversion:', formDataWithDivisionName);
      
      let response;
      if (isEditMode && address) {
        response = await AddressAPI.updateAddress(userId, address.id, formDataWithDivisionName);
      } else {
        response = await AddressAPI.createAddress(userId, formDataWithDivisionName);
      }

      onSubmit(response.address);
      setSuccess(true);
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 
        (language === 'en' ? 'Failed to save address' : 'ঠিকানা সংরক্ষণ করতে ব্যর্থ হয়েছে');
      setErrors({ submit: errorMessage });
      setErrorsBn({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name] || errorsBn[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
      setErrorsBn(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDivisionChange = (divisionId: string) => {
    setFormData(prev => ({
      ...prev,
      division: divisionId,
      district: '',
      upazila: '',
    }));
    setErrors(prev => ({ ...prev, division: '', district: '', upazila: '' }));
    setErrorsBn(prev => ({ ...prev, division: '', district: '', upazila: '' }));
  };

  const handleDistrictChange = (districtId: string) => {
    setFormData(prev => ({
      ...prev,
      district: districtId,
      upazila: '',
    }));
    setErrors(prev => ({ ...prev, district: '', upazila: '' }));
    setErrorsBn(prev => ({ ...prev, district: '', upazila: '' }));
  };

  const handleUpazilaChange = (upazilaId: string) => {
    setFormData(prev => ({
      ...prev,
      upazila: upazilaId,
    }));
    setErrors(prev => ({ ...prev, upazila: '' }));
    setErrorsBn(prev => ({ ...prev, upazila: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {isEditMode
            ? (language === 'en' ? 'Edit Address' : 'ঠিকানা সম্পাদনা')
            : (language === 'en' ? 'Add New Address' : 'নতুন ঠিকানা যোগ করুন')}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
          <Check className="h-5 w-5 text-green-600 mr-2" />
          <p className="text-sm text-green-800">
            {isEditMode
              ? (language === 'en' ? 'Address updated successfully!' : 'ঠিকানা সফলভাবে আপডেট হয়েছে!')
              : (language === 'en' ? 'Address added successfully!' : 'ঠিকানা সফলভাবে যোগ হয়েছে!')}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Address Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Address Type' : 'ঠিকানার ধরন'}
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="SHIPPING">
              {language === 'en' ? 'Shipping Address' : 'শিপিং ঠিকানা'}
            </option>
            <option value="BILLING">
              {language === 'en' ? 'Billing Address' : 'বিলিং ঠিকানা'}
            </option>
          </select>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'First Name' : 'প্রথম নাম'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              minLength={2}
              maxLength={50}
              className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.firstName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder={language === 'en' ? 'Enter first name' : 'প্রথম নাম লিখুন'}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Last Name' : 'শেষ নাম'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              minLength={2}
              maxLength={50}
              className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.lastName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder={language === 'en' ? 'Enter last name' : 'শেষ নাম লিখুন'}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Phone Number' : 'ফোন নম্বর'}
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            pattern="^(\+880|01)(1[3-9]\d{8}|\d{9})$"
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={language === 'en' ? '+8801XXXXXXXXX' : '+8801XXXXXXXXX'}
          />
          <p className="mt-1 text-xs text-gray-500">
            {language === 'en' ? 'Format: +8801XXXXXXXXX or 01XXXXXXXXX' : 'ফরম্যাট: +8801XXXXXXXXX বা 01XXXXXXXXX'}
          </p>
        </div>

        {/* Address Lines */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Address' : 'ঠিকানা'}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            maxLength={200}
            className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.address ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder={language === 'en' ? 'Street address, house number' : 'রাস্তা, বাড়ি নম্বর'}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Address Line 2 (Optional)' : 'ঠিকানা লাইন ২ (ঐচ্ছিক)'}
          </label>
          <input
            type="text"
            name="addressLine2"
            value={formData.addressLine2}
            onChange={handleInputChange}
            maxLength={200}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={language === 'en' ? 'Apartment, suite, unit, etc.' : 'অ্যাপার্টমেন্ট, স্যুট, ইউনিট, ইত্যাদি'}
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'City' : 'শহর'}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            required
            maxLength={100}
            className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.city ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder={language === 'en' ? 'Enter city name' : 'শহরের নাম লিখুন'}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
          )}
        </div>

        {/* Bangladesh Address Selection */}
        <BangladeshAddress
          division={formData.division}
          district={formData.district}
          upazila={formData.upazila}
          onDivisionChange={handleDivisionChange}
          onDistrictChange={handleDistrictChange}
          onUpazilaChange={handleUpazilaChange}
          errors={errors}
          errorsBn={errorsBn}
          language={language}
        />

        {/* Postal Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Postal Code' : 'পোস্টাল কোড'}
          </label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleInputChange}
            maxLength={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={language === 'en' ? 'Enter postal code' : 'পোস্টাল কোড লিখুন'}
          />
        </div>

        {/* Set as Default */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isDefault"
            id="isDefault"
            checked={formData.isDefault}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, isDefault: e.target.checked }));
            }}
            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="isDefault" className="ml-2 text-sm font-medium text-gray-700">
            {language === 'en' ? 'Set as default address' : 'ডিফল্ট ঠিকানা হিসেবে সেট করুন'}
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          {isEditMode && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {language === 'en' ? 'Cancel' : 'বাতিল'}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>
                  {isEditMode
                    ? (language === 'en' ? 'Updating...' : 'আপডেট হচ্ছে...')
                    : (language === 'en' ? 'Adding...' : 'যোগ করা হচ্ছে...')}
                </span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>
                  {isEditMode
                    ? (language === 'en' ? 'Update Address' : 'ঠিকানা আপডেট করুন')
                    : (language === 'en' ? 'Add Address' : 'ঠিকানা যোগ করুন')}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;
