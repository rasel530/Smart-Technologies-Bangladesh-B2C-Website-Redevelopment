'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  language?: 'en' | 'bn';
  className?: string;
}

type StrengthLevel = 'weak' | 'medium' | 'strong';

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  language = 'en',
  className = '',
}) => {
  const calculateStrength = (pwd: string): StrengthLevel => {
    let score = 0;

    // Length check
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1;

    // Determine level
    if (score < 3) return 'weak';
    if (score < 5) return 'medium';
    return 'strong';
  };

  const strength = calculateStrength(password);

  const getStrengthColor = (level: StrengthLevel): string => {
    switch (level) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
    }
  };

  const getStrengthText = (level: StrengthLevel): string => {
    if (language === 'bn') {
      switch (level) {
        case 'weak':
          return 'দুর্বল';
        case 'medium':
          return 'মাঝারি';
        case 'strong':
          return 'শক্তিশালী';
      }
    }
    switch (level) {
      case 'weak':
        return 'Weak';
      case 'medium':
        return 'Medium';
      case 'strong':
        return 'Strong';
    }
  };

  const getStrengthPercentage = (level: StrengthLevel): number => {
    switch (level) {
      case 'weak':
        return 33;
      case 'medium':
        return 66;
      case 'strong':
        return 100;
    }
  };

  const getFeedback = (level: StrengthLevel): string => {
    if (language === 'bn') {
      switch (level) {
        case 'weak':
          return 'পাসওয়ার্ড আরও শক্তিশালী হওয়া উচিত';
        case 'medium':
          return 'পাসওয়ার্ডটি ভালো, কিন্তু আরও উন্নত করা যেতে পারে';
        case 'strong':
          return 'পাসওয়ার্ডটি শক্তিশালী!';
      }
    }
    switch (level) {
      case 'weak':
        return 'Password should be stronger';
      case 'medium':
        return 'Password is good, but could be stronger';
      case 'strong':
        return 'Password is strong!';
    }
  };

  if (!password) {
    return null;
  }

  const percentage = getStrengthPercentage(strength);
  const color = getStrengthColor(strength);
  const text = getStrengthText(strength);
  const feedback = getFeedback(strength);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {language === 'bn' ? 'পাসওয়ার্ড শক্তি' : 'Password Strength'}
        </span>
        <span
          className={cn(
            'text-sm font-medium',
            strength === 'weak' && 'text-red-600',
            strength === 'medium' && 'text-yellow-600',
            strength === 'strong' && 'text-green-600'
          )}
        >
          {text}
        </span>
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            color
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${text}`}
        />
      </div>

      <p
        className={cn(
          'text-xs',
          strength === 'weak' && 'text-red-600',
          strength === 'medium' && 'text-yellow-600',
          strength === 'strong' && 'text-green-600'
        )}
      >
        {feedback}
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;
