/**
 * Mobile Cart Service
 * Service for handling mobile-specific cart features like offline sync, analytics, and optimization
 */

import type {
  OfflineCartChange,
  OfflineChangePayload,
  AnalyticsPayload,
  DeviceInfo,
  NetworkStatus,
  MobileCartOptimized,
  CompressedCartData,
  OfflineSyncResult
} from '../types/mobileCart';

const OFFLINE_CHANGES_KEY = 'offline_cart_changes';
const DEVICE_INFO_KEY = 'device_info';
const MAX_OFFLINE_CHANGES = 100;

class MobileCartService {
  private deviceId: string;
  private networkStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    type: 'unknown',
    speed: 'unknown'
  };

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.initializeNetworkListeners();
    this.initializeOnlineStatus();
  }

  /**
   * Get or create a unique device ID
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Generate a unique device ID
   */
  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize network status listeners
   */
  private initializeNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.networkStatus.isOnline = true;
      this.updateNetworkInfo();
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.networkStatus.isOnline = false;
    });

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => this.updateNetworkInfo());
    }
  }

  /**
   * Initialize online status
   */
  private initializeOnlineStatus(): void {
    this.updateNetworkInfo();
  }

  /**
   * Update network information
   */
  private updateNetworkInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.networkStatus = {
        isOnline: navigator.onLine,
        type: connection.effectiveType || 'unknown',
        speed: this.getNetworkSpeed(connection.downlink),
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
  }

  /**
   * Get network speed category
   */
  private getNetworkSpeed(downlink?: number): 'fast' | 'medium' | 'slow' {
    if (!downlink) return 'unknown';
    if (downlink >= 2) return 'fast';
    if (downlink >= 0.5) return 'medium';
    return 'slow';
  }

  /**
   * Record offline change locally
   */
  async recordOfflineChange(action: string, data: any): Promise<void> {
    try {
      const change: OfflineCartChange = {
        id: this.generateChangeId(),
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
        deviceId: this.deviceId,
        action: action as any,
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity,
        previousValue: data.previousValue,
        newValue: data.newValue,
        isSynced: false,
        syncedAt: null,
        failedAttempts: 0,
        errorMessage: null,
        createdAt: new Date()
      };

      const changes = this.getOfflineChanges();
      changes.push(change);

      // Limit the number of stored changes
      if (changes.length > MAX_OFFLINE_CHANGES) {
        changes.splice(0, changes.length - MAX_OFFLINE_CHANGES);
      }

      localStorage.setItem(OFFLINE_CHANGES_KEY, JSON.stringify(changes));
    } catch (error) {
      console.error('Error recording offline change:', error);
    }
  }

  /**
   * Generate a unique change ID
   */
  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get offline changes from localStorage
   */
  getOfflineChanges(): OfflineCartChange[] {
    try {
      const changesJson = localStorage.getItem(OFFLINE_CHANGES_KEY);
      return changesJson ? JSON.parse(changesJson) : [];
    } catch (error) {
      console.error('Error getting offline changes:', error);
      return [];
    }
  }

  /**
   * Sync pending offline changes when online
   */
  async syncPendingChanges(): Promise<OfflineSyncResult> {
    if (!this.networkStatus.isOnline) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        total: 0,
        errors: []
      };
    }

    const changes = this.getOfflineChanges();
    const pendingChanges = changes.filter(c => !c.isSynced);

    if (pendingChanges.length === 0) {
      return {
        success: true,
        synced: 0,
        failed: 0,
        total: 0,
        errors: []
      };
    }

    try {
      // Import API client dynamically to avoid circular dependency
      const { mobileCartApi } = await import('../lib/api/mobileCart');
      const result = await mobileCartApi.syncOfflineChanges(
        this.getUserId(),
        this.getSessionId(),
        this.deviceId
      );

      // Update synced changes in localStorage
      if (result.success) {
        const updatedChanges = changes.map(c => ({
          ...c,
          isSynced: true,
          syncedAt: new Date()
        }));

        localStorage.setItem(OFFLINE_CHANGES_KEY, JSON.stringify(updatedChanges));
      }

      return result;
    } catch (error) {
      console.error('Error syncing offline changes:', error);
      return {
        success: false,
        synced: 0,
        failed: pendingChanges.length,
        total: pendingChanges.length,
        errors: pendingChanges.map(c => ({
          changeId: c.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      };
    }
  }

  /**
   * Record mobile analytics
   */
  async recordMobileAnalytics(event: AnalyticsPayload): Promise<void> {
    try {
      const analyticsData = {
        ...event,
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
        deviceId: this.deviceId
      };

      // Import API client dynamically
      const { mobileCartApi } = await import('../lib/api/mobileCart');
      await mobileCartApi.recordMobileAnalytics(analyticsData);
    } catch (error) {
      console.error('Error recording mobile analytics:', error);
    }
  }

  /**
   * Optimize cart data for mobile
   */
  async optimizeCartForMobile(cart: any): Promise<MobileCartOptimized> {
    try {
      // Import API client dynamically
      const { mobileCartApi } = await import('../lib/api/mobileCart');
      return await mobileCartApi.optimizeCartForMobile(cart.id);
    } catch (error) {
      console.error('Error optimizing cart for mobile:', error);
      return cart; // Return original cart if optimization fails
    }
  }

  /**
   * Compress cart data for mobile transmission
   */
  compressCartData(cart: any): CompressedCartData {
    return {
      i: cart.id,
      s: cart.subtotal || 0,
      t: cart.tax || 0,
      sc: cart.shippingCost || 0,
      d: cart.discount || 0,
      tot: cart.total || 0,
      ic: cart.itemCount || 0,
      tic: cart.totalItems || 0,
      items: (cart.items || []).map((item: any) => ({
        i: item.id,
        p: item.productId,
        v: item.variantId,
        n: item.product?.name || item.productName,
        q: item.quantity,
        pr: item.price,
        st: item.subtotal,
        img: item.product?.images?.[0]?.thumbnailUrl || item.image
      }))
    };
  }

  /**
   * Detect network status
   */
  detectNetworkStatus(): NetworkStatus {
    this.updateNetworkInfo();
    return this.networkStatus;
  }

  /**
   * Detect device type
   */
  detectDeviceType(): DeviceInfo {
    const userAgent = navigator.userAgent;
    let platform: 'mobile' | 'desktop' | 'tablet' = 'desktop';
    let deviceType: string = 'unknown';
    let browser: string = 'unknown';

    // Detect platform
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      platform = 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      platform = 'tablet';
    }

    // Detect device type
    if (/android/i.test(userAgent)) {
      deviceType = 'android';
    } else if (/iphone|ipad|ios/i.test(userAgent)) {
      deviceType = 'ios';
    } else if (/windows/i.test(userAgent)) {
      deviceType = 'windows';
    } else if (/mac/i.test(userAgent)) {
      deviceType = 'mac';
    } else if (/linux/i.test(userAgent)) {
      deviceType = 'linux';
    }

    // Detect browser
    if (/chrome/i.test(userAgent)) {
      browser = 'chrome';
    } else if (/firefox/i.test(userAgent)) {
      browser = 'firefox';
    } else if (/safari/i.test(userAgent)) {
      browser = 'safari';
    } else if (/edge/i.test(userAgent)) {
      browser = 'edge';
    }

    const deviceInfo: DeviceInfo = {
      deviceId: this.deviceId,
      platform,
      deviceType,
      browser,
      networkType: this.networkStatus.type,
      networkSpeed: this.networkStatus.speed,
      screenResolution: this.getScreenResolution(),
      userAgent
    };

    // Cache device info
    localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(deviceInfo));

    return deviceInfo;
  }

  /**
   * Get screen resolution
   */
  private getScreenResolution(): string {
    return `${window.screen.width}x${window.screen.height}`;
  }

  /**
   * Get user ID from localStorage
   */
  private getUserId(): string | null {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        return user.id || null;
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return null;
  }

  /**
   * Get session ID from localStorage
   */
  private getSessionId(): string | null {
    try {
      return localStorage.getItem('session_id') || null;
    } catch (error) {
      console.error('Error getting session ID:', error);
      return null;
    }
  }

  /**
   * Clear offline changes
   */
  clearOfflineChanges(): void {
    localStorage.removeItem(OFFLINE_CHANGES_KEY);
  }

  /**
   * Get device info from cache
   */
  getCachedDeviceInfo(): DeviceInfo | null {
    try {
      const deviceInfoJson = localStorage.getItem(DEVICE_INFO_KEY);
      return deviceInfoJson ? JSON.parse(deviceInfoJson) : null;
    } catch (error) {
      console.error('Error getting cached device info:', error);
      return null;
    }
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.networkStatus.isOnline;
  }

  /**
   * Get current device ID
   */
  getDeviceId(): string {
    return this.deviceId;
  }
}

// Export singleton instance
export const mobileCartService = new MobileCartService();
export default mobileCartService;
