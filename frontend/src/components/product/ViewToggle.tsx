/**
 * ViewToggle Component
 * 
 * A toggle component for switching between grid and list view modes.
 * Features include:
 * - Grid and list view toggle buttons
 * - Visual icons for each view
 * - localStorage persistence for view preference
 * - Smooth transition between views
 * 
 * @component
 */

'use client';

import React, { useState, useEffect } from 'react';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

/**
 * ViewToggle Component
 * 
 * @param {ViewToggleProps} props - Component props
 * @returns {JSX.Element} View toggle component
 */
export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  className = ''
}) => {
  // Load view preference from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem('smart_tech_product_view_mode') as ViewMode;
    if (savedView && (savedView === 'grid' || savedView === 'list')) {
      onViewChange(savedView);
    }
  }, [onViewChange]);

  // Handle view change
  const handleViewChange = (view: ViewMode) => {
    onViewChange(view);
    localStorage.setItem('smart_tech_product_view_mode', view);
  };

  return (
    <div className={`inline-flex items-center bg-gray-100 rounded-lg p-1 ${className}`}>
      {/* Grid View Button */}
      <button
        onClick={() => handleViewChange('grid')}
        className={`
          relative inline-flex items-center justify-center p-2 rounded-md
          transition-all duration-200
          ${currentView === 'grid'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
          }
        `}
        aria-label="Grid view"
        aria-pressed={currentView === 'grid'}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>

      {/* List View Button */}
      <button
        onClick={() => handleViewChange('list')}
        className={`
          relative inline-flex items-center justify-center p-2 rounded-md
          transition-all duration-200
          ${currentView === 'list'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
          }
        `}
        aria-label="List view"
        aria-pressed={currentView === 'list'}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  );
};

export default ViewToggle;
