'use client';

import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Phone, Calendar, Save, X, Check } from 'lucide-react';
import { ProfileAPI, UserProfile, ProfileUpdateData } from '@/lib/api/profile';
import { formatDate } from '@/lib/utils';

interface ProfileEditFormProps {
  user: UserProfile;
  language: 'en' | 'bn';
  onUpdate: (user: UserProfile) => void;
  onCancel: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ user, language, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState<ProfileUpdateData>({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
    gender: user.gender,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ProfileAPI.updateProfile(formData);
      onUpdate(response.user);
      setSuccess(true);
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'en' ? 'Edit Profile' : 'প্রোফাইল সম্পাদনা'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
          <Check className="h-5 w-5 text-green-600 mr-2" />
          <p className="text-sm text-green-800">
            {language === 'en' ? 'Profile updated successfully!' : 'প্রোফাইল সফলভাবে আপডেট হয়েছে!'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'First Name' : 'প্রথম নাম'}
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                minLength={2}
                maxLength={50}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={language === 'en' ? 'Enter first name' : 'প্রথম নাম লিখুন'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Last Name' : 'শেষ নাম'}
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                minLength={2}
                maxLength={50}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={language === 'en' ? 'Enter last name' : 'শেষ নাম লিখুন'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Phone Number' : 'ফোন নম্বর'}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                pattern="^(\+880|01)(1[3-9]\d{8}|\d{9})$"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={language === 'en' ? '+8801XXXXXXXXX' : '+8801XXXXXXXXX'}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {language === 'en' ? 'Format: +8801XXXXXXXXX or 01XXXXXXXXX' : 'ফরম্যাট: +8801XXXXXXXXX বা 01XXXXXXXXX'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Date of Birth' : 'জন্ম তারিখ'}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth ? formData.dateOfBirth.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setFormData(prev => ({ ...prev, dateOfBirth: date }));
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Gender' : 'লিঙ্গ'}
            </label>
            <select
              name="gender"
              value={formData.gender || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">
                {language === 'en' ? 'Select gender' : 'লিঙ্গ নির্বাচন করুন'}
              </option>
              <option value="MALE">
                {language === 'en' ? 'Male' : 'পুরুষ'}
              </option>
              <option value="FEMALE">
                {language === 'en' ? 'Female' : 'মহিলা'}
              </option>
              <option value="OTHER">
                {language === 'en' ? 'Other' : 'অন্যান্য'}
              </option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === 'en' ? 'Cancel' : 'বাতিল'}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{language === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...'}</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>{language === 'en' ? 'Save Changes' : 'পরিবর্তন সংরক্ষণ করুন'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditForm;
