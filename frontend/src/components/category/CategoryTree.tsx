/**
 * CategoryTree Component
 * 
 * A hierarchical category tree component with expandable/collapsible nodes.
 * Features include recursive tree structure, breadcrumb support, and active state highlighting.
 * 
 * @component
 */

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CategoryTree } from '@/types/category';

interface CategoryTreeProps {
  categories: CategoryTree[];
  activeCategoryId?: string;
  maxDepth?: number;
  showCounts?: boolean;
  className?: string;
}

interface TreeNodeProps {
  node: CategoryTree & { _count?: { products: number; subcategories: number } };
  activeCategoryId?: string;
  maxDepth?: number;
  currentDepth?: number;
  showCounts?: boolean;
}

/**
 * TreeNode Component (Recursive)
 */
const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  activeCategoryId,
  maxDepth = 3,
  currentDepth = 0,
  showCounts = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isActive = node.id === activeCategoryId;
  const isMaxDepth = currentDepth >= maxDepth;

  // Auto-expand if active category is in this subtree
  const isActiveInSubtree = useMemo(() => {
    if (!activeCategoryId) return false;
    
    const checkSubtree = (category: CategoryTree): boolean => {
      if (category.id === activeCategoryId) return true;
      if (category.children) {
        return category.children.some(child => checkSubtree(child));
      }
      return false;
    };
    
    return checkSubtree(node);
  }, [node, activeCategoryId]);

  // Auto-expand if active category is in subtree
  React.useEffect(() => {
    if (isActiveInSubtree) {
      setIsExpanded(true);
    }
  }, [isActiveInSubtree]);

  // Toggle expand/collapse
  const toggleExpand = () => {
    if (hasChildren && !isMaxDepth) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className="tree-node">
      {/* Node Header */}
      <div
        className={`
          flex items-center justify-between py-2 px-3 rounded-lg
          transition-colors cursor-pointer
          ${isActive
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'hover:bg-gray-50 text-gray-700'
          }
        `}
        onClick={toggleExpand}
      >
        <Link
          href={`/categories/${node.slug}`}
          className="flex items-center flex-1 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && !isMaxDepth && (
            <button
              className="mr-2 flex-shrink-0 focus:outline-none"
              onClick={(e) => {
                e.preventDefault();
                toggleExpand();
              }}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Category Name */}
          <span className="truncate">{node.name}</span>

          {/* Product Count */}
          {showCounts && node._count?.products !== undefined && (
            <span className="ml-2 text-xs text-gray-500 flex-shrink-0">
              ({node._count.products})
            </span>
          )}
        </Link>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && !isMaxDepth && (
        <div className="ml-4 pl-2 border-l border-gray-200">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeCategoryId={activeCategoryId}
              maxDepth={maxDepth}
              currentDepth={currentDepth + 1}
              showCounts={showCounts}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * CategoryTree Component
 * 
 * @param {CategoryTreeProps} props - Component props
 * @returns {JSX.Element} Category tree component
 */
export const CategoryTreeComponent: React.FC<CategoryTreeProps> = ({
  categories,
  activeCategoryId,
  maxDepth = 3,
  showCounts = true,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const filterTree = (nodes: CategoryTree[]): CategoryTree[] => {
      return nodes.reduce<CategoryTree[]>((acc, node) => {
        const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredChildren = node.children ? filterTree(node.children) : [];

        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children
          });
        }

        return acc;
      }, []);
    };

    return filterTree(categories);
  }, [categories, searchQuery]);

  // Expand all nodes
  const expandAll = () => {
    const getAllNodeIds = (nodes: CategoryTree[]): string[] => {
      let ids: string[] = [];
      nodes.forEach((node) => {
        ids.push(node.id);
        if (node.children) {
          ids = ids.concat(getAllNodeIds(node.children));
        }
      });
      return ids;
    };

    setExpandedNodes(new Set(getAllNodeIds(categories)));
  };

  // Collapse all nodes
  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label="Search categories"
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

      {/* Expand/Collapse All Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={expandAll}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Expand All
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={collapseAll}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Collapse All
        </button>
      </div>

      {/* Tree */}
      <div className="space-y-1">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <TreeNode
              key={category.id}
              node={category}
              activeCategoryId={activeCategoryId}
              maxDepth={maxDepth}
              currentDepth={0}
              showCounts={showCounts}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No categories found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryTreeComponent;
