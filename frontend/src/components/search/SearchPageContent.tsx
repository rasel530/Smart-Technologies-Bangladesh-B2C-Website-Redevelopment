'use client';

/**
 * SearchPageContent Component
 *
 * Client component that handles saving searches to localStorage
 * when users perform a search on the search page.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveSearch } from './SearchHistory';

interface SearchPageContentProps {
  children: React.ReactNode;
}

export function SearchPageContent({ children }: SearchPageContentProps) {
  const searchParams = useSearchParams();
  const query = typeof searchParams.get('q') === 'string' ? searchParams.get('q') : '';

  useEffect(() => {
    // Save the search query to localStorage when it changes
    if (query && query.trim().length > 0) {
      saveSearch(query);
    }
  }, [query]);

  return <>{children}</>;
}
