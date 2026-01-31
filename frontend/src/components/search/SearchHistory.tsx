'use client';

/**
 * SearchHistory Component
 *
 * Client component that displays recent searches from localStorage.
 * This component handles browser-only localStorage access, persists searches,
 * and renders the search history UI with clickable links to previous searches.
 */
import Link from 'next/link';
import { useState, useEffect } from 'react';

const SEARCH_HISTORY_KEY = 'smart_tech_search_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Save a search query to localStorage
 */
export function saveSearch(query: string): void {
  if (!query || query.trim().length === 0) {
    return;
  }

  try {
    const history = getSearchHistory();
    // Remove the query if it already exists (to move it to the top)
    const filteredHistory = history.filter(item => item !== query);
    // Add the new query at the beginning
    const newHistory = [query, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (e) {
    console.error('Error saving search history to localStorage:', e);
  }
}

/**
 * Get search history from localStorage
 */
function getSearchHistory(): string[] {
  try {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error reading search history from localStorage:', e);
    return [];
  }
}

/**
 * Clear all search history from localStorage
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (e) {
    console.error('Error clearing search history from localStorage:', e);
  }
}

export function SearchHistory() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    // Load search history from localStorage on client-side only
    setSearchHistory(getSearchHistory());
  }, []);

  // Don't render anything if there's no search history
  if (searchHistory.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Recent Searches</h2>
        <button
          onClick={() => {
            clearSearchHistory();
            setSearchHistory([]);
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searchHistory.slice(0, 5).map((search, index) => (
          <Link
            key={index}
            href={`/search?q=${encodeURIComponent(search)}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {search}
          </Link>
        ))}
      </div>
    </div>
  );
}
