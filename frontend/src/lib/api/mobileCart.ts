/**
 * Mobile Cart API Client
 * API client for mobile cart optimization features
 */

import type {
  OfflineCartChange,
  OfflineSyncResult,
  MobileAnalyticsData,
  MobilePerformanceMetrics,
  MobileCartOptimized,
  DeviceBreakdown,
  NetworkBreakdown,
  MobileCartApiResponse
} from '../../types/mobileCart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Mobile Cart API Client
 */
export const mobileCartApi = {
  /**
   * Record offline cart change
   */
  async recordOfflineChange(changeData: any): Promise<MobileCartApiResponse<OfflineCartChange>> {
    try {
      const response = await fetch(`${API_BASE_URL}/mobile/offline-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.getSessionId()
        },
        credentials: 'include',
        body: JSON.stringify(changeData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error recording offline change:', error);
      throw error;
    }
  },

  /**
   * Sync offline changes
   */
  async syncOfflineChanges(
    userId: string | null,
    sessionId: string | null,
    deviceId: string
  ): Promise<OfflineSyncResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/mobile/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId || ''
        },
        credentials: 'include',
        body: JSON.stringify({ deviceId })
      });

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error syncing offline changes:', error);
      throw error;
    }
  },

  /**
   * Get pending offline changes
   */
  async getPendingChanges(
    userId: string | null,
    sessionId: string | null,
    deviceId: string
  ): Promise<MobileCartApiResponse<OfflineCartChange[]>> {
    try {
      const params = new URLSearchParams();
      if (deviceId) params.append('deviceId', deviceId);

      const response = await fetch(`${API_BASE_URL}/mobile/pending-changes?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId || ''
        },
        credentials: 'include'
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting pending changes:', error);
      throw error;
    }
  },

  /**
   * Record mobile analytics
   */
  async recordMobileAnalytics(analyticsData: any): Promise<MobileCartApiResponse<MobileAnalyticsData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/mobile/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.getSessionId()
        },
        credentials: 'include',
        body: JSON.stringify(analyticsData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error recording mobile analytics:', error);
      throw error;
    }
  },

  /**
   * Get mobile analytics with filters
   */
  async getMobileAnalytics(filters: any): Promise<MobileCartApiResponse<MobileAnalyticsData[]>> {
    try {
      const params = new URLSearchParams();
      if (filters.sessionId) params.append('sessionId', filters.sessionId);
      if (filters.deviceId) params.append('deviceId', filters.deviceId);
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${API_BASE_URL}/mobile/analytics?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        credentials: 'include'
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting mobile analytics:', error);
      throw error;
    }
  },

  /**
   * Get mobile performance metrics
   */
  async getMobilePerformanceMetrics(): Promise<MobileCartApiResponse<MobilePerformanceMetrics>> {
    try {
      const response = await fetch(`${API_BASE_URL}/mobile/performance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        credentials: 'include'
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting mobile performance metrics:', error);
      throw error;
    }
  },

  /**
   * Get optimized cart for mobile
   */
  async optimizeCartForMobile(cartId: string): Promise<MobileCartApiResponse<MobileCartOptimized>> {
    try {
      const response = await fetch(`${API_BASE_URL}/mobile/optimized-cart/${cartId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.getSessionId()
        },
        credentials: 'include'
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting optimized cart:', error);
      throw error;
    }
  },

  /**
   * Record device info
   */
  async recordDeviceInfo(deviceInfo: any): Promise<MobileCartApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/mobile/device-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.getSessionId()
        },
        credentials: 'include',
        body: JSON.stringify(deviceInfo)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error recording device info:', error);
      throw error;
    }
  },

  /**
   * Get session ID from localStorage
   */
  getSessionId(): string | null {
    try {
      return localStorage.getItem('session_id') || null;
    } catch (error) {
      console.error('Error getting session ID:', error);
      return null;
    }
  },

  /**
   * Get auth token from localStorage
   */
  getAuthToken(): string | null {
    try {
      const token = localStorage.getItem('token');
      return token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }
};

export default mobileCartApi;
