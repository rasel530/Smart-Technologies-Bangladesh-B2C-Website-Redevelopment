/**
 * Mobile Cart Types
 * TypeScript interfaces for mobile cart optimization features
 */

/**
 * Offline cart change record
 */
export interface OfflineCartChange {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  deviceId: string;
  action: 'add' | 'update' | 'remove' | 'clear';
  productId?: string | null;
  variantId?: string | null;
  quantity?: number | null;
  previousValue?: any;
  newValue?: any;
  isSynced: boolean;
  syncedAt?: Date | null;
  failedAttempts: number;
  errorMessage?: string | null;
  createdAt: Date;
}

/**
 * Mobile analytics data record
 */
export interface MobileAnalyticsData {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  deviceId: string;
  platform: 'mobile' | 'desktop' | 'tablet';
  deviceType?: string | null;
  browser?: string | null;
  networkType?: string | null;
  networkSpeed?: string | null;
  screenResolution?: string | null;
  cartId?: string | null;
  action: 'view' | 'add' | 'update' | 'remove' | 'checkout' | 'abandon';
  productId?: string | null;
  paymentMethod?: string | null;
  emiPlanId?: string | null;
  duration?: number | null;
  pageCount?: number | null;
  touchCount?: number | null;
  scrollDepth?: number | null;
  metadata?: any;
  createdAt: Date;
}

/**
 * Mobile performance metrics
 */
export interface MobilePerformanceMetrics {
  totalEvents: number;
  platformBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  networkTypeBreakdown: Record<string, number>;
  actionBreakdown: Record<string, number>;
  averageMetrics: {
    duration: number;
    touchCount: number;
  };
  period: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Device information
 */
export interface DeviceInfo {
  deviceId: string;
  platform: 'mobile' | 'desktop' | 'tablet';
  deviceType?: string;
  browser?: string;
  networkType?: string;
  networkSpeed?: string;
  screenResolution?: string;
  userAgent?: string;
}

/**
 * Network status
 */
export interface NetworkStatus {
  isOnline: boolean;
  type?: 'wifi' | '4g' | '3g' | '2g' | 'unknown';
  speed?: 'fast' | 'medium' | 'slow' | 'unknown';
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/**
 * Mobile-optimized cart item
 */
export interface MobileCartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  productNameEn?: string;
  productNameBn?: string;
  quantity: number;
  price: number;
  subtotal: number;
  image?: string;
  variantName?: string;
  inStock: boolean;
}

/**
 * Mobile-optimized cart
 */
export interface MobileCartOptimized {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  items: MobileCartItem[];
  totals: {
    subtotal: number;
    tax: number;
    shippingCost: number;
    discount: number;
    total: number;
  };
  itemCount: number;
  totalItems: number;
  status: string;
  updatedAt: Date;
}

/**
 * Compressed cart data for transmission
 */
export interface CompressedCartData {
  i: string; // cart id
  s: number; // subtotal
  t: number; // tax
  sc: number; // shipping cost
  d: number; // discount
  tot: number; // total
  ic: number; // item count
  tic: number; // total items
  items: Array<{
    i: string; // item id
    p: string; // product id
    v?: string; // variant id
    n: string; // name
    q: number; // quantity
    pr: number; // price
    st: number; // subtotal
    img?: string; // image
  }>;
}

/**
 * Offline sync result
 */
export interface OfflineSyncResult {
  success: boolean;
  synced: number;
  failed: number;
  total: number;
  errors?: Array<{
    changeId: string;
    error: string;
  }>;
}

/**
 * Device breakdown statistics
 */
export interface DeviceBreakdown {
  platformBreakdown: Record<string, number>;
  deviceTypeBreakdown: Record<string, number>;
  networkBreakdown: Record<string, number>;
  totalEvents: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Network breakdown statistics
 */
export interface NetworkBreakdown {
  networkTypeBreakdown: Record<string, number>;
  networkSpeedBreakdown: Record<string, number>;
  totalEvents: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Touch gesture data
 */
export interface TouchGesture {
  type: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'tap' | 'long-press';
  target: string;
  itemId?: string;
  timestamp: number;
  coordinates?: {
    x: number;
    y: number;
  };
}

/**
 * Pull to refresh state
 */
export interface PullToRefreshState {
  isRefreshing: boolean;
  progress: number;
  lastRefreshTime?: Date;
}

/**
 * Mobile cart state
 */
export interface MobileCartState {
  isOptimized: boolean;
  isOffline: boolean;
  pendingChanges: OfflineCartChange[];
  deviceInfo: DeviceInfo;
  networkStatus: NetworkStatus;
  pullToRefresh: PullToRefreshState;
}

/**
 * Mobile cart filters
 */
export interface MobileCartFilters {
  userId?: string;
  sessionId?: string;
  deviceId?: string;
  platform?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * Offline change payload
 */
export interface OfflineChangePayload {
  deviceId: string;
  action: 'add' | 'update' | 'remove' | 'clear';
  productId?: string;
  variantId?: string;
  quantity?: number;
  previousValue?: any;
  newValue?: any;
}

/**
 * Analytics payload
 */
export interface AnalyticsPayload {
  deviceId: string;
  platform: 'mobile' | 'desktop' | 'tablet';
  action: 'view' | 'add' | 'update' | 'remove' | 'checkout' | 'abandon';
  deviceType?: string;
  browser?: string;
  networkType?: string;
  networkSpeed?: string;
  screenResolution?: string;
  cartId?: string;
  productId?: string;
  paymentMethod?: string;
  emiPlanId?: string;
  duration?: number;
  pageCount?: number;
  touchCount?: number;
  scrollDepth?: number;
  metadata?: any;
}

/**
 * Mobile cart API response
 */
export interface MobileCartApiResponse<T> {
  success: boolean;
  message: string;
  messageBn?: string;
  data?: T;
  count?: number;
  error?: string;
}
