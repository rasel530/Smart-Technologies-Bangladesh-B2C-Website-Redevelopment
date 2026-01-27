/**
 * Pagination Component
 * 
 * A pagination component for navigating through paginated content.
 * Features include page numbers, prev/next buttons, first/last buttons, and page size selector.
 * 
 * @component
 */

'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showItemRange?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

/**
 * Pagination Component
 *
 * @param {PaginationProps} props - Component props
 * @returns {JSX.Element} Pagination component
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 48, 96],
  showPageSizeSelector = true,
  showItemRange = true,
  maxVisiblePages = 5,
  className = ''
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isJumpToPageOpen, setIsJumpToPageOpen] = useState(false);
  const [jumpToPageInput, setJumpToPageInput] = useState('');

  // Calculate visible page numbers
  const getVisiblePages = (): number[] => {
    const pages: number[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    // Always show first page
    if (currentPage > halfVisible + 1) {
      pages.push(1);
      if (currentPage > halfVisible + 2) {
        pages.push(-1); // Ellipsis
      }
    }

    // Calculate range around current page
    const startPage = Math.max(1, currentPage - halfVisible);
    const endPage = Math.min(totalPages, currentPage + halfVisible);

    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1) {
        pages.push(i);
      }
    }

    // Always show last page
    if (currentPage < totalPages - halfVisible) {
      if (currentPage < totalPages - halfVisible - 1) {
        pages.push(-1); // Ellipsis
      }
      if (totalPages !== 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  // Calculate item range
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      router.push(`/products?${params.toString()}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle jump to page
  const handleJumpToPage = () => {
    const page = parseInt(jumpToPageInput);
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page);
      setJumpToPageInput('');
      setIsJumpToPageOpen(false);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
  };

  // Handle jump to page input key press
  const handleJumpToPageKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Item Range */}
      {showItemRange && (
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{startItem}</span> to{' '}
          <span className="font-medium text-gray-900">{endItem}</span> of{' '}
          <span className="font-medium text-gray-900">{totalItems}</span> items
        </p>
      )}

      {/* Page Size Selector */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-600">
            Items per page:
          </label>
          <select
            id="pageSize"
            value={itemsPerPage}
            onChange={handlePageSizeChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* First Page Button */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="First page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Previous Page Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Previous page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center">
          {visiblePages.map((page, index) => (
            page === -1 ? (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-gray-500"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`
                  min-w-[40px] px-3 py-2 border rounded-lg font-medium
                  transition-colors
                  ${page === currentPage
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                `}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Mobile Page Display */}
        <div className="sm:hidden px-3 py-2 text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Next page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Last page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Jump to Page */}
        <div className="relative">
          <button
            onClick={() => setIsJumpToPageOpen(!isJumpToPageOpen)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Jump to page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {isJumpToPageOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
              <label htmlFor="jumpToPage" className="block text-sm font-medium text-gray-700 mb-2">
                Jump to page
              </label>
              <input
                id="jumpToPage"
                type="number"
                min="1"
                max={totalPages}
                value={jumpToPageInput}
                onChange={(e) => setJumpToPageInput(e.target.value)}
                onKeyPress={handleJumpToPageKeyPress}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
                placeholder={`1-${totalPages}`}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleJumpToPage}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Go
                </button>
                <button
                  onClick={() => {
                    setJumpToPageInput('');
                    setIsJumpToPageOpen(false);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pagination;
