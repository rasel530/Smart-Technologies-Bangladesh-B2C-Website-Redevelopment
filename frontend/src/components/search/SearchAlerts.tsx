'use client';

/**
 * SearchAlerts Component
 *
 * Client component that allows users to set up alerts for specific searches.
 * When new products match their search criteria, users will be notified.
 * Features include:
 * - Create search alerts with filters
 * - Manage existing alerts
 * - Enable/disable alerts
 * - Delete alerts
 * - View alert history
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const SEARCH_ALERTS_KEY = 'smart_tech_search_alerts';
const MAX_ALERTS = 10;

export interface SearchAlert {
  id: string;
  name: string;
  query: string;
  filters: {
    categories?: string[];
    brands?: string[];
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
  };
  enabled: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

/**
 * Save a search alert to localStorage
 */
export function saveSearchAlert(alert: Omit<SearchAlert, 'id' | 'createdAt' | 'triggerCount'>): string {
  const alerts = getSearchAlerts();
  
  const newAlert: SearchAlert = {
    ...alert,
    id: generateId(),
    createdAt: new Date().toISOString(),
    triggerCount: 0,
  };
  
  // Add new alert at beginning
  const updatedAlerts = [newAlert, ...alerts].slice(0, MAX_ALERTS);
  
  try {
    localStorage.setItem(SEARCH_ALERTS_KEY, JSON.stringify(updatedAlerts));
    return newAlert.id;
  } catch (e) {
    console.error('Error saving search alert to localStorage:', e);
    return '';
  }
}

/**
 * Get search alerts from localStorage
 */
