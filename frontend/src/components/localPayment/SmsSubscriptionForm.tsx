/**
 * SMS Subscription Form Component
 *
 * Form for creating or managing SMS subscriptions for premium features.
 * Supports both English and Bengali languages.
 */

import React, { useState, useEffect } from 'react';
import { SmsSubscription, LOCAL_PAYMENT_CONSTANTS } from '@/types/localPayment';
import { getSmsSubscription, createSmsSubscription, updateSmsSubscription } from '@/lib/api/localPayment';

interface SmsSubscriptionFormProps {
  userId?: string;
  existingSubscription?: SmsSubscription | null;
  onSubmit?: (subscription: SmsSubscription) => void;
  onCancel?: () => void;
  language?: 'en' | 'bn';
  className?: string;
}

interface FormData {
  phoneNumber: string;
  paymentMethod: string;
}

const SmsSubscriptionForm: React.FC<SmsSubscriptionFormProps> = ({
  userId,
  existingSubscription,
  onSubmit,
  onCancel,
  language = 'en',
  className = ''
}) => {
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: existingSubscription?.phoneNumber || '',
    paymentMethod: existingSubscription?.paymentMethod || 'bkash'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let subscription: SmsSubscription;

      if (existingSubscription) {
        // Update existing subscription
        const response = await updateSmsSubscription(existingSubscription.id, formData);
        subscription = response.data;
      } else if (userId) {
        // Create new subscription
        const response = await createSmsSubscription(userId, formData.phoneNumber, formData.paymentMethod);
        subscription = response.data;
      } else {
        throw new Error('User ID is required for new subscription');
      }

      setSuccess(true);
      if (onSubmit) {
        onSubmit(subscription);
      }
    } catch (err: any) {
      console.error('[SmsSubscriptionForm] Error submitting form:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        (language === 'bn' ? 'সাবস্ক্রিপশন তৈরি করতে ব্যর্থ হয়েছে' : 'Failed to create subscription')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (success) {
    return (
      <div className={`sms-subscription-form sms-subscription-form--success ${className}`}>
        <div className="sms-subscription-form__success">
          <svg
            className="sms-subscription-form__success-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="sms-subscription-form__success-title">
            {language === 'bn' ? 'সফল!' : 'Success!'}
          </h3>
          <p className="sms-subscription-form__success-message">
            {language === 'bn'
              ? 'আপনার SMS সাবস্ক্রিপশন সফলভাবে সেট আপ করা হয়েছে।'
              : 'Your SMS subscription has been set up successfully.'}
          </p>
          <button
            type="button"
            className="sms-subscription-form__button sms-subscription-form__button--secondary"
            onClick={onCancel}
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`sms-subscription-form ${className}`}>
      <h2 className="sms-subscription-form__title">
        {existingSubscription
          ? (language === 'bn' ? 'সাবস্ক্রিপশন আপডেট করুন' : 'Update Subscription')
          : (language === 'bn' ? 'SMS সাবস্ক্রিপশন তৈরি করুন' : 'Create SMS Subscription')
        }
      </h2>

      <div className="sms-subscription-form__info">
        <div className="sms-subscription-form__info-item">
          <svg
            className="sms-subscription-form__info-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="sms-subscription-form__info-text">
            {language === 'bn'
              ? `মাসিক চার্জ: ${LOCAL_PAYMENT_CONSTANTS.DEFAULT_CURRENCY} ${LOCAL_PAYMENT_CONSTANTS.SMS_SUBSCRIPTION_AMOUNT}`
              : `Monthly charge: ${LOCAL_PAYMENT_CONSTANTS.DEFAULT_CURRENCY} ${LOCAL_PAYMENT_CONSTANTS.SMS_SUBSCRIPTION_AMOUNT}`
            }
          </span>
        </div>
        <div className="sms-subscription-form__info-item">
          <svg
            className="sms-subscription-form__info-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="sms-subscription-form__info-text">
            {language === 'bn'
              ? `সাবস্ক্রিপশন সময়কাল: ${LOCAL_PAYMENT_CONSTANTS.SMS_SUBSCRIPTION_DURATION} দিন`
              : `Subscription duration: ${LOCAL_PAYMENT_CONSTANTS.SMS_SUBSCRIPTION_DURATION} days`
            }
          </span>
        </div>
      </div>

      {error && (
        <div className="sms-subscription-form__error">
          <svg
            className="sms-subscription-form__error-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="sms-subscription-form__error-text">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="sms-subscription-form__form">
        <div className="sms-subscription-form__field">
          <label htmlFor="phoneNumber" className="sms-subscription-form__label">
            {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            placeholder={language === 'bn' ? '01XXXXXXXXX' : '01XXXXXXXXX'}
            className="sms-subscription-form__input"
            disabled={!!existingSubscription}
          />
        </div>

        <div className="sms-subscription-form__field">
          <label htmlFor="paymentMethod" className="sms-subscription-form__label">
            {language === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            required
            className="sms-subscription-form__select"
          >
            {LOCAL_PAYMENT_CONSTANTS.DEFAULT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method === 'bkash' && (language === 'bn' ? 'বিকাশ (bKash)' : 'bKash')}
                {method === 'nagad' && (language === 'bn' ? 'নগদ (Nagad)' : 'Nagad')}
                {method === 'rocket' && (language === 'bn' ? 'রকেট (Rocket)' : 'Rocket')}
                {method === 'surecash' && (language === 'bn' ? 'সিওরক্যাশ (SureCash)' : 'SureCash')}
              </option>
            ))}
          </select>
        </div>

        <div className="sms-subscription-form__actions">
          <button
            type="submit"
            className="sms-subscription-form__button sms-subscription-form__button--primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (language === 'bn' ? 'প্রক্রিয়া হচ্ছে...' : 'Processing...')
              : (existingSubscription
                  ? (language === 'bn' ? 'আপডেট করুন' : 'Update')
                  : (language === 'bn' ? 'সাবস্ক্রাইব করুন' : 'Subscribe')
              )
            }
          </button>
          {onCancel && (
            <button
              type="button"
              className="sms-subscription-form__button sms-subscription-form__button--secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SmsSubscriptionForm;
