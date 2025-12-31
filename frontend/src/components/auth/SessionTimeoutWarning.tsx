import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionTimeoutWarningProps {
  /** Time in seconds before session expires */
  timeoutSeconds: number;
  /** Time in seconds before showing the warning (default: 120 seconds = 2 minutes) */
  warningThreshold?: number;
  /** Callback when user clicks "Stay Logged In" */
  onExtendSession: () => Promise<void>;
  /** Callback when session expires */
  onSessionExpire: () => void;
  /** Current language */
  language?: 'en' | 'bn';
  /** Additional CSS classes */
  className?: string;
}

const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  timeoutSeconds,
  warningThreshold = 120,
  onExtendSession,
  onSessionExpire,
  language = 'en',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExtending, setIsExtending] = useState(false);
  const [hasExpired, setHasExpired] = useState(false);

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle extending session
  const handleExtendSession = useCallback(async () => {
    setIsExtending(true);
    try {
      await onExtendSession();
      setIsVisible(false);
      setHasExpired(false);
    } catch (error) {
      console.error('Failed to extend session:', error);
      // If extension fails, the session will expire naturally
    } finally {
      setIsExtending(false);
    }
  }, [onExtendSession]);

  // Handle session expiration
  const handleSessionExpire = useCallback(() => {
    setHasExpired(true);
    onSessionExpire();
  }, [onSessionExpire]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let countdown: NodeJS.Timeout;

    // Start the session timer
    const startTimer = () => {
      let remaining = timeoutSeconds;

      // Check if we should show the warning
      const checkWarning = () => {
        if (remaining <= warningThreshold && !isVisible && !hasExpired) {
          setIsVisible(true);
        }
      };

      // Update time remaining
      interval = setInterval(() => {
        remaining--;

        if (remaining <= 0) {
          clearInterval(interval);
          clearInterval(countdown);
          handleSessionExpire();
          return;
        }

        checkWarning();

        if (isVisible) {
          setTimeRemaining(remaining);
        }
      }, 1000);

      // Countdown timer for visible warning
      countdown = setInterval(() => {
        if (isVisible && remaining > 0) {
          setTimeRemaining(remaining);
        }
      }, 1000);
    };

    startTimer();

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, [timeoutSeconds, warningThreshold, isVisible, hasExpired, handleSessionExpire]);

  // Don't render anything if not visible and not expired
  if (!isVisible && !hasExpired) {
    return null;
  }

  const isCritical = timeRemaining <= 30; // Critical when less than 30 seconds

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm',
        'animate-in fade-in duration-200',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-description"
    >
      <div
        className={cn(
          'bg-white rounded-lg shadow-2xl max-w-md w-full p-6',
          'animate-in zoom-in-95 duration-200',
          hasExpired ? 'border-2 border-red-500' : 'border border-gray-200'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                'p-2 rounded-full',
                hasExpired
                  ? 'bg-red-100'
                  : isCritical
                  ? 'bg-orange-100'
                  : 'bg-yellow-100'
              )}
            >
              {hasExpired ? (
                <AlertCircle className="h-6 w-6 text-red-600" />
              ) : (
                <Clock className={cn('h-6 w-6', isCritical ? 'text-orange-600' : 'text-yellow-600')} />
              )}
            </div>
            <div>
              <h3
                id="session-timeout-title"
                className="text-lg font-semibold text-gray-900"
              >
                {hasExpired
                  ? language === 'bn'
                    ? 'সেশন মেয়াদ শেষ হয়েছে'
                    : 'Session Expired'
                  : language === 'bn'
                  ? 'সেশন শেষ হতে যাচ্ছে'
                  : 'Session Expiring Soon'}
              </h3>
            </div>
          </div>
          {!hasExpired && (
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Message */}
        <div id="session-timeout-description" className="mb-6">
          {hasExpired ? (
            <p className="text-gray-600">
              {language === 'bn'
                ? 'আপনার সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।'
                : 'Your session has expired. Please log in again.'}
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">
                {language === 'bn'
                  ? 'আপনার সেশন শেষ হতে যাচ্ছে। আপনি চাইলে সেশন বাড়িয়ে নিতে পারেন।'
                  : 'Your session is about to expire. You can extend it if you wish.'}
              </p>
              <div
                className={cn(
                  'text-center py-3 px-4 rounded-lg font-mono text-2xl font-bold',
                  isCritical
                    ? 'bg-red-50 text-red-700'
                    : 'bg-yellow-50 text-yellow-700'
                )}
              >
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-gray-500 text-center">
                {language === 'bn' ? 'সময় বাকি' : 'Time remaining'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          {hasExpired ? (
            <button
              onClick={onSessionExpire}
              className={cn(
                'w-full flex justify-center py-2.5 px-4',
                'border border-transparent rounded-md shadow-sm text-sm font-medium',
                'text-white bg-primary-600 hover:bg-primary-700',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                'transition-colors duration-200'
              )}
            >
              {language === 'bn' ? 'লগইন করুন' : 'Log In Again'}
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsVisible(false)}
                className={cn(
                  'flex-1 py-2.5 px-4',
                  'border border-gray-300 rounded-md shadow-sm text-sm font-medium',
                  'text-gray-700 bg-white hover:bg-gray-50',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                  'transition-colors duration-200'
                )}
              >
                {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
              </button>
              <button
                onClick={handleExtendSession}
                disabled={isExtending}
                className={cn(
                  'flex-1 flex justify-center items-center py-2.5 px-4',
                  'border border-transparent rounded-md shadow-sm text-sm font-medium',
                  'text-white bg-primary-600 hover:bg-primary-700',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                  'transition-colors duration-200',
                  isExtending && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isExtending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-t-2 border-white mr-2"></div>
                    {language === 'bn' ? 'প্রসারিত হচ্ছে...' : 'Extending...'}
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    {language === 'bn' ? 'সেশন বাড়ান' : 'Stay Logged In'}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;