export function getSearchAlerts(): SearchAlert[] {
  try {
    const saved = localStorage.getItem(SEARCH_ALERTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error reading search alerts from localStorage:', e);
    return [];
  }
}

/**
 * Delete a search alert by ID
 */
export function deleteSearchAlert(id: string): void {
  const alerts = getSearchAlerts();
  const updatedAlerts = alerts.filter(alert => alert.id !== id);
  
  try {
    localStorage.setItem(SEARCH_ALERTS_KEY, JSON.stringify(updatedAlerts));
  } catch (e) {
    console.error('Error deleting search alert:', e);
  }
}

/**
 * Toggle alert enabled state
 */
export function toggleSearchAlert(id: string): void {
  const alerts = getSearchAlerts();
  const updatedAlerts = alerts.map(alert =>
    alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
  );
  
  try {
    localStorage.setItem(SEARCH_ALERTS_KEY, JSON.stringify(updatedAlerts));
  } catch (e) {
    console.error('Error toggling search alert:', e);
  }
}

/**
 * Update search alert
 */
export function updateSearchAlert(id: string, updates: Partial<SearchAlert>): void {
  const alerts = getSearchAlerts();
  const updatedAlerts = alerts.map(alert =>
    alert.id === id ? { ...alert, ...updates } : alert
  );
  
  try {
    localStorage.setItem(SEARCH_ALERTS_KEY, JSON.stringify(updatedAlerts));
  } catch (e) {
    console.error('Error updating search alert:', e);
  }
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

interface SearchAlertsProps {
  showCreateButton?: boolean;
  currentQuery?: string;
  currentFilters?: SearchAlert['filters'];
}

export function SearchAlerts({ 
  showCreateButton = false, 
  currentQuery = '',
  currentFilters = {} 
}: SearchAlertsProps) {
  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [frequency, setFrequency] = useState<SearchAlert['frequency']>('daily');
  const searchParams = useSearchParams();
  
  // Load alerts on mount
  useEffect(() => {
    setAlerts(getSearchAlerts());
  }, []);
  
  // Handle creating a new alert
  const handleCreateAlert = () => {
    if (!alertName.trim()) {
      return;
    }
    
    const newAlert: Omit<SearchAlert, 'id' | 'createdAt' | 'triggerCount'> = {
      name: alertName.trim(),
      query: currentQuery || (searchParams.get('q') || ''),
      filters: currentFilters || {
        categories: searchParams.getAll('category'),
        brands: searchParams.getAll('brand'),
        minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
        maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
        rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined,
      },
      enabled: true,
      frequency,
    };
    
    saveSearchAlert(newAlert);
    setAlerts(getSearchAlerts());
    setAlertName('');
    setFrequency('daily');
    setShowCreateDialog(false);
  };
  
  // Handle deleting an alert
  const handleDeleteAlert = (id: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      deleteSearchAlert(id);
      setAlerts(getSearchAlerts());
    }
  };
  
  // Handle toggling alert
  const handleToggleAlert = (id: string) => {
    toggleSearchAlert(id);
    setAlerts(getSearchAlerts());
  };
  
  // Calculate active alerts count
  const activeAlertsCount = alerts.filter(alert => alert.enabled).length;
  
  return (
    <div className="space-y-6">
      {/* Create Alert Button */}
      {showCreateButton && (currentQuery || searchParams.get('q')) && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setShowCreateDialog(true);
              setAlertName(currentQuery || (searchParams.get('q') || ''));
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Create Alert
          </button>
        </div>
      )}
      
      {/* Create Alert Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create Search Alert
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Name
                </label>
                <input
                  type="text"
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                  placeholder="Enter a name for this alert"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notification Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as SearchAlert['frequency'])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="instant">Instant (as soon as products match)</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly digest</option>
                </select>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Alert Criteria:</strong>
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  Query: "{currentQuery || searchParams.get('q') || 'All products'}"
                </p>
                {currentFilters?.categories?.length && (
                  <p className="text-sm text-blue-800">
                    Categories: {currentFilters.categories.length} selected
                  </p>
                )}
                {currentFilters?.brands?.length && (
                  <p className="text-sm text-blue-800">
                    Brands: {currentFilters.brands.length} selected
                  </p>
                )}
                {(currentFilters?.minPrice !== undefined || currentFilters?.maxPrice !== undefined) && (
                  <p className="text-sm text-blue-800">
                    Price: ৳{currentFilters.minPrice || 0} - ৳{currentFilters.maxPrice || '∞'}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setAlertName('');
                  setFrequency('daily');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlert}
                disabled={!alertName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Alerts List */}
      {alerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Search Alerts</h2>
            <span className="text-sm text-gray-500">
              {activeAlertsCount} of {alerts.length} active
            </span>
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-4 bg-white border rounded-lg transition-colors ${
                  alert.enabled ? 'border-gray-200' : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className={`w-5 h-5 flex-shrink-0 ${
                      alert.enabled ? 'text-green-500' : 'text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <h3 className="font-medium text-gray-900 truncate">
                      {alert.name}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      alert.enabled 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {alert.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  
                  {alert.query && (
                    <p className="text-sm text-gray-600 truncate mb-1">
                      Query: "{alert.query}"
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="capitalize">
                      {alert.frequency}
                    </span>
                    <span>
                      Created: {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                    {alert.triggerCount > 0 && (
                      <span className="text-blue-600">
                        Triggered {alert.triggerCount} time{alert.triggerCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  {(alert.filters.categories?.length || 
                   alert.filters.brands?.length || 
                   alert.filters.minPrice !== undefined ||
                   alert.filters.maxPrice !== undefined) && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {alert.filters.categories?.length && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {alert.filters.categories.length} categories
                        </span>
                      )}
                      {alert.filters.brands?.length && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                          {alert.filters.brands.length} brands
                        </span>
                      )}
                      {(alert.filters.minPrice !== undefined || alert.filters.maxPrice !== undefined) && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                          {alert.filters.minPrice !== undefined ? `৳${alert.filters.minPrice}` : '৳0'}
                          {' - '}
                          {alert.filters.maxPrice !== undefined ? `৳${alert.filters.maxPrice}` : '∞'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleToggleAlert(alert.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      alert.enabled 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={alert.enabled ? 'Pause alert' : 'Enable alert'}
                  >
                    {alert.enabled ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete alert"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      {alerts.length === 0 && !showCreateButton && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-gray-600">No search alerts set up</p>
          <p className="text-sm text-gray-500 mt-1">
            Get notified when new products match your search
          </p>
        </div>
      )}
    </div>
  );
}

// Export component with a default name
export default SearchAlerts;
