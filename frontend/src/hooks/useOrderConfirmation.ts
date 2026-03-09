/**
 * Custom hook for order confirmation operations
 * Provides functions for managing order confirmation, sharing, invoices, notifications, and tracking
 */

import { useState, useEffect, useCallback } from 'react';
import {
  orderConfirmationApi,
  adminOrderConfirmationApi,
  OrderConfirmationData,
  ShareLink,
  CreateShareLinkData,
  Invoice,
  NotificationSubscription,
  Notification,
  NotificationStats,
  InvoiceStats,
  ShareStats,
  TrackingInfo,
  NotificationChannel,
  NotificationType,
} from '@/lib/api/orderConfirmation';

export function useOrderConfirmation(orderId: string) {
  const [confirmation, setConfirmation] = useState<OrderConfirmationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get order confirmation data
   */
  const getOrderConfirmation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderConfirmationApi.getOrderConfirmation(orderId);
      setConfirmation(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load order confirmation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Track confirmation page view
   */
  const trackConfirmationView = useCallback(async (data?: { userAgent?: string; referrer?: string }) => {
    try {
      await orderConfirmationApi.trackConfirmationView(orderId, data || {});
    } catch (err: any) {
      console.error('Failed to track confirmation view:', err);
      // Don't throw error for tracking
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      getOrderConfirmation();
    }
  }, [orderId, getOrderConfirmation]);

  return {
    confirmation,
    loading,
    error,
    getOrderConfirmation,
    trackConfirmationView,
  };
}

export function useOrderSharing(orderId: string) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create share link
   */
  const createShareLink = useCallback(async (data: CreateShareLinkData) => {
    setLoading(true);
    setError(null);
    try {
      const shareLink = await orderConfirmationApi.createShareLink(orderId, data);
      setShareLinks((prev) => [...prev, shareLink]);
      return shareLink;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create share link';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Get share links
   */
  const getShareLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const links = await orderConfirmationApi.getShareLinks(orderId);
      setShareLinks(links);
      return links;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load share links';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Update share link
   */
  const updateShareLink = useCallback(async (shareId: string, data: Partial<CreateShareLinkData>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedLink = await orderConfirmationApi.updateShareLink(orderId, shareId, data);
      setShareLinks((prev) =>
        prev.map((link) => (link.id === shareId ? updatedLink : link))
      );
      return updatedLink;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update share link';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Delete share link
   */
  const deleteShareLink = useCallback(async (shareId: string) => {
    setLoading(true);
    setError(null);
    try {
      await orderConfirmationApi.deleteShareLink(orderId, shareId);
      setShareLinks((prev) => prev.filter((link) => link.id !== shareId));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete share link';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Get shared order via token
   */
  const getSharedOrder = useCallback(async (token: string, password?: string) => {
    setLoading(true);
    setError(null);
    try {
      const order = await orderConfirmationApi.getSharedOrder(token, password);
      return order;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load shared order';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (orderId) {
      getShareLinks();
    }
  }, [orderId, getShareLinks]);

  return {
    shareLinks,
    loading,
    error,
    createShareLink,
    getShareLinks,
    updateShareLink,
    deleteShareLink,
    getSharedOrder,
  };
}

export function useOrderInvoices(orderId: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get invoices
   */
  const getInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderConfirmationApi.getInvoices(orderId);
      setInvoices(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load invoices';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Download invoice
   */
  const downloadInvoice = useCallback(async (invoiceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const blob = await orderConfirmationApi.downloadInvoice(orderId, invoiceId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to download invoice';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Preview invoice
   */
  const previewInvoice = useCallback(async (invoiceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = await orderConfirmationApi.previewInvoice(orderId, invoiceId);
      window.open(url, '_blank');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to preview invoice';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Email invoice
   */
  const emailInvoice = useCallback(async (invoiceId: string, email?: string) => {
    setLoading(true);
    setError(null);
    try {
      await orderConfirmationApi.emailInvoice(orderId, invoiceId, email);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to email invoice';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Generate new invoice (admin)
   */
  const generateInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderConfirmationApi.generateInvoice(orderId);
      // Refresh invoices to get the full invoice record from the database
      await getInvoices();
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate invoice';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId, getInvoices]);

  /**
   * Resend invoice email (admin)
   */
  const resendInvoice = useCallback(async (invoiceId: string) => {
    setLoading(true);
    setError(null);
    try {
      await orderConfirmationApi.resendInvoice(orderId, invoiceId);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to resend invoice';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      getInvoices();
    }
  }, [orderId, getInvoices]);

  return {
    invoices,
    loading,
    error,
    getInvoices,
    downloadInvoice,
    previewInvoice,
    emailInvoice,
    generateInvoice,
    resendInvoice,
  };
}

export function useOrderNotifications(orderId: string) {
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Subscribe to notifications
   */
  const subscribeToNotifications = useCallback(async (
    data: {
      channels: NotificationChannel[];
      notificationTypes: NotificationType[];
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const subscription = await orderConfirmationApi.subscribeToNotifications(orderId, data);
      setSubscriptions((prev) => [...prev, subscription]);
      return subscription;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to subscribe to notifications';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Get notification subscriptions
   */
  const getNotificationSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderConfirmationApi.getNotificationSubscriptions(orderId);
      setSubscriptions(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load notification subscriptions';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Update notification subscription
   */
  const updateNotificationSubscription = useCallback(async (
    subscriptionId: string,
    data: {
      channels?: NotificationChannel[];
      notificationTypes?: NotificationType[];
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await orderConfirmationApi.updateNotificationSubscription(
        orderId,
        subscriptionId,
        data
      );
      setSubscriptions((prev) =>
        prev.map((sub) => (sub.id === subscriptionId ? updated : sub))
      );
      return updated;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update notification subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Unsubscribe from notifications
   */
  const unsubscribeFromNotifications = useCallback(async (subscriptionId: string) => {
    setLoading(true);
    setError(null);
    try {
      await orderConfirmationApi.unsubscribeFromNotifications(orderId, subscriptionId);
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== subscriptionId));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to unsubscribe from notifications';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      getNotificationSubscriptions();
    }
  }, [orderId, getNotificationSubscriptions]);

  return {
    subscriptions,
    loading,
    error,
    subscribeToNotifications,
    getNotificationSubscriptions,
    updateNotificationSubscription,
    unsubscribeFromNotifications,
  };
}

export function useOrderTracking(orderId: string, autoRefresh: boolean = false, refreshInterval: number = 60000) {
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get tracking information
   */
  const getTrackingInformation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderConfirmationApi.getTrackingInformation(orderId);
      setTracking(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load tracking information';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Refresh tracking information
   */
  const refreshTracking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderConfirmationApi.refreshTracking(orderId);
      setTracking(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to refresh tracking information';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Update tracking (admin)
   */
  const updateTracking = useCallback(async (data: {
    trackingNumber?: string;
    courierService?: string;
    estimatedDeliveryDate?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await orderConfirmationApi.updateTracking(orderId, data);
      setTracking(updated);
      return updated;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update tracking';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      getTrackingInformation();
    }
  }, [orderId, getTrackingInformation]);

  // Auto-refresh tracking
  useEffect(() => {
    if (!autoRefresh || !orderId) return;

    const interval = setInterval(() => {
      refreshTracking();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, orderId, refreshInterval, refreshTracking]);

  return {
    tracking,
    loading,
    error,
    getTrackingInformation,
    refreshTracking,
    updateTracking,
  };
}

// Admin hooks
export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNotifications = useCallback(async (params?: {
    type?: NotificationType;
    channel?: NotificationChannel;
    status?: string;
    orderId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrderConfirmationApi.getNotifications(params);
      setNotifications(data.notifications);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load notifications';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendNotification = useCallback(async (notificationId: string) => {
    setLoading(true);
    setError(null);
    try {
      await adminOrderConfirmationApi.resendNotification(notificationId);
      await getNotifications({ page });  // ✅ FIX: Pass current page
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to resend notification';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getNotifications, page]);  // ✅ FIX: Add page to dependencies

  const deleteNotification = useCallback(async (notificationId: string) => {
    setLoading(true);
    setError(null);
    try {
      await adminOrderConfirmationApi.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete notification';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkResendNotifications = useCallback(async (notificationIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      await adminOrderConfirmationApi.bulkResendNotifications(notificationIds);
      await getNotifications({ page });  // ✅ FIX: Pass current page
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to resend notifications';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getNotifications, page]);  // ✅ FIX: Add page to dependencies

  const bulkDeleteNotifications = useCallback(async (notificationIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      await adminOrderConfirmationApi.bulkDeleteNotifications(notificationIds);
      setNotifications((prev) => prev.filter((n) => !notificationIds.includes(n.id)));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete notifications';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    notifications,
    total,
    page,
    totalPages,
    loading,
    error,
    getNotifications,
    resendNotification,
    deleteNotification,
    bulkResendNotifications,
    bulkDeleteNotifications,
    setPage,  // ✅ ADD THIS LINE
  };
}

export function useAdminNotificationStats() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNotificationStats = useCallback(async (params?: {
    startDate?: string;
    endDate?: string;
    channel?: NotificationChannel;
    type?: NotificationType;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrderConfirmationApi.getNotificationStats(params);
      setStats(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load notification statistics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    getNotificationStats,
  };
}

export function useAdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInvoices = useCallback(async (params?: {
    orderId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrderConfirmationApi.getInvoices(params);
      setInvoices(data.invoices);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load invoices';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDownloadInvoices = useCallback(async (invoiceIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const blob = await adminOrderConfirmationApi.bulkDownloadInvoices(invoiceIds);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to download invoices';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkEmailInvoices = useCallback(async (invoiceIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      await adminOrderConfirmationApi.bulkEmailInvoices(invoiceIds);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to email invoices';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    invoices,
    total,
    page,
    totalPages,
    loading,
    error,
    getInvoices,
    bulkDownloadInvoices,
    bulkEmailInvoices,
  };
}

export function useAdminInvoiceStats() {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInvoiceStats = useCallback(async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrderConfirmationApi.getInvoiceStats(params);
      setStats(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load invoice statistics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    getInvoiceStats,
  };
}

export function useAdminSharing() {
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSharedOrders = useCallback(async (params?: {
    orderId?: string;
    shareType?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrderConfirmationApi.getSharedOrders(params);
      setShares(data.shares);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load shared orders';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const disableShareLink = useCallback(async (shareId: string) => {
    setLoading(true);
    setError(null);
    try {
      await adminOrderConfirmationApi.disableShareLink(shareId);
      setShares((prev) =>
        prev.map((share) => (share.id === shareId ? { ...share, isActive: false } : share))
      );
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to disable share link';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteShareLink = useCallback(async (shareId: string) => {
    setLoading(true);
    setError(null);
    try {
      await adminOrderConfirmationApi.deleteShareLink(shareId);
      setShares((prev) => prev.filter((share) => share.id !== shareId));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete share link';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDisableShareLinks = useCallback(async (shareIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      await adminOrderConfirmationApi.bulkDisableShareLinks(shareIds);
      setShares((prev) =>
        prev.map((share) =>
          shareIds.includes(share.id) ? { ...share, isActive: false } : share
        )
      );
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to disable share links';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDeleteShareLinks = useCallback(async (shareIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      await adminOrderConfirmationApi.bulkDeleteShareLinks(shareIds);
      setShares((prev) => prev.filter((share) => !shareIds.includes(share.id)));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete share links';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    shares,
    total,
    page,
    totalPages,
    loading,
    error,
    getSharedOrders,
    disableShareLink,
    deleteShareLink,
    bulkDisableShareLinks,
    bulkDeleteShareLinks,
  };
}

export function useAdminSharingStats() {
  const [stats, setStats] = useState<ShareStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSharingStats = useCallback(async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrderConfirmationApi.getSharingStats(params);
      setStats(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load sharing statistics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    getSharingStats,
  };
}
