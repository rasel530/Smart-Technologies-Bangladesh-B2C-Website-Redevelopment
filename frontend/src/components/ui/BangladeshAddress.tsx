import React, { useEffect, useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { 
  divisions, 
  districts, 
  upazilas, 
  getDistrictsByDivision, 
  getUpazilasByDistrict,
  getDivisionById,
  getDistrictById,
  getUpazilaById,
  Division,
  District,
  Upazila
} from '@/data/bangladesh-data';
import { cn } from '@/lib/utils';

interface BangladeshAddressProps {
  division: string;
  district: string;
  upazila: string;
  onDivisionChange: (divisionId: string) => void;
  onDistrictChange: (districtId: string) => void;
  onUpazilaChange: (upazilaId: string) => void;
  errors?: {
    division?: string;
    district?: string;
    upazila?: string;
  };
  errorsBn?: {
    division?: string;
    district?: string;
    upazila?: string;
  };
  language?: 'en' | 'bn';
  className?: string;
  disabled?: boolean;
}

const BangladeshAddress: React.FC<BangladeshAddressProps> = ({
  division,
  district,
  upazila,
  onDivisionChange,
  onDistrictChange,
  onUpazilaChange,
  errors,
  errorsBn,
  language = 'en',
  className,
  disabled = false
}) => {
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [availableUpazilas, setAvailableUpazilas] = useState<Upazila[]>([]);

  useEffect(() => {
    if (division) {
      const districts = getDistrictsByDivision(division);
      setAvailableDistricts(districts);
      
      // Reset district and upazila when division changes
      if (district && !districts.find(d => d.id === district)) {
        onDistrictChange('');
        onUpazilaChange('');
      }
    } else {
      setAvailableDistricts([]);
      setAvailableUpazilas([]);
      onDistrictChange('');
      onUpazilaChange('');
    }
  }, [division, onDistrictChange, onUpazilaChange]);

  useEffect(() => {
    if (district) {
      const upazilas = getUpazilasByDistrict(district);
      setAvailableUpazilas(upazilas);
      
      // Reset upazila when district changes
      if (upazila && !upazilas.find(u => u.id === upazila)) {
        onUpazilaChange('');
      }
    } else {
      setAvailableUpazilas([]);
      onUpazilaChange('');
    }
  }, [district, onUpazilaChange]);

  const selectedDivision = getDivisionById(division);
  const selectedDistrict = getDistrictById(district);
  const selectedUpazila = getUpazilaById(upazila);

  const displayError = (field: 'division' | 'district' | 'upazila') => {
    if (language === 'bn' && errorsBn?.[field]) {
      return errorsBn[field];
    }
    return errors?.[field];
  };

  const getPlaceholder = (field: 'division' | 'district' | 'upazila') => {
    if (language === 'bn') {
      switch (field) {
        case 'division':
          return 'বিভাগ নির্বাচন করুন';
        case 'district':
          return 'জেলা নির্বাচন করুন';
        case 'upazila':
          return 'উপজেলা নির্বাচন করুন';
      }
    }
    
    switch (field) {
      case 'division':
        return 'Select division';
      case 'district':
        return 'Select district';
      case 'upazila':
        return 'Select upazila';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Division Select */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {language === 'bn' ? 'বিভাগ' : 'Division'}
          <span className="text-red-500 ml-1">*</span>
        </label>
        
        <Select.Root
          value={division}
          onValueChange={onDivisionChange}
          disabled={disabled}
          aria-label={language === 'bn' ? 'বিভাগ নির্বাচন করুন' : 'Select division'}
          aria-invalid={!!displayError('division')}
        >
          <Select.Trigger
            className={cn(
              'w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white',
              {
                'border-red-300 focus:ring-red-500': displayError('division'),
                'bg-gray-50': disabled,
              }
            )}
            aria-describedby={displayError('division') ? 'division-error' : undefined}
          >
            <Select.Value placeholder={getPlaceholder('division')} />
            <Select.Icon className="ml-2">
              <ChevronDown className="h-4 w-4" />
            </Select.Icon>
          </Select.Trigger>
          
          <Select.Portal>
            <Select.Content className="max-h-60 overflow-auto bg-white border border-secondary-200 rounded-md shadow-lg">
              <Select.Viewport className="p-1">
                <Select.Item value="" disabled className="text-secondary-500">
                  {getPlaceholder('division')}
                </Select.Item>
                {divisions.map((div) => (
                  <Select.Item
                    key={div.id}
                    value={div.id}
                    className="px-3 py-2 text-sm hover:bg-primary-50 focus:bg-primary-50 cursor-pointer rounded-md"
                  >
                    {language === 'bn' ? div.nameBn : div.name}
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
        
        {displayError('division') && (
          <p id="division-error" className="text-sm text-red-600 mt-1" role="alert">
            {displayError('division')}
          </p>
        )}
      </div>

      {/* District Select */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {language === 'bn' ? 'জেলা' : 'District'}
          <span className="text-red-500 ml-1">*</span>
        </label>
        
        <Select.Root
          value={district}
          onValueChange={onDistrictChange}
          disabled={disabled || !division}
          aria-label={language === 'bn' ? 'জেলা নির্বাচন করুন' : 'Select district'}
          aria-invalid={!!displayError('district')}
        >
          <Select.Trigger
            className={cn(
              'w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white',
              {
                'border-red-300 focus:ring-red-500': displayError('district'),
                'bg-gray-50': disabled || !division,
              }
            )}
            aria-describedby={displayError('district') ? 'district-error' : undefined}
          >
            <Select.Value placeholder={getPlaceholder('district')} />
            <Select.Icon className="ml-2">
              <ChevronDown className="h-4 w-4" />
            </Select.Icon>
          </Select.Trigger>
          
          <Select.Portal>
            <Select.Content className="max-h-60 overflow-auto bg-white border border-secondary-200 rounded-md shadow-lg">
              <Select.Viewport className="p-1">
                <Select.Item value="" disabled className="text-secondary-500">
                  {getPlaceholder('district')}
                </Select.Item>
                {availableDistricts.map((dist) => (
                  <Select.Item
                    key={dist.id}
                    value={dist.id}
                    className="px-3 py-2 text-sm hover:bg-primary-50 focus:bg-primary-50 cursor-pointer rounded-md"
                  >
                    {language === 'bn' ? dist.nameBn : dist.name}
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
        
        {displayError('district') && (
          <p id="district-error" className="text-sm text-red-600 mt-1" role="alert">
            {displayError('district')}
          </p>
        )}
      </div>

      {/* Upazila Select */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {language === 'bn' ? 'উপজেলা' : 'Upazila'}
          <span className="text-red-500 ml-1">*</span>
        </label>
        
        <Select.Root
          value={upazila}
          onValueChange={onUpazilaChange}
          disabled={disabled || !district}
          aria-label={language === 'bn' ? 'উপজেলা নির্বাচন করুন' : 'Select upazila'}
          aria-invalid={!!displayError('upazila')}
        >
          <Select.Trigger
            className={cn(
              'w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white',
              {
                'border-red-300 focus:ring-red-500': displayError('upazila'),
                'bg-gray-50': disabled || !district,
              }
            )}
            aria-describedby={displayError('upazila') ? 'upazila-error' : undefined}
          >
            <Select.Value placeholder={getPlaceholder('upazila')} />
            <Select.Icon className="ml-2">
              <ChevronDown className="h-4 w-4" />
            </Select.Icon>
          </Select.Trigger>
          
          <Select.Portal>
            <Select.Content className="max-h-60 overflow-auto bg-white border border-secondary-200 rounded-md shadow-lg">
              <Select.Viewport className="p-1">
                <Select.Item value="" disabled className="text-secondary-500">
                  {getPlaceholder('upazila')}
                </Select.Item>
                {availableUpazilas.map((upz) => (
                  <Select.Item
                    key={upz.id}
                    value={upz.id}
                    className="px-3 py-2 text-sm hover:bg-primary-50 focus:bg-primary-50 cursor-pointer rounded-md"
                  >
                    {language === 'bn' ? upz.nameBn : upz.name}
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
        
        {displayError('upazila') && (
          <p id="upazila-error" className="text-sm text-red-600 mt-1" role="alert">
            {displayError('upazila')}
          </p>
        )}
      </div>

      {/* Selected Address Display */}
      {division && district && upazila && (
        <div className="mt-4 p-3 bg-secondary-50 rounded-md border border-secondary-200">
          <p className="text-sm text-secondary-600">
            <span className="font-medium">
              {language === 'bn' ? 'নির্বাচিত ঠিকানা:' : 'Selected Address:'}
            </span>{' '}
            {selectedDivision && (language === 'bn' ? selectedDivision.nameBn : selectedDivision.name)},{' '}
            {selectedDistrict && (language === 'bn' ? selectedDistrict.nameBn : selectedDistrict.name)},{' '}
            {selectedUpazila && (language === 'bn' ? selectedUpazila.nameBn : selectedUpazila.name)}
          </p>
        </div>
      )}
    </div>
  );
};

export { BangladeshAddress };