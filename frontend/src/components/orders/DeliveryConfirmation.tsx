/**
 * DeliveryConfirmation Component
 * 
 * Modal/dialog for delivery confirmation with recipient details,
 * signature pad, photo upload, and location capture.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DeliveryConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    recipientName: string;
    recipientPhone?: string;
    signature?: string;
    photo?: string;
    notes?: string;
    location?: {
      latitude?: number;
      longitude?: number;
      address?: string;
    };
  }) => Promise<void>;
  language?: 'en' | 'bn';
  loading?: boolean;
}

interface SignaturePadRef {
  clear: () => void;
  toDataURL: () => string;
}

// Simple Signature Pad Component
const SignaturePad: React.FC<{
  onChange: (signature: string) => void;
  language?: 'en' | 'bn';
}> = ({ onChange, language = 'en' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in event) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top,
      };
    }
    
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {language === 'bn' ? 'স্বাক্ষর:' : 'Signature:'}
      </label>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-40 cursor-crosshair touch-none"
          aria-label={language === 'bn' ? 'স্বাক্ষর প্যাড' : 'Signature pad'}
        />
      </div>
      <button
        type="button"
        onClick={clearSignature}
        className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        {language === 'bn' ? 'স্বাক্ষর সাফ করুন' : 'Clear Signature'}
      </button>
    </div>
  );
};

const DeliveryConfirmation: React.FC<DeliveryConfirmationProps> = ({
  isOpen,
  onClose,
  onSubmit,
  language = 'en',
  loading = false,
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [signature, setSignature] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<{
    latitude?: number;
    longitude?: number;
    address?: string;
  }>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setRecipientName('');
      setRecipientPhone('');
      setSignature('');
      setPhoto(null);
      setNotes('');
      setLocation({});
      setErrors({});
    }
  }, [isOpen]);

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({
        ...prev,
        photo: language === 'bn' ? 'শুধুমাত্র ছবি ফাইল অনুমোদিত' : 'Only image files are allowed',
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        photo: language === 'bn' ? 'ফাইল সাইজ 5MB এর বেশি হতে পারবে না' : 'File size must be less than 5MB',
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
      setErrors((prev) => ({ ...prev, photo: '' }));
    };
    reader.readAsDataURL(file);
  };

  // Handle location capture
  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({
        ...prev,
        location: language === 'bn'
          ? 'আপনার ব্রাউজার জিওলোকেশন সাপোর্ট করে না'
          : 'Geolocation is not supported by your browser',
      }));
      return;
    }

    setIsCapturingLocation(true);
    setErrors((prev) => ({ ...prev, location: '' }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsCapturingLocation(false);
      },
      (error) => {
        setErrors((prev) => ({
          ...prev,
          location: language === 'bn'
            ? 'অবস্থান প্রাপ্ত করতে ব্যর্থ হয়েছে'
            : 'Failed to get location',
        }));
        setIsCapturingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!recipientName.trim()) {
      newErrors.recipientName =
        language === 'bn' ? 'প্রাপকের নাম প্রয়োজন' : 'Recipient name is required';
    }

    if (recipientPhone && !/^\+?[1-9]\d{1,14}$/.test(recipientPhone)) {
      newErrors.recipientPhone =
        language === 'bn' ? 'সঠিক ফোন নম্বর প্রবেশ করুন' : 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit({
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim() || undefined,
      signature: signature || undefined,
      photo: photo || undefined,
      notes: notes.trim() || undefined,
      location: Object.keys(location).length > 0 ? location : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {language === 'bn' ? 'ডেলিভারি নিশ্চিতকরণ' : 'Delivery Confirmation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Recipient Name */}
          <div>
            <label
              htmlFor="recipientName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {language === 'bn' ? 'প্রাপকের নাম *' : 'Recipient Name *'}
            </label>
            <input
              type="text"
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.recipientName
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={language === 'bn' ? 'প্রাপকের নাম লিখুন' : 'Enter recipient name'}
              required
            />
            {errors.recipientName && (
              <p className="mt-1 text-sm text-red-500">{errors.recipientName}</p>
            )}
          </div>

          {/* Recipient Phone */}
          <div>
            <label
              htmlFor="recipientPhone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {language === 'bn' ? 'প্রাপকের ফোন নম্বর' : 'Recipient Phone'}
            </label>
            <input
              type="tel"
              id="recipientPhone"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.recipientPhone
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={language === 'bn' ? '+8801XXXXXXXXX' : '+8801XXXXXXXXX'}
            />
            {errors.recipientPhone && (
              <p className="mt-1 text-sm text-red-500">{errors.recipientPhone}</p>
            )}
          </div>

          {/* Signature */}
          <SignaturePad onChange={setSignature} language={language} />

          {/* Photo Upload */}
          <div>
            <label
              htmlFor="photo"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {language === 'bn' ? 'ডেলিভারি ছবি' : 'Delivery Photo'}
            </label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.photo && (
              <p className="mt-1 text-sm text-red-500">{errors.photo}</p>
            )}
            {photo && (
              <div className="mt-2">
                <img
                  src={photo}
                  alt={language === 'bn' ? 'ডেলিভারি ছবি' : 'Delivery photo'}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Location Capture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'bn' ? 'অবস্থান' : 'Location'}
            </label>
            <button
              type="button"
              onClick={handleCaptureLocation}
              disabled={isCapturingLocation}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCapturingLocation
                ? language === 'bn'
                  ? 'অবস্থান প্রাপ্ত করা হচ্ছে...'
                  : 'Capturing location...'
                : language === 'bn'
                ? 'অবস্থান ক্যাপচার করুন'
                : 'Capture Location'}
            </button>
            {errors.location && (
              <p className="mt-1 text-sm text-red-500">{errors.location}</p>
            )}
            {location.latitude && location.longitude && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  {language === 'bn' ? 'অক্ষাংশ:' : 'Latitude:'} {location.latitude.toFixed(6)}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  {language === 'bn' ? 'দ্রাঘিমাংশ:' : 'Longitude:'} {location.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {language === 'bn' ? 'নোট' : 'Notes'}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={language === 'bn' ? 'অতিরিক্ত নোট লিখুন...' : 'Add additional notes...'}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? language === 'bn'
                  ? 'জমা দেওয়া হচ্ছে...'
                  : 'Submitting...'
                : language === 'bn'
                ? 'জমা দিন'
                : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryConfirmation;
