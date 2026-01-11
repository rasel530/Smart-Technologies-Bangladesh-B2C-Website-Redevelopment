'use client';

import React from 'react';
import { MapPin, Edit, Trash2, Star } from 'lucide-react';
import { Address } from '@/lib/api/profile';
import { getDivisionById, getDistrictById, getUpazilaById } from '@/data/bangladesh-data';

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  language: 'en' | 'bn';
  isEditing?: boolean;
  isDeleting?: boolean;
  isSettingDefault?: boolean;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  language,
  isEditing = false,
  isDeleting = false,
  isSettingDefault = false,
}) => {
  const division = getDivisionById(address.division);
  const district = getDistrictById(address.district);
  const upazila = address.upazila ? getUpazilaById(address.upazila) : null;

  const handleDelete = () => {
    if (window.confirm(
      language === 'en'
        ? 'Are you sure you want to delete this address?'
        : 'আপনি কি এই ঠিকানা মুছে ফেলতে চান?'
    )) {
      onDelete(address.id);
    }
  };

  const handleSetDefault = () => {
    onSetDefault(address.id);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      {/* Header with type and default badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            address.type === 'SHIPPING'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          }`}>
            {address.type === 'SHIPPING'
              ? (language === 'en' ? 'Shipping' : 'শিপিং')
              : (language === 'en' ? 'Billing' : 'বিলিং')}
          </span>
          {address.isDefault && (
            <span className="flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
              <Star className="h-3 w-3 fill-current" />
              <span>{language === 'en' ? 'Default' : 'ডিফল্ট'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Address Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start space-x-2">
          <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {address.firstName} {address.lastName}
            </p>
            {address.phone && (
              <p className="text-sm text-gray-600 mt-1">
                {address.phone}
              </p>
            )}
            <p className="text-sm text-gray-700 mt-1">
              {address.address}
            </p>
            {address.addressLine2 && (
              <p className="text-sm text-gray-700">
                {address.addressLine2}
              </p>
            )}
            <p className="text-sm text-gray-700">
              {address.city}
            </p>
            <p className="text-sm text-gray-700">
              {upazila && (language === 'bn' ? upazila.nameBn : upazila.name)},{' '}
              {district && (language === 'bn' ? district.nameBn : district.name)},{' '}
              {division && (language === 'bn' ? division.nameBn : division.name)}
            </p>
            {address.postalCode && (
              <p className="text-sm text-gray-600">
                {language === 'en' ? 'Postal Code' : 'পোস্টাল কোড'}: {address.postalCode}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
        {!address.isDefault && (
          <button
            onClick={handleSetDefault}
            disabled={isSettingDefault}
            className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={language === 'en' ? 'Set as default address' : 'ডিফল্ট ঠিকানা হিসেবে সেট করুন'}
          >
            <Star className="h-4 w-4" />
            <span>
              {isSettingDefault
                ? (language === 'en' ? 'Setting...' : 'সেট করা হচ্ছে...')
                : (language === 'en' ? 'Set Default' : 'ডিফল্ট সেট করুন')}
            </span>
          </button>
        )}
        <button
          onClick={() => onEdit(address)}
          disabled={isEditing || isDeleting || isSettingDefault}
          className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={language === 'en' ? 'Edit address' : 'ঠিকানা সম্পাদনা করুন'}
        >
          <Edit className="h-4 w-4" />
          <span>
            {isEditing
              ? (language === 'en' ? 'Editing...' : 'সম্পাদনা হচ্ছে...')
              : (language === 'en' ? 'Edit' : 'সম্পাদনা')}
          </span>
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting || isEditing || isSettingDefault}
          className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={language === 'en' ? 'Delete address' : 'ঠিকানা মুছে ফেলুন'}
        >
          <Trash2 className="h-4 w-4" />
          <span>
            {isDeleting
              ? (language === 'en' ? 'Deleting...' : 'মুছে ফেলা হচ্ছে...')
              : (language === 'en' ? 'Delete' : 'মুছে ফেলুন')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default AddressCard;
