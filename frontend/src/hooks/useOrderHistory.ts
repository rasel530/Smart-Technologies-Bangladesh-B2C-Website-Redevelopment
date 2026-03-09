/**
 * useOrderHistory Hook
 * 
 * Custom hook for order history operations including fetching order history,
 * order details, and order tracking information.
 */

import { useState, useCallback, useEffect } from 'react';
import orderManagementApi, {
  OrderHistoryFilters,
  OrderHistoryResponse,
  Order,
  TrackingTimeline,
} from '@/lib/api/orderManagement';

interface UseOrderHistoryReturn {
  // Order history data
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  
  // Order details
  orderDetails: Order | null;
  
  // Order tracking
  orderTracking: TrackingTimeline | null;
  
  // Loading states
  isLoadingHistory: boolean;
  isLoadingDetails: boolean;
  isLoadingTracking: boolean;
  
  // Error states
  historyError: string | null;
  detailsError: string | null;
  trackingError: string | null;
  
  // Functions
  getOrderHistory: (filters?: OrderHistoryFilters) => Promise<void>;
  getOrderDetails: (orderId: string) => Promise<void>;
  getOrderTracking: (orderId: string) => Promise<void>;
  refreshOrderHistory: () => Promise<void>;
  clearErrors: () => void;
}

export const useOrderHistory = (autoLoad = false, filters?: OrderHistoryFilters): UseOrderHistoryReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<UseOrderHistoryReturn['pagination']>(null);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [orderTracking, setOrderTracking] = useState<TrackingTimeline | null>(null);
  
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setHistoryError(null);
    setDetailsError(null);
    setTrackingError(null);
  }, []);

  const getOrderHistory = useCallback(async (filters?: OrderHistoryFilters) => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    
    try {
      const response = await orderManagementApi.getOrderHistory(filters);
      // Ensure orders is always an array, even if response.data is undefined or not an array
      const ordersData = Array.isArray(response?.data) ? response.data : [];
      setOrders(ordersData);
      setPagination(response?.pagination || null);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to fetch order history';
      setHistoryError(errorMsg);
      console.error('Failed to fetch order history:', err);
      // Ensure orders is always an array even on error
      setOrders([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const getOrderDetails = useCallback(async (orderId: string) => {
    setIsLoadingDetails(true);
    setDetailsError(null);
    
    try {
      const details = await orderManagementApi.getOrderDetails(orderId);
      setOrderDetails(details);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to fetch order details';
      setDetailsError(errorMsg);
      console.error('Failed to fetch order details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  const getOrderTracking = useCallback(async (orderId: string) => {
    setIsLoadingTracking(true);
    setTrackingError(null);
    
    try {
      const tracking = await orderManagementApi.getOrderTracking(orderId);
      setOrderTracking(tracking);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to fetch order tracking';
      setTrackingError(errorMsg);
      console.error('Failed to fetch order tracking:', err);
    } finally {
      setIsLoadingTracking(false);
    }
  }, []);

  const refreshOrderHistory = useCallback(async () => {
    await getOrderHistory(filters);
  }, [getOrderHistory, filters]);

  // Auto-load order history on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      getOrderHistory(filters);
    }
  }, [autoLoad, getOrderHistory, filters]);

  return {
    // Order history data
    orders,
    pagination,
    
    // Order details
    orderDetails,
    
    // Order tracking
    orderTracking,
    
    // Loading states
    isLoadingHistory,
    isLoadingDetails,
    isLoadingTracking,
    
    // Error states
    historyError,
    detailsError,
    trackingError,
    
    // Functions
    getOrderHistory,
    getOrderDetails,
    getOrderTracking,
    refreshOrderHistory,
    clearErrors,
  };
};

export default useOrderHistory;
