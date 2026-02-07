'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface UtilityBarProps {
  language: 'en' | 'bn';
  onLanguageChange: (lang: 'en' | 'bn') => void;
  className?: string;
}

const UtilityBar: React.FC<UtilityBarProps> = ({
  language,
  onLanguageChange,
  className
}) => {
  const utilityLinks = [
    {
      href: '/help',
      label: language === 'bn' ? 'সাহায্য কেন্দ্র' : 'Help Center',
    },
    {
      href: '/contact',
      label: language === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us',
    },
    {
      href: '/track-order',
      label: language === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order',
    },
  ];

  return (
    <div className={cn('h-8 bg-gray-100 border-b border-gray-200', className)}>
      <div className="max-w-[98rem] mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left: Utility Links */}
          <div className="hidden md:flex items-center space-x-6">
            {utilityLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs text-gray-600 hover:text-primary-blue transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 rounded"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right: Language Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">
              {language === 'bn' ? 'ভাষা:' : 'Language:'}
            </span>
            <button
              onClick={() => onLanguageChange('en')}
              aria-label="Switch to English"
              aria-pressed={language === 'en'}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2',
                language === 'en'
                  ? 'bg-primary-blue text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-200'
              )}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('bn')}
              aria-label="Switch to Bengali"
              aria-pressed={language === 'bn'}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2',
                language === 'bn'
                  ? 'bg-primary-blue text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-200'
              )}
            >
              বাংলা
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtilityBar;
