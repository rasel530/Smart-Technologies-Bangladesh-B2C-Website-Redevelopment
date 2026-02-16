/**
 * useStableSearchParams Hook
 *
 * Provides stable references for URL search parameters to prevent infinite loops.
 * This hook wraps Next.js useSearchParams with memoization to ensure
 * parameter references don't change on every render.
 */

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

interface StableSearchParams {
  categoryParams: string[];
  brandParams: string[];
  minPrice: string | null;
  maxPrice: string | null;
  rating: string | null;
  sort: string | null;
  view: string | null;
  page: string;
}

/**
 * Custom hook to provide stable search parameter references
 * Prevents infinite loops by memoizing the entire result object
 * Only re-calculates when searchParams actually changes
 */
export function useStableSearchParams(): StableSearchParams {
  const searchParams = useSearchParams();

  // Memoize the entire result object based on searchParams
  // This ensures stable references for all parameters
  return useMemo(() => {
    const categoryParams = searchParams.getAll('category');
    const brandParams = searchParams.getAll('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const rating = searchParams.get('rating');
    const sort = searchParams.get('sort');
    const view = searchParams.get('view');
    const page = searchParams.get('page') || '1';

    return {
      categoryParams,
      brandParams,
      minPrice,
      maxPrice,
      rating,
      sort,
      view,
      page,
    };
  }, [searchParams]);
}
