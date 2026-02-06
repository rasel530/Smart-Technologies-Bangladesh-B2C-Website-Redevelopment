'use client';

/**
 * ViewToggle Component
 *
 * Toggle component for switching between grid and list views.
 * Features:
 * - Grid and list view icons
 * - Active state indication
 * - Accessible button controls
 * - Responsive design
 */

import { Grid3X3, List } from 'lucide-react';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

/**
 * ViewToggle Component
 *
 * @param {ViewToggleProps} props - Component props
 * @returns {JSX.Element} View toggle component
 */
export function ViewToggle({
  viewMode,
  onViewModeChange,
  className = ''
}: ViewToggleProps) {
  return (
    <div className={`flex items-center bg-gray-100 rounded-lg p-1 ${className}`}>
      {/* Grid View Button */}
      <button
        onClick={() => onViewModeChange('grid')}
        className={`
          p-2 rounded-md transition-all duration-200
          ${viewMode === 'grid'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          }
        `}
        aria-label="Grid view"
        aria-pressed={viewMode === 'grid'}
      >
        <Grid3X3 className="w-5 h-5" />
      </button>

      {/* List View Button */}
      <button
        onClick={() => onViewModeChange('list')}
        className={`
          p-2 rounded-md transition-all duration-200
          ${viewMode === 'list'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          }
        `}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
      >
        <List className="w-5 h-5" />
      </button>
    </div>
  );
}

export default ViewToggle;
