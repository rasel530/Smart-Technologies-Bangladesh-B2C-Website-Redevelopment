/**
 * ProductSpecifications Component
 * 
 * A specifications display component for products.
 * Features include grouped specifications, expandable sections, and responsive design.
 * 
 * @component
 */

'use client';

import React, { useState } from 'react';
import { ProductSpecification } from '@/types/product';

interface ProductSpecificationsProps {
  specifications: ProductSpecification[];
  className?: string;
}

/**
 * Group specifications by prefix (e.g., "Weight", "Dimensions", "Material")
 */
const groupSpecifications = (specs: ProductSpecification[]): Record<string, ProductSpecification[]> => {
  const groups: Record<string, ProductSpecification[]> = {};
  
  specs.forEach((spec) => {
    // Extract group from name (e.g., "Weight: 5kg" -> "Weight")
    const groupName = spec.name.split(':')[0] || 'General';
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(spec);
  });
  
  return groups;
};

/**
 * ProductSpecifications Component
 * 
 * @param {ProductSpecificationsProps} props - Component props
 * @returns {JSX.Element} Product specifications component
 */
export const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({
  specifications,
  className = ''
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const groupedSpecs = groupSpecifications(specifications);
  const groupNames = Object.keys(groupedSpecs);
  const hasMultipleGroups = groupNames.length > 1;

  // Toggle group expansion
  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // If no specifications, show message
  if (specifications.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-2 text-sm">No specifications available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Specifications</h2>
      
      {hasMultipleGroups ? (
        // Grouped Specifications with Expand/Collapse
        <div className="space-y-3">
          {groupNames.map((groupName) => {
            const specs = groupedSpecs[groupName];
            const isExpanded = expandedGroups.has(groupName);
            
            return (
              <div
                key={groupName}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-expanded={isExpanded}
                >
                  <h3 className="font-medium text-gray-900">{groupName}</h3>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
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
                
                {/* Group Content */}
                {isExpanded && (
                  <div className="p-4">
                    <table className="w-full text-sm">
                      <tbody>
                        {specs.map((spec) => (
                          <tr key={spec.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 pr-4 text-gray-600 font-medium">
                              {spec.name}
                            </td>
                            <td className="py-2 text-gray-900">
                              {spec.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Single Group - Simple Table
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {specifications.map((spec) => (
                <tr key={spec.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4 bg-gray-50 text-gray-600 font-medium">
                    {spec.name}
                  </td>
                  <td className="py-3 px-4 text-gray-900">
                    {spec.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductSpecifications;
