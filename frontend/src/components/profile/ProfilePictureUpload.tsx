'use client';

import React, { useState, useRef } from 'react';
import { Camera, X, Upload, AlertCircle } from 'lucide-react';
import { ProfileAPI } from '@/lib/api/profile';
import { UserProfile } from '@/lib/api/profile';
import { getImageUrl } from '@/lib/utils/image';

interface ProfilePictureUploadProps {
  user: UserProfile;
  language: 'en' | 'bn';
  onUpdate: (user: UserProfile) => void;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({ user, language, onUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError(language === 'en'
          ? 'Only image files (JPEG, PNG, GIF, WebP) are allowed'
          : 'শুধুমাত্র ইমেজ ফাইল (JPEG, PNG, GIF, WebP) অনুমোদিত');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(language === 'en'
          ? 'File size must be less than 5MB'
          : 'ফাইল সাইজ 5MB এর কম হতে হবে');
        return;
      }

      // Store the file in state
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!preview || !selectedFile) {
      setError(language === 'en'
        ? 'No file selected for upload'
        : 'আপলোডের জন্য কোনো ফাইল নির্বাচিত নেই');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.log('[ProfilePictureUpload] Uploading file:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      });

      const response = await ProfileAPI.uploadProfilePicture(selectedFile);
      
      console.log('[ProfilePictureUpload] Upload successful:', response);
      
      onUpdate(response.user);
      setPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('[ProfilePictureUpload] Upload failed:', err);
      setError(err.response?.data?.error || err.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!user.image) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await ProfileAPI.deleteProfilePicture();
      onUpdate(response.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete profile picture');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {language === 'en' ? 'Profile Picture' : 'প্রোফাইল ছবি'}
      </h3>

      <div className="flex items-center space-x-6">
        {/* Profile Picture */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => console.error('[ProfilePictureUpload] Preview image error:', e)}
              />
            ) : getImageUrl(user.image) ? (
              <img
                src={getImageUrl(user.image)!}
                alt={user.firstName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('[ProfilePictureUpload] Image load error:', e);
                  console.error('[ProfilePictureUpload] Image URL:', getImageUrl(user.image));
                  console.error('[ProfilePictureUpload] user.image:', user.image);
                }}
                onLoad={() => {
                  console.log('[ProfilePictureUpload] Image loaded successfully');
                  console.log('[ProfilePictureUpload] Image URL:', getImageUrl(user.image));
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-600 text-white text-4xl font-bold">
                {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
              </div>
            )}
          </div>

          {/* Upload Button Overlay */}
          {!preview && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
            >
              <Camera className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-1 space-y-3">
          {!preview ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span>{language === 'en' ? 'Upload New Picture' : 'নতুন ছবি আপলোড করুন'}</span>
              </button>

              {user.image && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      <span>{language === 'en' ? 'Deleting...' : 'মুছে ফেলা হচ্ছে...'}</span>
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5" />
                      <span>{language === 'en' ? 'Remove Picture' : 'ছবি সরান'}</span>
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{language === 'en' ? 'Uploading...' : 'আপলোড হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span>{language === 'en' ? 'Save Picture' : 'ছবি সংরক্ষণ করুন'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <X className="h-5 w-5" />
                <span>{language === 'en' ? 'Cancel' : 'বাতিল'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-md p-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* File Requirements */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>{language === 'en' ? 'File requirements:' : 'ফাইল প্রয়োজনীয়তা:'}</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>{language === 'en' ? 'Format: JPEG, PNG, GIF, WebP' : 'ফরম্যাট: JPEG, PNG, GIF, WebP'}</li>
          <li>{language === 'en' ? 'Maximum size: 5MB' : 'সর্বোচ্চ সাইজ: 5MB'}</li>
          <li>{language === 'en' ? 'Recommended: Square image (1:1 ratio)' : 'সুপারিশকৃত: বর্গাকার ছবি (1:1 অনুপাত)'}</li>
        </ul>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
