/**
 * Cart Analytics API Client
 *
 * Provides methods for interacting with the cart analytics API endpoints.
 * Used by both frontend and admin panel for analytics tracking and reporting.
 */

import { apiClient } from './client';

// Types for cart analytics
export interface CartEvent {
  id: string;
  cartId: string;
  userId?: string;
  eventType: 'add' | 'remove' | 'update' | 'view' | 'checkout_initiated' | 'checkout_completed';
  productId?: string;
  quantity?: number;
  price?: number;
  timestamp: string;
}

export interface CartEventFilters {
  cartId?: string;
  userId?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AbandonmentMetrics {
  totalCarts: number;
  abandonedCarts: number;
  convertedCarts: number;
  activeCarts: number;
  abandonmentRate: number;
  trend: {
    date: string;
    created: number;
    abandoned: number;
    converted: number;
    abandonmentRate: number;
  }[];
  topAbandonmentReasons: {
    reason: string;
    count: number;
  }[];
}

export interface ConversionFunnel {
  funnel: {
    views: number;
    adds: number;
    checkoutInitiated: number;
    checkoutCompleted: number;
  };
  uniqueCounts: {
    totalCarts: number;
    cartsWithItems: number;
    convertedCarts: number;
  };
  conversionRates: {
    viewToAdd: number;
    addToCheckout: number;
    checkoutToOrder: number;
    overallConversion: number;
  };
  dropOffPoints: {
    stage: string;
    dropOffRate: number;
  }[];
}

export interface AverageCartValue {
  convertedCarts: {
    count: number;
    averageOrderValue: number;
    medianOrderValue: number;
    p95OrderValue: number;
    averageItemsPerCart: number;
  };
  activeCarts: {
    count: number;
    averageCartValue: number;
    averageItemsPerCart: number;
  };
  overall: {
    averageCartValue: number;
    totalCarts: number;
  };
}

export interface PopularProduct {
  productId: string;
  productName: string;
  productNameEn?: string;
  productSlug: string;
  thumbnailUrl?: string;
  totalQuantity: number;
  timesAdded: number;
  totalValue: number;
}

export interface OptimizationRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestions: string[];
  metrics?: Record<string, number>;
  affectedProducts?: {
    productId: string;
    productName: string;
    stockQuantity: number;
  }[];
}

export interface RealtimeAnalytics {
  timestamp: string;
  activeCartsNow: number;
  eventsLastHour: number;
  checkoutsToday: number;
  totalCartsToday: number;
  currentConversionRate: number;
  recentEvents: CartEvent[];
}

export interface TrendData {
  date: string;
  newCarts: number;
  events: number;
  adds: number;
  checkouts: number;
  conversions: number;
}

export interface DashboardData {
  summary: {
    totalCarts: number;
    activeCarts: number;
    abandonedCarts: number;
    convertedCarts: number;
    abandonmentRate: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  abandonment: AbandonmentMetrics;
  conversionFunnel: ConversionFunnel;
  averageCartValue: AverageCartValue;
  realtime: RealtimeAnalytics;
  trends: TrendData[];
  topProducts: PopularProduct[];
  recentAbandonedCarts: {
    id: string;
    userId?: string;
    total: number;
    status: string;
    updatedAt: string;
    items: {
      id: string;
      product: {
        name: string;
        nameEn: string;
      };
    }[];
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }[];
  recommendations: {
    generatedAt: string;
    totalRecommendations: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    recommendations: OptimizationRecommendation[];
  };
}

export interface PaginatedCartEvents {
  events: CartEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Track a cart event (for frontend use)
export const trackCartEvent = async (
  cartId: string,
  eventType: 'view' | 'add' | 'remove' | 'checkout_initiated',
  data?: {
    productId?: string;
    quantity?: number;
    price?: number;
    userId?: string;
  }
): Promise<{ success: boolean; data?: CartEvent }> => {
  try {
    const response = await apiClient.post<{ success: boolean; data: CartEvent }>(
      '/analytics/cart/event',
      {
        cartId,
        eventType,
        ...data
      }
    );
    return response;
  } catch (error) {
    console.error('[Cart Analytics API] Error tracking event:', error);
    // Don't throw error to prevent disrupting main flow
    return { success: false };
  }
};

// Track add to cart
export const trackAddToCart = async (
  cartId: string,
  productId: string,
  quantity: number,
  price: number,
  userId?: string
): Promise<{ success: boolean }> => {
  return trackCartEvent(cartId, 'add', { productId, quantity, price, userId });
};

// Track remove from cart
export const trackRemoveFromCart = async (
  cartId: string,
  productId: string,
  quantity: number,
  userId?: string
): Promise<{ success: boolean }> => {
  return trackCartEvent(cartId, 'remove', { productId, quantity, userId });
};

// Track cart view
export const trackCartView = async (
  cartId: string,
  userId?: string
): Promise<{ success: boolean }> => {
  return trackCartEvent(cartId, 'view', { userId });
};

// Track checkout initiated
export const trackCheckoutInitiated = async (
  cartId: string,
  userId?: string
): Promise<{ success: boolean }> => {
  return trackCartEvent(cartId, 'checkout_initiated', { userId });
};

// Record abandonment reason
export const recordAbandonmentReason = async (
  cartId: string,
  reason: string
): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.post<{ success: boolean }>(
      '/analytics/cart/abandonment-reason',
      { cartId, reason }
    );
    return response;
  } catch (error) {
    console.error('[Cart Analytics API] Error recording abandonment reason:', error);
    return { success: false };
  }
};

