'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2, AlertCircle, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ToastNotification from '@/components/ui/ToastNotification';
import AccountPreferencesAPI from '@/lib/api/accountPreferences';
import { AccountDeletionStatus as AccountDeletionStatusType } from '@/types/accountPreferences';

interface AccountDeletionSectionProps {
  language: 'en' | 'bn';
}

const AccountDeletionSection: React.FC<AccountDeletionSectionProps> = ({ language }) => {
  const [status, setStatus] = useState<AccountDeletionStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await AccountPreferencesAPI.getAccountDeletionStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load deletion status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (confirmation !== 'DELETE') {
      setError(language === 'en' ? 'Please type DELETE to confirm' : 'দয়া করে DELETE লিখুন');
      return;
    }

    setIsRequesting(true);
    setError(null);

    try {
      await AccountPreferencesAPI.requestAccountDeletion({
        reason: reason || undefined,
        confirmation,
      });
      setStatus({
        status: 'pending',
        requestedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        scheduledDeletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setShowModal(false);
      setReason('');
      setConfirmation('');
      setToast({
        type: 'success',
        message: language === 'en'
          ? 'Deletion request submitted. Check your email for confirmation.'
          : 'রপ্তানি অনুরোধ জমা হয়েছে। নিশ্চিত করার জন্য আপনার ইমেল চেক করুন।',
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to request deletion');
      setToast({
        type: 'error',
        message: language === 'en'
          ? 'Failed to request deletion'
          : 'রপ্তানি অনুরোধ জমা করতে ব্যর্থ হয়েছে',
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsCancelling(true);
    setError(null);

    try {
      await AccountPreferencesAPI.cancelAccountDeletion();
      setStatus({
        status: 'cancelled',
      });
      setToast({
        type: 'success',
        message: language === 'en'
          ? 'Account deletion cancelled successfully!'
          : 'অ্যাকাউন্ট রপ্তানি বাতিল সফলভাবে করা হয়েছে!',
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel deletion');
      setToast({
        type: 'error',
        message: language === 'en'
          ? 'Failed to cancel deletion'
          : 'রপ্তানি বাতিল করতে ব্যর্থ হয়েছে',
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'none':
        return 'bg-gray-50 text-gray-600';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600';
      case 'confirmed':
        return 'bg-red-50 text-red-600';
      case 'cancelled':
        return 'bg-blue-50 text-blue-600';
      case 'completed':
        return 'bg-gray-100 text-gray-400';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    if (language === 'bn') {
      switch (status) {
        case 'none':
          return 'কোনো রপ্তানি অনুরোধ জমা নেই';
        case 'pending':
          return 'অপেক্ষমণ রয়ে';
        case 'confirmed':
          return 'নিশ্চিত করা হয়েছে';
        case 'cancelled':
          return 'বাতিল করা হয়েছে';
        case 'completed':
          return 'সম্পন্ন হয়েছে';
      }
    }
    switch (status) {
      case 'none':
        return 'No deletion request';
      case 'pending':
        return 'Pending deletion';
      case 'confirmed':
        return 'Deletion confirmed';
      case 'cancelled':
        return 'Deletion cancelled';
      case 'completed':
        return 'Account deleted';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <h2 className="text-xl font-bold text-gray-900">
        {language === 'en' ? 'Account Deletion' : 'অ্যাকাউন্ট রপ্তানি'}
      </h2>

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Status Display */}
      {status && (
        <div className={cn('p-4 rounded-md', getStatusColor(status.status))}>
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                {getStatusText(status.status)}
              </h3>
              {status.status === 'pending' && (
                <div className="space-y-2 text-sm">
                  <p>
                    {language === 'en'
                      ? 'Your account deletion is pending. You can cancel this request within 7 days.'
                      : 'আপনার অ্যাকাউন্ট রপ্তানি অপেক্ষমণ রয়ে। আপনি ৭ দিনের মধ্যে এই অনুরোধ বাতিল করতে পারেন।'}
                  </p>
                  {status.expiresAt && (
                    <p>
                      {language === 'en'
                        ? `Expires: ${formatDate(status.expiresAt)}`
                        : `মেয়াউতিত হবে: ${formatDate(status.expiresAt)}`}
                    </p>
                  )}
                  {status.scheduledDeletionDate && (
                    <p>
                      {language === 'en'
                        ? `Scheduled deletion: ${formatDate(status.scheduledDeletionDate)}`
                        : `নির্ধারিত রপ্তানির তারিখ: ${formatDate(status.scheduledDeletionDate)}`}
                    </p>
                  )}
                </div>
              )}
              {status.status === 'cancelled' && (
                <p className="text-sm">
                  {language === 'en'
                    ? 'Your account deletion was cancelled. Your account remains active.'
                    : 'আপনার অ্যাকাউন্ট রপ্তানি বাতিল করা হয়েছে। আপনার অ্যাকাউন্ট সক্রিয় রয়েই।'}
                </p>
              )}
              {status.status === 'completed' && (
                <p className="text-sm">
                  {language === 'en'
                    ? 'Your account has been deleted. You will be redirected to the home page.'
                    : 'আপনার অ্যাকাউন্ট রপ্তানি মুছে ফেলেছে। আপনি হোম পেজে পুনির্ক্ষণিত হবেন।'}
                </p>
              )}
            </div>
          </div>

          {/* Cancel Button (if pending) */}
          {status.status === 'pending' && (
            <button
              onClick={handleCancelDeletion}
              disabled={isCancelling}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{language === 'en' ? 'Cancelling...' : 'বাতিল করা হচ্ছে...'}</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>{language === 'en' ? 'Cancel Deletion' : 'রপ্তানি বাতিল করুন'}</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Request Deletion Button (if no pending deletion) */}
      {(!status || status.status === 'none') && (
        <div className="space-y-4">
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">
              {language === 'en' ? 'Delete Account' : 'অ্যাকাউন্ট রপ্তানি মুছে ফেলে'}
            </span>
          </button>

          <div className="text-center text-sm text-gray-600">
            {language === 'en'
              ? 'This action cannot be undone. All your data will be permanently deleted.'
              : 'এই কাজ পুনরোগ্রাম করা যাবে না। আপনার সব ডেটা স্থায়ইভে মুছে ফেলে যাবে।'}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <span>
                    {language === 'en'
                      ? 'Delete Account - Warning'
                      : 'অ্যাকাউন্ট রপ্তানি মুছে ফেলে - সতর্কতা'}
                  </span>
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-2">
                      {language === 'en'
                        ? 'Warning: This action cannot be undone!'
                        : 'সতর্কতা: এই কাজ পুনরোগ্রাম করা যাবে না!'}
                    </h3>
                    <ul className="space-y-2 text-sm text-red-800">
                      <li className="flex items-start space-x-2">
                        <span className="font-semibold">•</span>
                        <span>
                          {language === 'en'
                            ? 'All your personal information will be permanently deleted'
                            : 'আপনার সব ব্যক্তিগত তথ্য স্থায়ইভে মুছে ফেলে যাবে'}
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="font-semibold">•</span>
                        <span>
                          {language === 'en'
                            ? 'Your order history and purchase records will be lost'
                            : 'আপনার অর্ডার ইতিহাস এবং ক্রয় রেকর্ড হারাবে যাবে'}
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="font-semibold">•</span>
                        <span>
                          {language === 'en'
                            ? 'All addresses, wishlist items, and preferences will be deleted'
                            : 'সব ঠিকানা, উইশলিস্টের আইটেম এবং পছন্দ মুছে ফেলে যাবে'}
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="font-semibold">•</span>
                        <span>
                          {language === 'en'
                            ? 'You will not be able to recover any data after deletion'
                            : 'রপ্তানির পর আপনি কোনো ডেটা পুনরোগ্রাম করতে পারবেন না'}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Reason Input */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en' ? 'Reason for deletion (optional)' : 'রপ্তানির কারণ (ঐচ্ছিক্যরী)'}
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder={
                      language === 'en'
                        ? 'Tell us why you want to delete your account (optional)'
                        : 'আপনি কেন আপনার অ্যাকাউন্ট রপ্তানি মুছে ফেলে চান (ঐচ্ছিক্যরী)'
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Confirmation Input */}
                <div>
                  <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'en'
                      ? 'Type "DELETE" to confirm'
                      : 'নিশ্চিত করার জন্য "DELETE" লিখুন'}
                  </label>
                  <input
                    type="text"
                    id="confirmation"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                    placeholder="DELETE"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-center font-mono tracking-widest uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'en'
                      ? 'Please type DELETE in all capital letters'
                      : 'দয়া করে সব বড় অক্ষরে DELETE লিখুন'}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-md p-4">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {language === 'en' ? 'Cancel' : 'বাতিল'}
                  </button>
                  <button
                    onClick={handleRequestDeletion}
                    disabled={isRequesting || confirmation !== 'DELETE'}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRequesting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{language === 'en' ? 'Deleting...' : 'মুছে ফেলে হচ্ছে...'}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4" />
                        <span>{language === 'en' ? 'Delete Account' : 'অ্যাকাউন্ট রপ্তানি মুছে ফেলে'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDeletionSection;
