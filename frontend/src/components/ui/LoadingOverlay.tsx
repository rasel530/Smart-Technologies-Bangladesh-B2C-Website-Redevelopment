'use client';

import React from 'react';

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * LoadingOverlay Component
 * 
 * A full-screen or contained loading overlay that prevents showing old content
 * during page transitions (logout, login, etc.).
 */
export default function LoadingOverlay({ message = 'Loading...', fullScreen = true }: LoadingOverlayProps) {
  return (
    <div
      className={`flex items-center justify-center bg-white z-50 ${
        fullScreen ? 'fixed inset-0' : 'absolute inset-0'
      }`}
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-primary-600"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-r-2 border-primary-400 absolute top-0 left-0" style={{ animationDelay: '0.15s' }}></div>
        </div>
        
        {/* Loading message */}
        {message && (
          <p className="text-gray-600 text-sm font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
