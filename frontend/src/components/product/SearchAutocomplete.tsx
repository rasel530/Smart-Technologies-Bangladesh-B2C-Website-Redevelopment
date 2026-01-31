/**
 * Search Autocomplete Component
 * 
 * Features:
 * - Real-time search suggestions
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Click to select
 * - Debounced search
 * - Product and category suggestions
 * - Search history
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { searchSuggestions } from '@/lib/api/search';

interface Suggestion {
  id: string;
  nameEn: string;
  nameBn?: string;
  slug: string;
  thumbnail?: string;
  categoryId?: string;
  categoryNameEn?: string;
  categoryNameBn?: string;
}

interface SearchAutocompleteProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  maxSuggestions?: number;
  minQueryLength?: number;
}

export function SearchAutocomplete({
  onSearch,
  placeholder = 'Search products...',
  className = '',
  autoFocus = false,
  maxSuggestions = 8,
  minQueryLength = 2
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('smart_tech_search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut to focus search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minQueryLength) {
      setSuggestions([]);
      setTotalProducts(0);
      return;
    }

    setIsLoading(true);
    try {
      const response = await searchSuggestions(searchQuery, maxSuggestions);
      setSuggestions(response.suggestions);
      setTotalProducts(response.suggestions.length);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setTotalProducts(0);
    } finally {
      setIsLoading(false);
    }
  }, [maxSuggestions, minQueryLength]);

  // Debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length >= minQueryLength) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(value);
        setIsOpen(true);
      }, 200);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  // Add to search history
  const addToHistory = (searchQuery: string) => {
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('smart_tech_search_history', JSON.stringify(newHistory));
  };

  // Handle search submission
  const handleSearch = (searchQuery?: string) => {
    const q = searchQuery || query;
    if (q.trim()) {
      addToHistory(q.trim());
      onSearch?.(q.trim());
      setIsOpen(false);
      setQuery('');
      setSuggestions([]);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + (searchHistory.length > 0 && query.length < minQueryLength ? searchHistory.length : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            const suggestion = suggestions[selectedIndex];
            handleSearch(suggestion.nameEn);
            // Navigate to product
            window.location.href = `/products/${suggestion.slug}`;
          } else {
            const historyIndex = selectedIndex - suggestions.length;
            const historyItem = searchHistory[historyIndex];
            handleSearch(historyItem);
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Clear search history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('smart_tech_search_history');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= minQueryLength && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full px-4 py-3 pl-12 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="search-suggestions"
        />
        
        {/* Search Icon */}
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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

        {/* Clear Button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Search Button */}
        <button
          onClick={() => handleSearch()}
          className="absolute right-0 top-0 h-full px-4 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
          aria-label="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div
          id="search-suggestions"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
              Searching...
            </div>
          )}

          {/* Product Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </p>
              {suggestions.map((suggestion, index) => (
                <Link
                  key={suggestion.id}
                  href={`/products/${suggestion.slug}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => addToHistory(suggestion.nameEn)}
                >
                  {suggestion.thumbnail && (
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <Image
                        src={suggestion.thumbnail}
                        alt={suggestion.nameEn}
                        fill
                        className="object-cover rounded"
                        sizes="40px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.nameEn}
                    </p>
                    {suggestion.categoryNameEn && (
                      <p className="text-xs text-gray-500">
                        in {suggestion.categoryNameEn}
                      </p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}

          {/* Search History */}
          {!isLoading && query.length < minQueryLength && searchHistory.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recent Searches
                </p>
                <button
                  onClick={clearHistory}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear
                </button>
              </div>
              {searchHistory.slice(0, 5).map((historyItem, index) => {
                const absoluteIndex = suggestions.length + index;
                return (
                  <button
                    key={historyItem}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      absoluteIndex === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setQuery(historyItem);
                      handleSearch(historyItem);
                    }}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">{historyItem}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length >= minQueryLength && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>No products found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          )}

          {/* View All Results */}
          {query.length >= minQueryLength && suggestions.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <button
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  suggestions.length === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSearch()}
              >
                <span className="text-sm font-medium text-blue-600">
                  View all results for "{query}"
                </span>
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchAutocomplete;
