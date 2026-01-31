/**
 * Infinite Scroll Component
 * 
 * Loads more items when the user scrolls to the bottom.
 * Features:
 * - Intersection Observer for detecting scroll position
 * - Configurable threshold
 * - Loading state indicator
 * - Error handling
 * - End of results detection
 */

'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface InfiniteScrollProps {
  children?: ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  error?: string | null;
  onLoadMore: () => void;
  threshold?: number;
  className?: string;
  loader?: ReactNode;
  endMessage?: ReactNode;
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  error,
  onLoadMore,
  threshold = 200,
  className = '',
  loader,
  endMessage
}: InfiniteScrollProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset intersection state when loading
  useEffect(() => {
    if (!isLoading) {
      setIsIntersecting(false);
    }
  }, [isLoading]);

  // Set up intersection observer
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;

      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore && !isLoading) {
            setIsIntersecting(true);
            onLoadMore();
          }
        },
        {
          rootMargin: `${threshold}px`,
        }
      );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [hasMore, isLoading, onLoadMore, threshold]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className={className}>
      {children}

      {/* Load more trigger element */}
      <div ref={lastElementRef} className="h-4" />

      {/* Loading indicator */}
      {isLoading && (
        <div className="py-4">
          {loader || (
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Loading more...</span>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="py-4 text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={() => onLoadMore()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* End of results message */}
      {!hasMore && !isLoading && endMessage && (
        <div className="py-4 text-center text-gray-500">
          {endMessage}
        </div>
      )}
    </div>
  );
}

/**
 * Hook version of infinite scroll for more flexibility
 */
export function useInfiniteScroll<T extends HTMLElement>(
  hasMore: boolean,
  isLoading: boolean,
  onLoadMore: () => Promise<void>,
  threshold: number = 200
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: T) => {
      if (isLoading) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore && !isLoading) {
            setIsIntersecting(true);
            onLoadMore();
          }
        },
        {
          rootMargin: `${threshold}px`,
        }
      );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [hasMore, isLoading, onLoadMore, threshold]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return lastElementRef;
}

export default InfiniteScroll;
