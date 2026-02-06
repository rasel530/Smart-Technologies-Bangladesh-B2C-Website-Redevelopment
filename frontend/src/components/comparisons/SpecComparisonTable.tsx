/**
 * Specification Comparison Table Component
 *
 * Table for comparing product specifications side-by-side.
 * Features grouped specifications, difference highlighting, and expandable sections.
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { ComparisonSpecificationData, ComparisonSpecDifference, ComparisonSpecItem } from '@/types/comparison';

interface SpecComparisonTableProps {
  specifications: ComparisonSpecificationData;
  productIds: string[];
  productNames: { [productId: string]: string };
  className?: string;
}

export function SpecComparisonTable({
  specifications,
  productIds,
  productNames,
  className = '',
}: SpecComparisonTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(Object.keys(specifications.grouped)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  // Get all groups or only those with differences
  const groupsToShow = showOnlyDifferences
    ? Object.entries(specifications.grouped).filter(([_, specs]) =>
        specs.some((spec) => {
          const values = spec.values.map((v) => v.value);
          return values.some((v, i) => values.some((other, j) => i !== j && v !== other));
        })
      )
    : Object.entries(specifications.grouped);

  // Check if a spec has differences
  const hasDifferences = (spec: ComparisonSpecItem | ComparisonSpecDifference): boolean => {
    const values = spec.values.map((v) => v.value);
    return values.some((v, i) => values.some((other, j) => i !== j && v !== other));
  };

  // Get cell class based on value comparison
  const getCellClass = (spec: ComparisonSpecItem | ComparisonSpecDifference, value: string, productId: string): string => {
    if (!hasDifferences(spec)) {
      return 'bg-gray-50';
    }

    const values = spec.values.map((v) => v.value);
    const valueData = spec.values.find((v) => v.productId === productId);

    // Check if this value is "better" (green) or "worse" (red) - only for ComparisonSpecDifference
    if ('better' in valueData && valueData.better) {
      return 'bg-green-50 text-green-800 font-semibold';
    }
    if ('better' in valueData && valueData.better === false) {
      return 'bg-red-50 text-red-800';
    }

    // Check if this value is unique (different from others)
    const isUnique = values.filter((v) => v === value).length === 1;
    if (isUnique) {
      return 'bg-yellow-50';
    }

    return 'bg-gray-50';
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Specifications Comparison</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showOnlyDifferences}
              onChange={(e) => setShowOnlyDifferences(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              aria-label="Show only differences"
            />
            Show only differences
          </label>
          <button
            onClick={expandAll}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                expandAll();
              }
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            aria-label="Expand all specification groups"
            tabIndex={0}
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                collapseAll();
              }
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            aria-label="Collapse all specification groups"
            tabIndex={0}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-r border-gray-200 min-w-[200px]">
                Specification
              </th>
              {productIds.map((productId) => (
                <th
                  key={productId}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200 min-w-[150px]"
                >
                  {productNames[productId] || `Product ${productId}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupsToShow.length === 0 ? (
              <tr>
                <td colSpan={productIds.length + 1} className="px-4 py-8 text-center text-gray-500">
                  {showOnlyDifferences
                    ? 'No differences found in specifications'
                    : 'No specifications available for comparison'}
                </td>
              </tr>
            ) : (
              groupsToShow.map(([groupName, specs]) => (
                <React.Fragment key={groupName}>
                  {/* Group Header */}
                  <tr className="bg-blue-50 hover:bg-blue-100 transition-colors">
                    <td
                      colSpan={productIds.length + 1}
                      className="px-4 py-3 font-semibold text-blue-900 cursor-pointer select-none"
                      onClick={() => toggleGroup(groupName)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={expandedGroups.has(groupName)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleGroup(groupName);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {expandedGroups.has(groupName) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span>{groupName}</span>
                        <span className="text-xs text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full">
                          {specs.length}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Group Specifications */}
                  {expandedGroups.has(groupName) &&
                    specs.map((spec, index) => (
                      <tr
                        key={`${groupName}-${spec.name}-${index}`}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="sticky left-0 z-10 px-4 py-3 text-sm text-gray-700 border-b border-r border-gray-200 bg-white">
                          {spec.name}
                        </td>
                        {productIds.map((productId) => {
                          const valueData = spec.values.find((v) => v.productId === productId);
                          const value = valueData?.value || '-';
                          const cellClass = getCellClass(spec, value, productId);

                          return (
                            <td
                              key={productId}
                              className={`px-4 py-3 text-sm text-gray-900 border-b border-gray-200 ${cellClass}`}
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-sm font-medium text-gray-700 mb-2">Legend:</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
            <span className="text-gray-600">Better value</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
            <span className="text-gray-600">Worse value</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
            <span className="text-gray-600">Unique value</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
            <span className="text-gray-600">Same value</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpecComparisonTable;