// Admin: Get cart events with filters
export const getCartEvents = async (
  filters: CartEventFilters = {}
): Promise<PaginatedCartEvents> => {
  try {
    const params = new URLSearchParams();
    if (filters.cartId) params.append('cartId', filters.cartId);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.eventType) params.append('eventType', filters.eventType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<PaginatedCartEvents>(
      `/analytics/cart/events?${params.toString()}`
    );
    return response;
  } catch (error) {
    console.error('[Cart Analytics API] Error getting cart events:', error);
    throw error;
  }
};

// Admin: Get abandonment metrics
export const getAbandonmentMetrics = async (
  startDate?: string,
  endDate?: string
): Promise<AbandonmentMetrics> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<{ data: AbandonmentMetrics }>(
      `/analytics/cart/abandonment?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('[Cart Analytics API] Error getting abandonment metrics:', error);
    throw error;
  }
};

// Admin: Get conversion funnel
export const getConversionFunnel = async (
  startDate?: string,
  endDate?: string
): Promise<ConversionFunnel> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<{ data: ConversionFunnel }>(
      `/analytics/cart/conversion-funnel?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('[Cart Analytics API] Error getting conversion funnel:', error);
    throw error;
  }
};

// Admin: Get average cart value
export const getAverageCartValue = async (
  startDate?: string,
  endDate?: string
): Promise<AverageCartValue> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<{ data: AverageCartValue }>(
      `/analytics/cart/average-value?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('[Cart Analytics API] Error getting average cart value:', error);
    throw error;
  }
};

// Admin: Get popular products in carts
export const getPopularProductsInCarts = async (
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<PopularProduct[]> => {
  try {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<{ data: PopularProduct[] }>(
      `/analytics/cart/popular-products?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('[Cart Analytics API] Error getting popular products:', error);
    throw error;
  }
};

// Admin: Get optimization recommendations
export const getOptimizationRecommendations = async (): Promise<{
  generatedAt: string;
  totalRecommendations: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  recommendations: OptimizationRecommendation[];
}> => {
  try {
    const response = await apiClient.get<{
      data: {
        generatedAt: string;
        totalRecommendations: number;
        highPriority: number;
        mediumPriority: number;
        lowPriority: number;
        recommendations: OptimizationRecommendation[];
      };
    }>('/analytics/cart/recommendations');
    return response.data;
  } catch (error) {
    console.error('[Cart Analytics API] Error getting recommendations:', error);
    throw error;
  }
};

// Admin: Get trend data
export const getCartTrends = async (days: number = 30): Promise<TrendData[]> => {
  try {
    const response = await apiClient.get<{ data: TrendData[] }>(
      `/analytics/cart/trends?days=${days}`
    );
    return response.data;
  } catch (error) {
    console.error('[Cart Analytics API] Error getting cart trends:', error);
    throw error;
  }
};

// Admin: Get realtime analytics
export const getRealtimeAnalytics = async (): Promise<RealtimeAnalytics> => {
  try {
    const response = await apiClient.get<{ data: RealtimeAnalytics }>(
      '/analytics/cart/realtime'
    );
    return response.data;
  } catch (error) {
    console.error('[Cart Analytics API] Error getting realtime analytics:', error);
    throw error;
  }
};

// Admin: Get full dashboard data
export const getCartAnalyticsDashboard = async (): Promise<DashboardData> => {
  try {
    const response = await apiClient.get<{ data: DashboardData }>(
      '/analytics/cart/dashboard'
    );
    return response.data;
  } catch (error) {
    console.error('[Cart Analytics API] Error getting dashboard data:', error);
    throw error;
  }
};

// Admin: Get all cart analytics (comprehensive)
export const getCartAnalytics = async (filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  abandonment: AbandonmentMetrics;
  conversionFunnel: ConversionFunnel;
  averageCartValue: AverageCartValue;
  trends: TrendData[];
}> => {
  try {
    const [
      abandonment,
      conversionFunnel,
      averageCartValue,
      trends
    ] = await Promise.all([
      getAbandonmentMetrics(filters?.startDate, filters?.endDate),
      getConversionFunnel(filters?.startDate, filters?.endDate),
      getAverageCartValue(filters?.startDate, filters?.endDate),
      getCartTrends(30)
    ]);

    return {
      abandonment,
      conversionFunnel,
      averageCartValue,
      trends
    };
  } catch (error) {
    console.error('[Cart Analytics API] Error getting cart analytics:', error);
    throw error;
  }
};
