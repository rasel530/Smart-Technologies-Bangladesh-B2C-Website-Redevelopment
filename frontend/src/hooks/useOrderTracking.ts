/**
 * useOrderTracking Hook
 * 
 * Custom hook for order tracking operations including real-time status,
 * courier integration, notifications, tracking timeline, and delivery confirmation.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import orderTrackingApi, {
  OrderStatusResponse,
  RealTimeStatusResponse,
  NotificationSubscription,
  TrackingEvent,
  TrackingTimeline,
  TrackingMilestones,
  DeliveryConfirmation,
  UpdateOrderStatusRequest,
  SubscribeToNotificationsRequest,
  UpdateSubscriptionRequest,
  AddTrackingEventRequest,
  ConfirmDeliveryRequest,
  VerifyOTPRequest,
} from '@/lib/api/orderTracking';

interface UseOrderTrackingReturn {
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Data states
  orderStatus: OrderStatusResponse | null;
  realtimeStatus: RealTimeStatusResponse | null;
  trackingTimeline: TrackingTimeline | null;
  trackingEvents: TrackingEvent[];
  trackingMilestones: TrackingMilestones | null;
  notificationSubscriptions: NotificationSubscription[];
  deliveryConfirmation: DeliveryConfirmation | null;
  
  // Real-time status operations
  getOrderStatus: (orderId: string, email?: string, phone?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, data: UpdateOrderStatusRequest) => Promise<boolean>;
  getOrderStatusRealtime: (orderId: string, email?: string, phone?: string) => Promise<void>;
  
  // Auto-refresh functionality
  enableAutoRefresh: (orderId: string, interval?: number, email?: string, phone?: string) => void;
  disableAutoRefresh: () => void;
  isAutoRefreshEnabled: boolean;
  
  // Notification operations
  subscribeToNotifications: (orderId: string, data: SubscribeToNotificationsRequest) => Promise<boolean>;
  getNotificationSubscriptions: (orderId: string) => Promise<void>;
  updateNotificationSubscription: (orderId: string, subscriptionId: string, data: UpdateSubscriptionRequest) => Promise<boolean>;
  unsubscribeFromNotifications: (orderId: string, subscriptionId: string) => Promise<boolean>;
  
  // Tracking operations
  getTrackingTimeline: (orderId: string, email?: string, phone?: string) => Promise<void>;
  getTrackingEvents: (orderId: string, filters?: { startDate?: string; endDate?: string; status?: string }) => Promise<void>;
  addTrackingEvent: (orderId: string, data: AddTrackingEventRequest) => Promise<boolean>;
  getTrackingMilestones: (orderId: string, email?: string, phone?: string) => Promise<void>;
  
  // Delivery confirmation operations
  confirmDelivery: (orderId: string, data: ConfirmDeliveryRequest) => Promise<boolean>;
  getDeliveryConfirmation: (orderId: string) => Promise<void>;
  verifyDeliveryOTP: (orderId: string, data: VerifyOTPRequest) => Promise<boolean>;
  sendDeliveryOTP: (orderId: string) => Promise<boolean>;
  
  // Error handling
  clearError: () => void;
  refreshData: (orderId: string, email?: string, phone?: string) => Promise<void>;
}

export const useOrderTracking = (): UseOrderTrackingReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [orderStatus, setOrderStatus] = useState<OrderStatusResponse | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealTimeStatusResponse | null>(null);
  const [trackingTimeline, setTrackingTimeline] = useState<TrackingTimeline | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [trackingMilestones, setTrackingMilestones] = useState<TrackingMilestones | null>(null);
  const [notificationSubscriptions, setNotificationSubscriptions] = useState<NotificationSubscription[]>([]);
  const [deliveryConfirmation, setDeliveryConfirmation] = useState<DeliveryConfirmation | null>(null);
  
  // Auto-refresh state
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentOrderIdRef = useRef<string | null>(null);
  const currentEmailRef = useRef<string | undefined>(undefined);
  const currentPhoneRef = useRef<string | undefined>(undefined);
  const lastUpdatedRef = useRef<Date | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeOperation = useCallback(async <T,>(
    operation: () => Promise<T>,
    errorMessage: string,
    isRefresh = false
  ): Promise<T | null> => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err: any) {
      const errorMsg = err?.message || errorMessage;
      setError(errorMsg);
      console.error(errorMessage, err);
      return null;
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  // Real-time status operations
  const getOrderStatus = useCallback(async (
    orderId: string,
    email?: string,
    phone?: string
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.getOrderStatus(orderId, email, phone),
      'Failed to fetch order status'
    );
    if (result) {
      setOrderStatus(result);
    }
  }, [executeOperation]);

  const updateOrderStatus = useCallback(async (
    orderId: string,
    data: UpdateOrderStatusRequest
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.updateOrderStatus(orderId, data),
      'Failed to update order status'
    );
    return result !== null;
  }, [executeOperation]);

  const getOrderStatusRealtime = useCallback(async (
    orderId: string,
    email?: string,
    phone?: string
  ) => {
    const lastUpdated = lastUpdatedRef.current?.toISOString();
    const result = await executeOperation(
      () => orderTrackingApi.getOrderStatusRealtime(orderId, email, phone, lastUpdated),
      'Failed to fetch real-time status',
      true
    );
    if (result) {
      setRealtimeStatus(result);
      lastUpdatedRef.current = result.lastUpdated;
    }
  }, [executeOperation]);

  // Auto-refresh functionality
  const enableAutoRefresh = useCallback((
    orderId: string,
    interval: number = 30000, // 30 seconds default
    email?: string,
    phone?: string
  ) => {
    // Clear existing interval
    disableAutoRefresh();
    
    // Store current order info
    currentOrderIdRef.current = orderId;
    currentEmailRef.current = email;
    currentPhoneRef.current = phone;
    
    // Initial fetch
    getOrderStatusRealtime(orderId, email, phone);
    
    // Set up interval
    autoRefreshIntervalRef.current = setInterval(() => {
      if (currentOrderIdRef.current) {
        getOrderStatusRealtime(currentOrderIdRef.current, currentEmailRef.current, currentPhoneRef.current);
      }
    }, interval);
    
    setIsAutoRefreshEnabled(true);
  }, [getOrderStatusRealtime]);

  const disableAutoRefresh = useCallback(() => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
    currentOrderIdRef.current = null;
    currentEmailRef.current = undefined;
    currentPhoneRef.current = undefined;
    setIsAutoRefreshEnabled(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disableAutoRefresh();
    };
  }, [disableAutoRefresh]);

  // Notification operations
  const subscribeToNotifications = useCallback(async (
    orderId: string,
    data: SubscribeToNotificationsRequest
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.subscribeToNotifications(orderId, data),
      'Failed to subscribe to notifications'
    );
    if (result) {
      // Refresh subscriptions after subscribing
      await getNotificationSubscriptions(orderId);
      return true;
    }
    return false;
  }, [executeOperation]);

  const getNotificationSubscriptions = useCallback(async (orderId: string) => {
    const result = await executeOperation(
      () => orderTrackingApi.getNotificationSubscriptions(orderId),
      'Failed to fetch notification subscriptions'
    );
    if (result) {
      setNotificationSubscriptions(result);
    }
  }, [executeOperation]);

  const updateNotificationSubscription = useCallback(async (
    orderId: string,
    subscriptionId: string,
    data: UpdateSubscriptionRequest
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.updateNotificationSubscription(orderId, subscriptionId, data),
      'Failed to update notification subscription'
    );
    if (result) {
      // Refresh subscriptions after updating
      await getNotificationSubscriptions(orderId);
      return true;
    }
    return false;
  }, [executeOperation, getNotificationSubscriptions]);

  const unsubscribeFromNotifications = useCallback(async (
    orderId: string,
    subscriptionId: string
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.unsubscribeFromNotifications(orderId, subscriptionId),
      'Failed to unsubscribe from notifications'
    );
    if (result) {
      // Refresh subscriptions after unsubscribing
      await getNotificationSubscriptions(orderId);
      return true;
    }
    return false;
  }, [executeOperation, getNotificationSubscriptions]);

  // Tracking operations
  const getTrackingTimeline = useCallback(async (
    orderId: string,
    email?: string,
    phone?: string
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.getTrackingTimeline(orderId, email, phone),
      'Failed to fetch tracking timeline'
    );
    if (result) {
      setTrackingTimeline(result);
    }
  }, [executeOperation]);

  const getTrackingEvents = useCallback(async (
    orderId: string,
    filters?: { startDate?: string; endDate?: string; status?: string }
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.getTrackingEvents(orderId, filters),
      'Failed to fetch tracking events'
    );
    if (result) {
      setTrackingEvents(result);
    }
  }, [executeOperation]);

  const addTrackingEvent = useCallback(async (
    orderId: string,
    data: AddTrackingEventRequest
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.addTrackingEvent(orderId, data),
      'Failed to add tracking event'
    );
    if (result) {
      // Refresh events after adding
      await getTrackingEvents(orderId);
      return true;
    }
    return false;
  }, [executeOperation, getTrackingEvents]);

  const getTrackingMilestones = useCallback(async (
    orderId: string,
    email?: string,
    phone?: string
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.getTrackingMilestones(orderId, email, phone),
      'Failed to fetch tracking milestones'
    );
    if (result) {
      setTrackingMilestones(result);
    }
  }, [executeOperation]);

  // Delivery confirmation operations
  const confirmDelivery = useCallback(async (
    orderId: string,
    data: ConfirmDeliveryRequest
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.confirmDelivery(orderId, data),
      'Failed to confirm delivery'
    );
    return result !== null;
  }, [executeOperation]);

  const getDeliveryConfirmation = useCallback(async (orderId: string) => {
    const result = await executeOperation(
      () => orderTrackingApi.getDeliveryConfirmation(orderId),
      'Failed to fetch delivery confirmation'
    );
    if (result) {
      setDeliveryConfirmation(result);
    }
  }, [executeOperation]);

  const verifyDeliveryOTP = useCallback(async (
    orderId: string,
    data: VerifyOTPRequest
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.verifyDeliveryOTP(orderId, data),
      'Failed to verify delivery OTP'
    );
    return result !== null;
  }, [executeOperation]);

  const sendDeliveryOTP = useCallback(async (orderId: string) => {
    const result = await executeOperation(
      () => orderTrackingApi.sendDeliveryOTP(orderId),
      'Failed to send delivery OTP'
    );
    return result !== null;
  }, [executeOperation]);

  // Refresh all data for an order
  const refreshData = useCallback(async (
    orderId: string,
    email?: string,
    phone?: string
  ) => {
    await Promise.all([
      getOrderStatus(orderId, email, phone),
      getOrderStatusRealtime(orderId, email, phone),
      getTrackingTimeline(orderId, email, phone),
      getTrackingMilestones(orderId, email, phone),
      getNotificationSubscriptions(orderId),
    ]);
  }, [
    getOrderStatus,
    getOrderStatusRealtime,
    getTrackingTimeline,
    getTrackingMilestones,
    getNotificationSubscriptions,
  ]);

  return {
    // Loading states
    isLoading,
    isRefreshing,
    error,
    
    // Data states
    orderStatus,
    realtimeStatus,
    trackingTimeline,
    trackingEvents,
    trackingMilestones,
    notificationSubscriptions,
    deliveryConfirmation,
    
    // Real-time status operations
    getOrderStatus,
    updateOrderStatus,
    getOrderStatusRealtime,
    
    // Auto-refresh functionality
    enableAutoRefresh,
    disableAutoRefresh,
    isAutoRefreshEnabled,
    
    // Notification operations
    subscribeToNotifications,
    getNotificationSubscriptions,
    updateNotificationSubscription,
    unsubscribeFromNotifications,
    
    // Tracking operations
    getTrackingTimeline,
    getTrackingEvents,
    addTrackingEvent,
    getTrackingMilestones,
    
    // Delivery confirmation operations
    confirmDelivery,
    getDeliveryConfirmation,
    verifyDeliveryOTP,
    sendDeliveryOTP,
    
    // Error handling
    clearError,
    refreshData,
  };
};

export default useOrderTracking;
