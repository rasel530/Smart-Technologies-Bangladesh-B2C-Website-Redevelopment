'use client';

import React, { useState } from 'react';
import { RegistrationForm } from '@/components/auth/RegistrationForm';
import { RegistrationData } from '@/types/auth';

export default function RegisterPage() {
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [selectedDivision, setSelectedDivision] = useState('');  // Add default division

  const handleRegistration = async (data: Partial<RegistrationData>) => {
    try {
      console.log('Registration data:', data);
      
      // Set default division if none provided
      if (data.division && !selectedDivision) {
        setSelectedDivision(data.division);
      }
      
      // Simulate API call
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      console.log('Registration successful:', result);
      
      // Handle successful registration
      // Redirect to verification page or dashboard
      // window.location.href = '/verify';
      
    } catch (error) {
      console.error('Registration error:', error);
      // Handle error display
    }
  };

  const handleLanguageChange = (newLanguage: 'en' | 'bn') => {
    setLanguage(newLanguage);
    // Store preference in localStorage
    localStorage.setItem('preferredLanguage', newLanguage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              {language === 'bn' ? 'নিবন্ধন প্রক্রিয়া' : 'Create Account'}
            </h1>
            <p className="text-secondary-600 mb-6">
              {language === 'bn' 
                ? 'স্মার্ট টেকনোব্স বাংলাদেশ ফোন নম্বর সম্পর্ক করব। নিবন্ধন করুন এবং বিশেষ করুন।' 
                : 'Join Smart Technologies Bangladesh and enjoy exclusive access to premium technology products and services.'
              }
            </p>
          </div>

          {/* Language Toggle */}
          <div className="flex justify-end mb-8">
            <div className="bg-white rounded-lg shadow-md p-1 flex items-center space-x-2">
              <span className="text-sm text-secondary-600 mr-2">
                {language === 'bn' ? 'ভাষা:' : 'Language:'}
              </span>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                  language === 'en' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-secondary-200 text-secondary-700 hover:bg-secondary-300'
                }`}
                aria-label="Switch to English"
              >
                English
              </button>
              <button
                onClick={() => handleLanguageChange('bn')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                  language === 'bn' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-secondary-200 text-secondary-700 hover:bg-secondary-300'
                }`}
                aria-label="Switch to Bengali"
              >
                বাংলা
              </button>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <RegistrationForm
              onSubmit={handleRegistration}
              language={language}
              className="w-full"
            />
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-secondary-600">
            <p>
              {language === 'bn' ? 'আগে থাকোন?' : 'Already have an account?'}{' '}
              <a 
                href="/login" 
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {language === 'bn' ? 'লগইন করুন' : 'Sign in'}
              </a>
            </p>
             
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <p className="text-xs text-secondary-500 mb-2">
                {language === 'bn' ? 'নিবন্ধন করুন এবং বিশেষ করুন।' : 'By registering, you agree to our'}
                {' '}
                <a 
                  href="/terms" 
                  className="text-primary-600 hover:text-primary-700 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {language === 'bn' ? 'শর্তব মেনে গ্রহণ' : 'Terms of Service'}
                </a>
                {' '}
                {language === 'bn' ? 'এবং' : 'and'}
                {' '}
                <a 
                  href="/privacy" 
                  className="text-primary-600 hover:text-primary-700 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {language === 'bn' ? 'গোপনীয়তা নীতিমান্ট' : 'Privacy Policy'}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
