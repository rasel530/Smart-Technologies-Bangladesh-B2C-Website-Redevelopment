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
      
      // Call backend API for registration
      const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${backendApiUrl}/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        let errorMessageBn = 'নিবন্ধন ব্যর্থ হয়েছে';
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            errorMessageBn = errorData.messageBn || errorMessage;
          } else {
            // Response is not JSON, get text instead
            const errorText = await response.text();
            console.error('Non-JSON error response:', errorText);
            errorMessage = `Server error (${response.status})`;
            errorMessageBn = `সার্ভার ত্রুটি (${response.status})`;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Server error (${response.status})`;
          errorMessageBn = `সার্ভার ত্রুটি (${response.status})`;
        }
        
        // Show error alert
        alert(`${language === 'bn' ? 'নিবন্ধন ব্যর্থ: ' : 'Registration failed: '}${errorMessage}`);
        throw new Error(errorMessage);
      }

      let result;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
          console.log('Registration successful:', result);
        } else {
          const responseText = await response.text();
          console.error('Non-JSON success response:', responseText);
          throw new Error('Invalid response format from server');
        }
      } catch (parseError) {
        console.error('Failed to parse success response:', parseError);
        throw new Error('Failed to process registration response');
      }
      
      // Show success message
      const successMessage = result?.message || result?.messageBn || 'Registration successful!';
      alert(successMessage);
      
      // Handle successful registration
      // Redirect to verification page or dashboard based on response
      if (result?.requiresEmailVerification) {
        window.location.href = '/verify-email';
      } else if (result?.requiresPhoneVerification) {
        window.location.href = '/verify-phone';
      } else {
        // Registration complete, redirect to login or dashboard
        window.location.href = '/login';
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const errorMessageBn = errorMessage; // You could translate this
      alert(`${language === 'bn' ? 'ত্রুটি: ' : 'Error: '}${errorMessage}`);
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
