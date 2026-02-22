'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Shield, ShieldCheck, AlertTriangle, X, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckoutSecurity, SecurityWarning, CheckoutSecurityBadgeProps } from '@/types/checkout';

/**
 * Checkout Security Badge Component
 *
 * Displays security indicators, SSL/HTTPS status, data protection notices,
 * compliance badges, and trust indicators for the checkout process.
 *
 * @example
 * ```tsx
 * <CheckoutSecurityBadge
 *   security={securityData}
 *   language="en"
 *   showWarnings={true}
 *   onWarningDismiss={(warningId) => console.log('Dismissed:', warningId)}
 * />
 * ```
 */

const BADGE_ICONS: Record<string, React.ReactNode> = {
  lock: <Lock className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
  'shield-check': <ShieldCheck className="w-5 h-5" />,
};

const WARNING_ICONS: Record<string, React.ReactNode> = {
  session_timeout: <Clock className="w-5 h-5" />,
  insecure_connection: <AlertTriangle className="w-5 h-5" />,
  suspicious_activity: <AlertTriangle className="w-5 h-5" />,
  other: <AlertTriangle className="w-5 h-5" />,
};

export const CheckoutSecurityBadge: React.FC<CheckoutSecurityBadgeProps> = ({
  security,
  language = 'en',
  className = '',
  showWarnings = true,
  onWarningDismiss,
}) => {
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<number>(0);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());

  // Calculate time until session expiration
  useEffect(() => {
    const calculateTimeUntilExpiration = () => {
      const expiresAt = new Date(security.sessionExpiresAt).getTime();
      const now = Date.now();
      const diff = expiresAt - now;
      return Math.max(0, diff);
    };

    // Initial calculation
    setTimeUntilExpiration(calculateTimeUntilExpiration());

    // Update every second
    const interval = setInterval(() => {
      setTimeUntilExpiration(calculateTimeUntilExpiration());
    }, 1000);

    return () => clearInterval(interval);
  }, [security.sessionExpiresAt]);

  // Format time until expiration
  const formatTimeUntilExpiration = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Get session timeout warning level
  const getSessionTimeoutLevel = (): 'normal' | 'warning' | 'critical' => {
    if (timeUntilExpiration < 2 * 60 * 1000) return 'critical'; // Less than 2 minutes
    if (timeUntilExpiration < 5 * 60 * 1000) return 'warning'; // Less than 5 minutes
    return 'normal';
  };

  const sessionTimeoutLevel = getSessionTimeoutLevel();

  // Handle warning dismissal
  const handleWarningDismiss = (warning: SecurityWarning) => {
    if (warning.dismissible) {
      setDismissedWarnings(prev => new Set(prev).add(warning.type));
      if (onWarningDismiss) {
        onWarningDismiss(warning.type);
      }
    }
  };

  // Filter out dismissed warnings
  const activeWarnings = security.warnings.filter(
    warning => !dismissedWarnings.has(warning.type) && !warning.dismissed
  );

  // Get severity color class
  const getSeverityColorClass = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={cn('checkout-security-badge', className)}>
      {/* Security Status Bar */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-lg border',
          security.isSecure && security.isHttps
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full',
            security.isSecure && security.isHttps
              ? 'bg-green-500'
              : 'bg-red-500'
          )}
        >
          {security.isSecure && security.isHttps ? (
            <Lock className="w-5 h-5 text-white" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1">
          <p
            className={cn(
              'text-sm font-semibold',
              security.isSecure && security.isHttps
                ? 'text-green-800'
                : 'text-red-800'
            )}
          >
            {security.isSecure && security.isHttps
              ? (language === 'en' ? 'Secure Checkout' : 'নিরাপদ চেকআউট')
              : (language === 'en' ? 'Connection Not Secure' : 'সংযোগ নিরাপদ নয়')}
          </p>
          <p className="text-xs text-gray-600">
            {security.isSecure && security.isHttps
              ? (language === 'en' ? 'Your connection is encrypted and secure' : 'আপনার সংযোগ এনক্রিপ্ট এবং নিরাপদ')
              : (language === 'en' ? 'Warning: Connection is not secure' : 'সতর্কতা: সংযোগ নিরাপদ নয়')}
          </p>
        </div>
        {/* Session Timer */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
            sessionTimeoutLevel === 'critical' && 'bg-red-100 text-red-800',
            sessionTimeoutLevel === 'warning' && 'bg-yellow-100 text-yellow-800',
            sessionTimeoutLevel === 'normal' && 'bg-green-100 text-green-800'
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimeUntilExpiration(timeUntilExpiration)}</span>
        </div>
      </div>

      {/* Security Badges */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {security.badges.map((badge, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg border transition-all duration-200',
              badge.verified
                ? 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                : 'bg-gray-50 border-gray-200'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0',
                badge.verified ? 'bg-blue-100' : 'bg-gray-200'
              )}
            >
              {BADGE_ICONS[badge.icon] || <Shield className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {language === 'en' ? badge.label : badge.labelBn}
                </p>
                {badge.verified && (
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-600 truncate">
                {language === 'en' ? badge.description : badge.descriptionBn}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Information */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          {language === 'en' ? 'Compliance & Security' : 'সম্মতি এবং নিরাপতা'}
        </h3>
        <div className="space-y-2">
          {/* PCI DSS */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'PCI DSS' : 'PCI DSS'}
            </span>
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                security.compliance.pciDss.compliant
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              )}
            >
              {security.compliance.pciDss.compliant
                ? (language === 'en' ? 'Compliant' : 'সম্মত')
                : (language === 'en' ? 'Non-compliant' : 'অ-সম্মত')}
            </span>
          </div>

          {/* GDPR */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'GDPR' : 'GDPR'}
            </span>
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                security.compliance.gdpr.compliant
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              )}
            >
              {security.compliance.gdpr.compliant
                ? (language === 'en' ? 'Compliant' : 'সম্মত')
                : (language === 'en' ? 'Non-compliant' : 'অ-সম্মত')}
            </span>
          </div>

          {/* Data Protection */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Data Protection' : 'তথ্য সুরক্ষা'}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded',
                  security.compliance.dataProtection.compliant
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                )}
              >
                {security.compliance.dataProtection.compliant
                  ? (language === 'en' ? 'Protected' : 'সুরক্ষিত')
                  : (language === 'en' ? 'Not Protected' : 'সুরক্ষিত নয়')}
              </span>
              <span className="text-xs text-gray-600">
                {security.compliance.dataProtection.encryptionLevel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Warnings */}
      {showWarnings && activeWarnings.length > 0 && (
        <div className="mt-4 space-y-2">
          {activeWarnings.map((warning, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border',
                getSeverityColorClass(warning.severity)
              )}
              role="alert"
              aria-live="polite"
            >
              <div className="flex-shrink-0 mt-0.5">
                {WARNING_ICONS[warning.type] || <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {language === 'en' ? warning.message : warning.messageBn}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(warning.timestamp).toLocaleString()}
                </p>
              </div>
              {warning.dismissible && (
                <button
                  type="button"
                  onClick={() => handleWarningDismiss(warning)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={language === 'en' ? 'Dismiss warning' : 'সতর্কতা বাতিল'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SSL Certificate Info */}
      {security.sslCertificate.valid && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                {language === 'en' ? 'SSL Certificate' : 'SSL সার্টিফিকেট'}
              </p>
              <div className="mt-2 space-y-1 text-xs text-blue-800">
                <div className="flex items-center justify-between">
                  <span>{language === 'en' ? 'Issuer:' : 'ইস্যুয়ার:'}</span>
                  <span className="font-medium">{security.sslCertificate.issuer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{language === 'en' ? 'Expires:' : 'মেয়াদ শেষ:'}</span>
                  <span className="font-medium">
                    {new Date(security.sslCertificate.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutSecurityBadge;
