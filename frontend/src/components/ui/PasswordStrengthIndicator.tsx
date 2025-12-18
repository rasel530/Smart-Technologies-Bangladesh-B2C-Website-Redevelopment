import React from 'react';
import { PasswordStrength } from '@/types/auth';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  language?: 'en' | 'bn';
  className?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  language = 'en',
  className
}) => {
  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'weak':
        return 'bg-red-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'good':
        return 'bg-blue-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStrengthText = (level: string) => {
    if (language === 'bn') {
      switch (level) {
        case 'weak':
          return 'দুর্বল';
        case 'fair':
          return 'মাঝারি';
        case 'good':
          return 'ভালো';
        case 'strong':
          return 'শক্তিশালী';
        default:
          return '';
      }
    }

    switch (level) {
      case 'weak':
        return 'Weak';
      case 'fair':
        return 'Fair';
      case 'good':
        return 'Good';
      case 'strong':
        return 'Strong';
      default:
        return '';
    }
  };

  const getStrengthDescription = (strength: PasswordStrength) => {
    if (language === 'bn') {
      return strength.feedbackBn.length > 0 ? strength.feedbackBn[0] : '';
    }
    return strength.feedback.length > 0 ? strength.feedback[0] : '';
  };

  if (!password) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-secondary-700">
            {language === 'bn' ? 'পাসওয়ার্ড শক্তি' : 'Password Strength'}
          </span>
          <span className="text-sm text-secondary-500">
            {language === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Enter password'}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full w-0 bg-gray-300 rounded-full transition-all duration-300" />
        </div>
      </div>
    );
  }

  // Calculate password strength
  const length = password.length;
  let strength: PasswordStrength = {
    score: 0,
    level: 'weak',
    feedback: [],
    feedbackBn: []
  };

  // Length check
  if (length >= 8) strength.score += 1;
  if (length >= 12) strength.score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) strength.score += 1;
  if (/[A-Z]/.test(password)) strength.score += 1;
  if (/\d/.test(password)) strength.score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength.score += 1;

  // Common patterns penalty
  if (/(.)\1{2,}/.test(password)) strength.score -= 1;
  if (/123|abc|qwe|password/i.test(password)) strength.score -= 1;

  // Determine level and feedback
  if (strength.score < 2) {
    strength.level = 'weak';
    strength.feedback = language === 'bn' 
      ? ['পাসওয়ার্ড অন্তত ৮ অক্ষরের হওয়া উচিত']
      : ['Password should be at least 8 characters long'];
    strength.feedbackBn = ['পাসওয়ার্ড অন্তত ৮ অক্ষরের হওয়া উচিত'];
  } else if (strength.score < 4) {
    strength.level = 'fair';
    strength.feedback = language === 'bn'
      ? ['আরও বেশি অক্ষরের ধরন অন্তর্ভুক্ত করুন']
      : ['Include more character variety'];
    strength.feedbackBn = ['আরও বেশি অক্ষরের ধরন অন্তর্ভুক্ত করুন'];
  } else if (strength.score < 6) {
    strength.level = 'good';
    strength.feedback = language === 'bn'
      ? ['পাসওয়ার্ডটি ভালো']
      : ['Password is good'];
    strength.feedbackBn = ['পাসওয়ার্ডটি ভালো'];
  } else {
    strength.level = 'strong';
    strength.feedback = language === 'bn'
      ? ['পাসওয়ার্ডটি শক্তিশালী']
      : ['Password is strong'];
    strength.feedbackBn = ['পাসওয়ার্ডটি শক্তিশালী'];
  }

  const percentage = Math.min((strength.score / 6) * 100, 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-secondary-700">
          {language === 'bn' ? 'পাসওয়ার্ড শক্তি' : 'Password Strength'}
        </span>
        <span className={cn(
          'text-sm font-medium',
          strength.level === 'weak' && 'text-red-600',
          strength.level === 'fair' && 'text-yellow-600',
          strength.level === 'good' && 'text-blue-600',
          strength.level === 'strong' && 'text-green-600'
        )}>
          {getStrengthText(strength.level)}
        </span>
      </div>
      
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn(
            'h-full rounded-full transition-all duration-300',
            getStrengthColor(strength.level)
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${getStrengthText(strength.level)}`}
        />
      </div>

      {strength.feedback.length > 0 && (
        <div className="mt-2">
          <p className={cn(
            'text-xs',
            strength.level === 'weak' && 'text-red-600',
            strength.level === 'fair' && 'text-yellow-600',
            strength.level === 'good' && 'text-blue-600',
            strength.level === 'strong' && 'text-green-600'
          )}>
            {getStrengthDescription(strength)}
          </p>
        </div>
      )}

      <div className="mt-3 space-y-1">
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-4 h-4 rounded flex items-center justify-center',
            length >= 8 ? 'bg-green-500' : 'bg-gray-300'
          )}>
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 00-1.414 1.414L8 12.586l7.293-7.293a1 1 0 00-1.414 1.414l-8 8a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs text-secondary-600">
            {language === 'bn' ? '৮+ অক্ষর' : '8+ characters'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-4 h-4 rounded flex items-center justify-center',
            /[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'
          )}>
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 00-1.414 1.414L8 12.586l7.293-7.293a1 1 0 00-1.414 1.414l-8 8a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs text-secondary-600">
            {language === 'bn' ? 'ছোট হাতর' : 'Lowercase'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-4 h-4 rounded flex items-center justify-center',
            /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'
          )}>
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 00-1.414 1.414L8 12.586l7.293-7.293a1 1 0 00-1.414 1.414l-8 8a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs text-secondary-600">
            {language === 'bn' ? 'বড় হাতর' : 'Uppercase'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-4 h-4 rounded flex items-center justify-center',
            /\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'
          )}>
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 00-1.414 1.414L8 12.586l7.293-7.293a1 1 0 00-1.414 1.414l-8 8a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs text-secondary-600">
            {language === 'bn' ? 'সংখ্যা' : 'Numbers'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-4 h-4 rounded flex items-center justify-center',
            /[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'bg-green-500' : 'bg-gray-300'
          )}>
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 00-1.414 1.414L8 12.586l7.293-7.293a1 1 0 00-1.414 1.414l-8 8a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs text-secondary-600">
            {language === 'bn' ? 'বিশেষ অক্ষর' : 'Special chars'}
          </span>
        </div>
      </div>
    </div>
  );
};

export { PasswordStrengthIndicator };