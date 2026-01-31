'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, FileText, Upload, Check, AlertCircle } from 'lucide-react';
import { CorporateAPI } from '@/lib/api/corporate';
import { CorporateRegistrationData, CorporateStatus } from '@/types/corporate';
import { BangladeshAddress } from '@/components/ui/BangladeshAddress';
import { PhoneInput } from '@/components/ui/PhoneInput';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';

const CorporateRegistrationPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CorporateRegistrationData>({
    userId: '',
    companyName: '',
    companyRegistrationNumber: '',
    tinNumber: '',
    businessAddress: '',
    division: '',
    district: '',
    upazila: '',
    postalCode: '',
    authorizedPersonName: '',
    authorizedPersonEmail: '',
    authorizedPersonPhone: '',
    companyEmail: '',
    termsAccepted: false,
    documents: {},
  });

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/register/corporate');
    }
  }, [user, router]);

  // Set userId from authenticated user when component mounts
  useEffect(() => {
    if (user?.id) {
      setFormData(prev => ({ ...prev, userId: user.id }));
    }
  }, [user]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<{
    tradeLicense?: File;
    tinCertificate?: File;
    vatCertificate?: File;
  }>({});

  const steps = [
    { id: 0, title: 'Company Information', titleBn: 'কোম্পানি তথ্যসংক্রান্তি' },
    { id: 1, title: 'Address Details', titleBn: 'ঠিকানার বিবরণ' },
    { id: 2, title: 'Authorized Person', titleBn: 'অনুমতিকৃত ব্যক্তির বিবরণ' },
    { id: 3, title: 'Documents', titleBn: 'ডকুমেন্ট আপলোড করুন' },
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
   
    if (step === 0) {
      // Company Information validation
      if (formData.companyName.trim() === '') {
        newErrors.companyName = language === 'en' ? 'Company name is required' : 'কোম্পানির নাম প্রয়োজন';
        isValid = false;
      }
      if (formData.companyRegistrationNumber.trim() === '') {
        newErrors.companyRegistrationNumber = language === 'en' ? 'Company registration number is required' : 'কোম্পানি নিবন্ধন নম্বর প্রয়োজন';
        isValid = false;
      }
      if (formData.tinNumber && !/^\d{12}$/.test(formData.tinNumber)) {
        newErrors.tinNumber = language === 'en' ? 'Invalid TIN number' : 'অবৈধ টিআইএন নম্বর';
        isValid = false;
      }
    } else if (step === 1) {
      // Address validation
      if (formData.businessAddress.trim() === '') {
        newErrors.businessAddress = language === 'en' ? 'Business address is required' : 'ব্যবসায়ক ঠিকানা প্রয়োজন';
        isValid = false;
      }
      if ((formData.division ?? '') === '') {
        newErrors.division = language === 'en' ? 'Division is required' : 'বিভাগ নির্বাচন করুন';
        isValid = false;
      }
      if ((formData.district ?? '') === '') {
        newErrors.district = language === 'en' ? 'District is required' : 'জেলা নির্বাচন করুন';
        isValid = false;
      }
    } else if (step === 2) {
      // Authorized person validation
      if (formData.authorizedPersonName.trim() === '') {
        newErrors.authorizedPersonName = language === 'en' ? 'Authorized person name is required' : 'অনুমতিকৃত ব্যক্তির নাম প্রয়োজন';
        isValid = false;
      }
      if (formData.authorizedPersonEmail.trim() === '') {
        newErrors.authorizedPersonEmail = language === 'en' ? 'Email is required' : 'ইমেইল প্রয়োজন';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.authorizedPersonEmail)) {
        newErrors.authorizedPersonEmail = language === 'en' ? 'Invalid email format' : 'অবৈধ ইমেইল ফরম্যাট';
        isValid = false;
      }
      console.log('=== PHONE VALIDATION DEBUG ===');
      console.log('Raw phone value:', formData.authorizedPersonPhone);
      console.log('Trimmed phone value:', formData.authorizedPersonPhone.trim());
      console.log('Phone value length:', formData.authorizedPersonPhone.trim().length);
      console.log('Phone value with quotes:', JSON.stringify(formData.authorizedPersonPhone.trim()));
      
      if (formData.authorizedPersonPhone.trim() === '') {
        console.log('❌ Phone number is empty');
        newErrors.authorizedPersonPhone = language === 'en' ? 'Phone number is required' : 'ফোন নম্বর প্রয়োজন';
        isValid = false;
      } else {
        const phoneRegex = /^(\+880|0)?1[3-9]\d{8}$/;
        const regexTestResult = phoneRegex.test(formData.authorizedPersonPhone.replace(/\s/g, ''));
        console.log('Regex pattern:', phoneRegex.toString());
        console.log('Regex test result:', regexTestResult);
        console.log('Expected format examples: +8801712345678, 01712345678, 1712345678');
        
        if (!regexTestResult) {
          console.log('❌ Phone number validation FAILED');
          console.log('Possible issues:');
          console.log('  - Phone number contains spaces or special characters');
          console.log('  - Phone number has incorrect length');
          console.log('  - Phone number has invalid prefix (must be 013-019)');
          newErrors.authorizedPersonPhone = language === 'en' ? 'Invalid Bangladesh phone number' : 'অবৈধ বাংলাদেশ ফোন নম্বর';
          isValid = false;
        } else {
          console.log('✅ Phone number validation PASSED');
        }
      }
      console.log('=== END PHONE VALIDATION DEBUG ===');
      if (formData.companyEmail.trim() === '') {
        newErrors.companyEmail = language === 'en' ? 'Company email is required' : 'কোম্পানি ইমেইল প্রয়োজন';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
        newErrors.companyEmail = language === 'en' ? 'Invalid email format' : 'অবৈধ ইমেইল ফরম্যাট';
        isValid = false;
      }
    } else if (step === 3) {
      // Documents validation
      if (!documents.tradeLicense) {
        newErrors.tradeLicense = language === 'en' ? 'Trade license is required' : 'ট্রেড লাইসেন্স প্রয়োজন';
        isValid = false;
      }
      if (formData.termsAccepted === false) {
        newErrors.termsAccepted = language === 'en' ? 'You must accept terms and conditions' : 'আপনি শর্তাব ও শর্তগুলো গ্রহণ করতে হবেন';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep) === true) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateStep(currentStep) === false) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const submissionData: CorporateRegistrationData = {
        ...formData,
        documents,
      };

      const response = await CorporateAPI.register(submissionData);
      console.log('Registration successful:', response);
      
      setIsLoading(false);
      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/account/corporate/dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.message || (language === 'en' ? 'Registration failed. Please try again.' : 'নিবন্ধন ব্যর্থ হয়নি। আবার চেষ্টা করুন।'));
      setIsLoading(false);
    }
  };

  const handleFileChange = (field: 'tradeLicense' | 'tinCertificate' | 'vatCertificate', file: File | null) => {
    if (file !== null) {
      setDocuments(prev => ({ ...prev, [field]: file }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (success === true) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'en' ? 'Registration Successful!' : 'নিবন্ধন সফল হয়েছে!'}
          </h2>
          <p className="text-gray-600 mb-4">
            {language === 'en' 
              ? 'Your corporate account has been registered successfully. Redirecting to dashboard...'
              : 'আপনার কর্পোরেট অ্যাকাউন্ট সফলভাবে নিবন্ধন হয়েছে। ড্যাশবোর্ডে পুনঃনির্দেশ্ত হচ্ছে...'}
          </p>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Corporate Account Registration' : 'কর্পোরেট অ্যাকাউন্ট নিবন্ধন'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('bn')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === 'bn'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                index <= currentStep
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 ${
                  index < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {/* Error Message */}
          {error !== null && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Step 0: Company Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {language === 'en' ? 'Company Information' : 'কোম্পানি তথ্যসংক্রান্তি'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Company Name' : 'কোম্পানির নাম'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.companyName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder={language === 'en' ? 'Enter company name' : 'কোম্পানির নাম লিখুন'}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>
                  )}
                </div>
   
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Company Registration Number' : 'কোম্পানি নিবন্ধন নম্বর'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyRegistrationNumber}
                    onChange={(e) => setFormData({ ...formData, companyRegistrationNumber: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.companyRegistrationNumber ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder={language === 'en' ? 'Enter registration number' : 'নিবন্ধন নম্বর লিখুন'}
                  />
                  {errors.companyRegistrationNumber && (
                    <p className="text-sm text-red-600 mt-1">{errors.companyRegistrationNumber}</p>
                  )}
                </div>
   
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'TIN Number (Optional)' : 'টিআইএন নম্বর (ঐচ্ছিক)'}
                  </label>
                  <input
                    type="text"
                    value={formData.tinNumber}
                    onChange={(e) => setFormData({ ...formData, tinNumber: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.tinNumber ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder={language === 'en' ? 'Enter 12-digit TIN number' : '১২ ডিজিট টিআইএন নম্বর লিখুন'}
                    maxLength={12}
                  />
                  {errors.tinNumber && (
                    <p className="text-sm text-red-600 mt-1">{errors.tinNumber}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Address Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {language === 'en' ? 'Address Details' : 'ঠিকানার বিবরণ'}
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'Business Address' : 'ব্যবসায়ক ঠিকানা'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.businessAddress ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder={language === 'en' ? 'Enter complete business address' : 'সম্পূর্ণ ব্যবসায়ক ঠিকানা লিখুন'}
                />
                {errors.businessAddress && (
                  <p className="text-sm text-red-600 mt-1">{errors.businessAddress}</p>
                )}
              </div>
   
              <BangladeshAddress
                division={formData.division ?? ''}
                district={formData.district ?? ''}
                upazila={formData.upazila ?? ''}
                onDivisionChange={(value) => setFormData({ ...formData, division: value })}
                onDistrictChange={(value) => setFormData({ ...formData, district: value })}
                onUpazilaChange={(value) => setFormData({ ...formData, upazila: value })}
                errors={{
                  division: errors.division,
                  district: errors.district,
                  upazila: errors.upazila,
                }}
                language={language}
              />
   
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'Postal Code (Optional)' : 'পোস্টাল কোড (ঐচ্ছিক)'}
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={language === 'en' ? 'Enter postal code' : 'পোস্টাল কোড লিখুন'}
                  maxLength={10}
                />
              </div>
            </div>
          )}

          {/* Step 2: Authorized Person */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {language === 'en' ? 'Authorized Person Details' : 'অনুমতিকৃত ব্যক্তির বিবরণ'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Authorized Person Name' : 'অনুমতিকৃত ব্যক্তির নাম'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.authorizedPersonName}
                    onChange={(e) => setFormData({ ...formData, authorizedPersonName: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.authorizedPersonName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder={language === 'en' ? 'Enter full name' : 'সম্পূর্ণ নাম লিখুন'}
                  />
                  {errors.authorizedPersonName && (
                    <p className="text-sm text-red-600 mt-1">{errors.authorizedPersonName}</p>
                  )}
                </div>
   
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Authorized Person Email' : 'অনুমতিকৃত ব্যক্তির ইমেইল'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.authorizedPersonEmail}
                    onChange={(e) => setFormData({ ...formData, authorizedPersonEmail: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.authorizedPersonEmail ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder={language === 'en' ? 'Enter email address' : 'ইমেইল ঠিকানা লিখুন'}
                  />
                  {errors.authorizedPersonEmail && (
                    <p className="text-sm text-red-600 mt-1">{errors.authorizedPersonEmail}</p>
                  )}
                </div>
   
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Authorized Person Phone' : 'অনুমতিকৃত ব্যক্তির ফোন'} <span className="text-red-500">*</span>
                  </label>
                  <PhoneInput
                    value={formData.authorizedPersonPhone}
                    onChange={(value) => setFormData({ ...formData, authorizedPersonPhone: value })}
                    error={errors.authorizedPersonPhone}
                    placeholder={language === 'en' ? 'Enter phone number' : 'ফোন নম্বর লিখুন'}
                  />
                </div>
   
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Company Email' : 'কোম্পানি ইমেইল'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.companyEmail ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder={language === 'en' ? 'Enter company email' : 'কোম্পানি ইমেইল ঠিকানা লিখুন'}
                  />
                  {errors.companyEmail && (
                    <p className="text-sm text-red-600 mt-1">{errors.companyEmail}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {language === 'en' ? 'Upload Documents' : 'ডকুমেন্ট আপলোড করুন'}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Trade License' : 'ট্রেড লাইসেন্স'} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex-1 flex items-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-primary-500 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('tradeLicense', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <Upload className="w-6 h-6 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {documents.tradeLicense ? documents.tradeLicense.name : (language === 'en' ? 'Click to upload trade license' : 'ট্রেড লাইসেন্স আপলোড করতে ক্লিক করুন')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {language === 'en' ? 'PDF, JPG, PNG (Max 5MB)' : 'পিডিএফ, জেপিজি, পিএনজি (সর্বোচ্চা ৫এমবি)'}
                        </p>
                      </div>
                    </label>
                  </div>
                  {errors.tradeLicense && (
                    <p className="text-sm text-red-600 mt-1">{errors.tradeLicense}</p>
                  )}
                </div>
   
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'TIN Certificate (Optional)' : 'টিআইএন সার্টিফিকেট (ঐচ্ছিক)'}
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex-1 flex items-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-primary-500 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('tinCertificate', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <Upload className="w-6 h-6 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {documents.tinCertificate ? documents.tinCertificate.name : (language === 'en' ? 'Click to upload TIN certificate' : 'টিআইএন সার্টিফিকেট আপলোড করতে ক্লিক করুন')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {language === 'en' ? 'PDF, JPG, PNG (Max 5MB)' : 'পিডিএফ, জেপিজি, পিএনজি (সর্বোচ্চা ৫এমবি)'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
   
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'VAT Certificate (Optional)' : 'ভ্যাট সার্টিফিকেট (ঐচ্ছিক)'}
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex-1 flex items-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-primary-500 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('vatCertificate', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <Upload className="w-6 h-6 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {documents.vatCertificate ? documents.vatCertificate.name : (language === 'en' ? 'Click to upload VAT certificate' : 'ভ্যাট সার্টিফিকেট আপলোড করতে ক্লিক করুন')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {language === 'en' ? 'PDF, JPG, PNG (Max 5MB)' : 'পিডিএফ, জেপিজি, পিএনজি (সর্বোচ্চা ৫এমবি)'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
   
              {/* Terms and Conditions */}
              <div className="mt-8 p-4 bg-gray-50 rounded-md">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                    className={`mt-1 w-5 h-5 rounded focus:ring-2 ${
                      errors.termsAccepted ? 'focus:ring-red-500 border-red-300' : 'focus:ring-primary-500 border-gray-300'
                    }`}
                  />
                  <span className="text-sm text-gray-700">
                    {language === 'en' 
                      ? 'I agree to Terms and Conditions for corporate account registration'
                      : 'আমি কর্পোরেট অ্যাকাউন্ট নিবন্ধনের শর্তাব ও শর্তগুলো গ্রহণ করি'}
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                {errors.termsAccepted && (
                  <p className="text-sm text-red-600 mt-1">{errors.termsAccepted}</p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 0 || isLoading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {language === 'en' ? 'Previous' : 'আগে'}
              </button>
   
            {currentStep < steps.length - 1 ? (
              <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                {language === 'en' ? 'Next' : 'পরবর্তী'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span>{language === 'en' ? 'Submitting...' : 'জমা দেওয়া হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>{language === 'en' ? 'Submit Registration' : 'নিবন্ধন জমা দিন'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CorporateRegistrationPage;
