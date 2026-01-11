import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
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
  // Debug: Log divisions data
  console.log('BangladeshAddress - divisions:', divisions);
  console.log('BangladeshAddress - divisions.length:', divisions.length);
  
  // Add key to force re-render when division changes
  const divisionKey = division || 'empty';
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [availableUpazilas, setAvailableUpazilas] = useState<Upazila[]>([]);
  
  // Use refs to track programmatic updates to prevent infinite loops
  const isProgrammaticUpdateRef = useRef(false);
  // Track initial props to only clear values when they actually change (not during initial render)
  const initialPropsRef = useRef({ division, district, upazila });

  const handleDivisionChange = useCallback((newDivision: string) => {
    isProgrammaticUpdateRef.current = true;
    onDivisionChange(newDivision);
    setTimeout(() => {
      isProgrammaticUpdateRef.current = false;
    }, 0);
  }, [onDivisionChange]);

  const handleDistrictChange = useCallback((newDistrict: string) => {
    isProgrammaticUpdateRef.current = true;
    onDistrictChange(newDistrict);
    setTimeout(() => {
      isProgrammaticUpdateRef.current = false;
    }, 0);
  }, [onDistrictChange]);

  const handleUpazilaChange = useCallback((newUpazila: string) => {
    isProgrammaticUpdateRef.current = true;
    onUpazilaChange(newUpazila);
    setTimeout(() => {
      isProgrammaticUpdateRef.current = false;
    }, 0);
  }, [onUpazilaChange]);

  useEffect(() => {
    if (division) {
      const districts = getDistrictsByDivision(division);
      setAvailableDistricts(districts);
      
      // Reset district and upazila when division changes (but not during initial render)
      // Only clear if this is a programmatic update AND district is not in available districts
      // AND the initial props had a district that is now invalid
      if (district && !districts.find(d => d.id === district) && !isProgrammaticUpdateRef.current && initialPropsRef.current.division !== division) {
        console.log('[BangladeshAddress] Clearing district/upazila - district not found in available districts');
        console.log('[BangladeshAddress] Initial division:', initialPropsRef.current.division, 'Current division:', division);
        handleDistrictChange('');
        handleUpazilaChange('');
      }
    } else {
      setAvailableDistricts([]);
      setAvailableUpazilas([]);
      // Only clear district/upazila if not initial render
      // Only clear if this is a programmatic update AND initial props had a division
      if (!isProgrammaticUpdateRef.current && initialPropsRef.current.division !== division) {
        console.log('[BangladeshAddress] Clearing district/upazila - division is empty');
        console.log('[BangladeshAddress] Initial division:', initialPropsRef.current.division, 'Current division:', division);
        handleDistrictChange('');
        handleUpazilaChange('');
      }
    }
  }, [division, district]);

  useEffect(() => {
    if (district) {
      const upazilas = getUpazilasByDistrict(district);
      setAvailableUpazilas(upazilas);
      
      // Reset upazila when district changes (but not during initial render)
      // Only clear if this is a programmatic update AND upazila is not in available upazilas
      // AND the initial props had an upazila that is now invalid
      if (upazila && !upazilas.find(u => u.id === upazila) && !isProgrammaticUpdateRef.current && initialPropsRef.current.district !== district) {
        console.log('[BangladeshAddress] Clearing upazila - upazila not found in available upazilas');
        console.log('[BangladeshAddress] Initial district:', initialPropsRef.current.district, 'Current district:', district);
        handleUpazilaChange('');
      }
    } else {
      setAvailableUpazilas([]);
      // Only clear upazila if not initial render
      // Only clear if this is a programmatic update AND initial props had a district
      if (!isProgrammaticUpdateRef.current && initialPropsRef.current.district !== district) {
        console.log('[BangladeshAddress] Clearing upazila - district is empty');
        console.log('[BangladeshAddress] Initial district:', initialPropsRef.current.district, 'Current district:', district);
        handleUpazilaChange('');
      }
    }
  }, [district, upazila]);

  // Update initial props ref when props change
  useEffect(() => {
    initialPropsRef.current = { division, district, upazila };
    console.log('[BangladeshAddress] Initial props updated:', initialPropsRef.current);
  }, [division, district, upazila]);

  const selectedDivision = getDivisionById(division);
  const selectedDistrict = getDistrictById(district);
  const selectedUpazila = getUpazilaById(upazila);

  // Debug logging
  console.log('[BangladeshAddress] === SELECT VALUE DEBUG ===');
  console.log('[BangladeshAddress] Division prop:', division, '(Type:', typeof division, ')');
  console.log('[BangladeshAddress] District prop:', district, '(Type:', typeof district, ')');
  console.log('[BangladeshAddress] Upazila prop:', upazila, '(Type:', typeof upazila, ')');
  console.log('[BangladeshAddress] Selected division:', selectedDivision);
  console.log('[BangladeshAddress] Selected district:', selectedDistrict);
  console.log('[BangladeshAddress] Selected upazila:', selectedUpazila);
  console.log('[BangladeshAddress] ======================================');

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
          onValueChange={handleDivisionChange}
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
            <Select.Content position="popper" sideOffset={5} className="max-h-60 overflow-auto bg-white border border-secondary-200 rounded-md shadow-lg z-50">
              <Select.ScrollUpButton className="flex items-center justify-center h-6 cursor-default">
                <ChevronDown className="h-4 w-4 rotate-180" />
              </Select.ScrollUpButton>
              <Select.Viewport className="p-1">
                {divisions.map((div) => (
                  <Select.Item
                    key={div.id}
                    value={div.id}
                    className="px-3 py-2 text-sm hover:bg-primary-50 focus:bg-primary-50 cursor-pointer rounded-md flex items-center justify-between outline-none data-[state=checked]:bg-primary-100 data-[state=checked]:text-primary-700"
                  >
                    <Select.ItemText>
                      {language === 'bn' ? div.nameBn : div.name}
                    </Select.ItemText>
                    <Select.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
              <Select.ScrollDownButton className="flex items-center justify-center h-6 cursor-default">
                <ChevronDown className="h-4 w-4" />
              </Select.ScrollDownButton>
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
          onValueChange={handleDistrictChange}
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
            <Select.Content position="popper" sideOffset={5} className="max-h-60 overflow-auto bg-white border border-secondary-200 rounded-md shadow-lg z-50">
              <Select.ScrollUpButton className="flex items-center justify-center h-6 cursor-default">
                <ChevronDown className="h-4 w-4 rotate-180" />
              </Select.ScrollUpButton>
              <Select.Viewport className="p-1">
                {availableDistricts.map((dist) => (
                  <Select.Item
                    key={dist.id}
                    value={dist.id}
                    className="px-3 py-2 text-sm hover:bg-primary-50 focus:bg-primary-50 cursor-pointer rounded-md flex items-center justify-between outline-none data-[state=checked]:bg-primary-100 data-[state=checked]:text-primary-700"
                  >
                    <Select.ItemText>
                      {language === 'bn' ? dist.nameBn : dist.name}
                    </Select.ItemText>
                    <Select.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
              <Select.ScrollDownButton className="flex items-center justify-center h-6 cursor-default">
                <ChevronDown className="h-4 w-4" />
              </Select.ScrollDownButton>
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
          onValueChange={handleUpazilaChange}
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
            <Select.Content position="popper" sideOffset={5} className="max-h-60 overflow-auto bg-white border border-secondary-200 rounded-md shadow-lg z-50">
              <Select.ScrollUpButton className="flex items-center justify-center h-6 cursor-default">
                <ChevronDown className="h-4 w-4 rotate-180" />
              </Select.ScrollUpButton>
              <Select.Viewport className="p-1">
                {availableUpazilas.map((upz) => (
                  <Select.Item
                    key={upz.id}
                    value={upz.id}
                    className="px-3 py-2 text-sm hover:bg-primary-50 focus:bg-primary-50 cursor-pointer rounded-md flex items-center justify-between outline-none data-[state=checked]:bg-primary-100 data-[state=checked]:text-primary-700"
                  >
                    <Select.ItemText>
                      {language === 'bn' ? upz.nameBn : upz.name}
                    </Select.ItemText>
                    <Select.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
              <Select.ScrollDownButton className="flex items-center justify-center h-6 cursor-default">
                <ChevronDown className="h-4 w-4" />
              </Select.ScrollDownButton>
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
