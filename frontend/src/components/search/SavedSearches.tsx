'use client';

/**
 * SavedSearches Component
 *
 * Client component that allows users to save and manage their favorite searches.
 * Features include:
 * - Save current search with filters
 * - Display saved searches
 * - Quick access to saved searches
 * - Delete saved searches
 * - Rename saved searches
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const SAVED_SEARCHES_KEY = 'smart_tech_saved_searches';
const MAX_SAVED_SEARCHES = 20;

export interface SavedSearchItem {
  id: string;
  name: string;
  query: string;
  filters: {
    categories?: string[];
    brands?: string[];
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    sort?: string;
  };
  createdAt: string;
}

/**
 * Save a search to localStorage
 */
export function saveSearch(savedSearch: Omit<SavedSearchItem, 'id' | 'createdAt'>): string {
  const savedSearches = getSavedSearches();
  
  const newSavedSearch: SavedSearchItem = {
    ...savedSearch,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  
  // Add new saved search at the beginning
  const updatedSearches = [newSavedSearch, ...savedSearches].slice(0, MAX_SAVED_SEARCHES);
  
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSearches));
    return newSavedSearch.id;
  } catch (e) {
    console.error('Error saving search to localStorage:', e);
    return '';
  }
}

/**
 * Get saved searches from localStorage
 */
export function getSavedSearches(): SavedSearchItem[] {
  try {
    const saved = localStorage.getItem(SAVED_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error reading saved searches from localStorage:', e);
    return [];
  }
}

/**
 * Delete a saved search by ID
 */
export function deleteSavedSearch(id: string): void {
  const savedSearches = getSavedSearches();
  const updatedSearches = savedSearches.filter(search => search.id !== id);
  
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSearches));
  } catch (e) {
    console.error('Error deleting saved search:', e);
  }
}

/**
 * Update a saved search
 */
export function updateSavedSearch(id: string, updates: Partial<SavedSearchItem>): void {
  const savedSearches = getSavedSearches();
  const updatedSearches = savedSearches.map(search =>
    search.id === id ? { ...search, ...updates } : search
  );
  
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSearches));
  } catch (e) {
    console.error('Error updating saved search:', e);
  }
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Build search URL from saved search
 */
function buildSearchUrl(savedSearch: SavedSearchItem): string {
  const params = new URLSearchParams();
  
  if (savedSearch.query) {
    params.set('q', savedSearch.query);
  }
  
  if (savedSearch.filters.categories && savedSearch.filters.categories.length > 0) {
    savedSearch.filters.categories.forEach(cat => params.append('category', cat));
  }
  
  if (savedSearch.filters.brands && savedSearch.filters.brands.length > 0) {
    savedSearch.filters.brands.forEach(brand => params.append('brand', brand));
  }
  
  if (savedSearch.filters.minPrice !== undefined) {
    params.set('minPrice', String(savedSearch.filters.minPrice));
  }
  
  if (savedSearch.filters.maxPrice !== undefined) {
    params.set('maxPrice', String(savedSearch.filters.maxPrice));
  }
  
  if (savedSearch.filters.rating !== undefined) {
    params.set('rating', String(savedSearch.filters.rating));
  }
  
  if (savedSearch.filters.sort) {
    params.set('sort', savedSearch.filters.sort);
  }
  
  return `/search?${params.toString()}`;
}

interface SavedSearchesProps {
  showSaveButton?: boolean;
  currentQuery?: string;
  currentFilters?: SavedSearchItem['filters'];
}

export function SavedSearchesComponent({ 
  showSaveButton = false, 
  currentQuery = '',
  currentFilters = {} 
}: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const searchParams = useSearchParams();
  
  // Load saved searches on mount
  useEffect(() => {
    setSavedSearches(getSavedSearches());
  }, []);
  
  // Handle saving current search
  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      return;
    }
    
    const newSavedSearch: Omit<SavedSearch, 'id' | 'createdAt'> = {
      name: searchName.trim(),
      query: currentQuery || (searchParams.get('q') || ''),
      filters: currentFilters || {
        categories: searchParams.getAll('category'),
        brands: searchParams.getAll('brand'),
        minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
        maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
        rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined,
        sort: searchParams.get('sort') || undefined,
      },
    };
    
    saveSearch(newSavedSearch);
    setSavedSearches(getSavedSearches());
    setSearchName('');
    setShowSaveDialog(false);
    setIsSaving(false);
  };
  
  // Handle deleting a saved search
  const handleDeleteSearch = (id: string) => {
    if (window.confirm('Are you sure you want to delete this saved search?')) {
      deleteSavedSearch(id);
      setSavedSearches(getSavedSearches());
    }
  };
  
  // Handle editing a saved search name
  const handleEditName = (id: string) => {
    const search = savedSearches.find(s => s.id === id);
    if (search) {
      setEditingId(id);
      setEditName(search.name);
    }
  };
  
  // Handle saving the edited name
  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      updateSavedSearch(editingId, { name: editName.trim() });
      setSavedSearches(getSavedSearches());
      setEditingId(null);
      setEditName('');
    }
  };
  
  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };
  
  return (
    <div className="space-y-6">
      {/* Save Current Search Button */}
      {showSaveButton && (currentQuery || searchParams.get('q')) && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setIsSaving(true);
              setShowSaveDialog(true);
              setSearchName(currentQuery || (searchParams.get('q') || ''));
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Save This Search
          </button>
        </div>
      )}
      
      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Save Search
            </h3>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Enter a name for this search"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSearchName('');
                  setIsSaving(false);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!searchName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Saved Searches List */}
      {savedSearches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Saved Searches</h2>
            <span className="text-sm text-gray-500">
              {savedSearches.length} saved
            </span>
          </div>
          <div className="space-y-2">
            {savedSearches.map((savedSearch) => (
              <div
                key={savedSearch.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  {editingId === savedSearch.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit();
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <Link
                      href={buildSearchUrl(savedSearch)}
                      className="block"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span className="font-medium text-gray-900 truncate">
                          {savedSearch.name}
                        </span>
                      </div>
                      {savedSearch.query && (
                        <p className="text-sm text-gray-500 truncate mt-1 ml-6">
                          {savedSearch.query}
                        </p>
                      )}
                      {(savedSearch.filters.categories?.length || 
                       savedSearch.filters.brands?.length || 
                       savedSearch.filters.minPrice !== undefined ||
                       savedSearch.filters.maxPrice !== undefined) && (
                        <div className="flex items-center gap-2 mt-1 ml-6">
                          {savedSearch.filters.categories?.length && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              {savedSearch.filters.categories.length} categories
                            </span>
                          )}
                          {savedSearch.filters.brands?.length && (
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                              {savedSearch.filters.brands.length} brands
                            </span>
                          )}
                          {(savedSearch.filters.minPrice !== undefined || savedSearch.filters.maxPrice !== undefined) && (
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                              {savedSearch.filters.minPrice !== undefined ? `৳${savedSearch.filters.minPrice}` : '৳0'}
                              {' - '}
                              {savedSearch.filters.maxPrice !== undefined ? `৳${savedSearch.filters.maxPrice}` : '∞'}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleEditName(savedSearch.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Rename"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteSearch(savedSearch.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {savedSearches.length === 0 && !showSaveButton && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-gray-600">No saved searches yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Save your favorite searches for quick access
          </p>
        </div>
      )}
    </div>
  );
}

// Export component with a default name
export default SavedSearchesComponent;
