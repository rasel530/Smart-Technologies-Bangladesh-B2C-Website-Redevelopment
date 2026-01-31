/**
 * SpecificationsDisplay Component
 * 
 * A component for displaying product specifications.
 * Features include:
 * - Table layout for specifications
 * - Group specifications by category
 * - Expandable sections for long spec lists
 * - Search/filter within specifications
 * - Compare specifications with other products
 * 
 * @component
 */

'use client';

import React, { useState } from 'react';
import { ProductSpecification } from '@/types/product';

interface SpecificationGroup {
  category: string;
  specifications: ProductSpecification[];
}

interface SpecificationsDisplayProps {
  specifications: ProductSpecification[];
  compareSpecifications?: ProductSpecification[];
  className?: string;
}

/**
 * SpecificationsDisplay Component
 * 
 * @param {SpecificationsDisplayProps} props - Component props
 * @returns {JSX.Element} Specifications display component
 */
export const SpecificationsDisplay: React.FC<SpecificationsDisplayProps> = ({
  specifications,
  compareSpecifications = [],
  className = ''
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));
  const [searchQuery, setSearchQuery] = useState('');

  // Group specifications by category (using name as category prefix)
  const groupSpecifications = (specs: ProductSpecification[]): SpecificationGroup[] => {
    const groups: Record<string, ProductSpecification[]> = {};
    
    specs.forEach(spec => {
      // Extract category from name (format: "Category: Value" or just name)
      const parts = spec.name.split(':');
      const category = parts.length > 1 ? parts[0].trim() : 'General';
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(spec);
    });

    return Object.entries(groups).map(([category, specs]) => ({
      category,
      specifications: specs.sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  };

  // Filter specifications by search query
  const filterSpecifications = (specs: ProductSpecification[]): ProductSpecification[] => {
    if (!searchQuery) return specs;
    
    const query = searchQuery.toLowerCase();
    return specs.filter(spec =>
      spec.name.toLowerCase().includes(query) ||
      spec.value.toLowerCase().includes(query)
    );
  };

  const groupedSpecs = groupSpecifications(specifications);
  const filteredSpecs = filterSpecifications(specifications);

  // Toggle group expansion
  const toggleGroup = (category: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Check if specification differs in comparison
  const isDifferent = (spec: ProductSpecification): boolean => {
    const compareSpec = compareSpecifications.find(cs => cs.name === spec.name);
    if (!compareSpec) return false;
    return compareSpec.value !== spec.value;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Specifications</h2>
        <p className="text-sm text-gray-600 mt-1">
          {specifications.length} specifications found
        </p>
      </div>

      {/* Search */}
      {specifications.length > 10 && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specifications..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search specifications"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Specifications Table */}
      <div className="divide-y divide-gray-200">
        {searchQuery ? (
          // Show filtered results as flat list
          <table className="w-full">
            <tbody>
              {filteredSpecs.map((spec) => (
                <tr
                  key={spec.id}
                  className={`
                    hover:bg-gray-50 transition-colors
                    ${isDifferent(spec) ? 'bg-yellow-50' : ''}
                  `}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 w-1/3">
                    {spec.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {spec.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          // Show grouped specifications
          groupedSpecs.map((group) => {
            const isExpanded = expandedGroups.has('all') || expandedGroups.has(group.category);
            const groupSpecs = filterSpecifications(group.specifications);
            
            if (groupSpecs.length === 0) return null;

            return (
              <div key={group.category}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.category)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <span className="font-medium text-gray-900">{group.category}</span>
                  <span className="text-sm text-gray-500">
                    ({groupSpecs.length})
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Group Specifications */}
                {isExpanded && (
                  <table className="w-full">
                    <tbody>
                      {groupSpecs.map((spec) => (
                        <tr
                          key={spec.id}
                          className={`
                            hover:bg-gray-50 transition-colors
                            ${isDifferent(spec) ? 'bg-yellow-50' : ''}
                          `}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 w-1/3 border-l-4 border-transparent">
                            {spec.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Comparison Legend */}
      {compareSpecifications.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Comparison Legend</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded" />
              <span className="text-gray-700">Different from compared product</span>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredSpecs.length === 0 && searchQuery && (
        <div className="p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            No specifications found matching "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
};

export default SpecificationsDisplay;
