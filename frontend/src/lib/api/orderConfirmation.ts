/**
 * API Client for Order Confirmation functionality
 * Handles all API calls related to order confirmation, sharing, invoices, notifications, and tracking
 */

import { apiClient } from './client';

// Types
export interface OrderConfirmationData {
  orderId: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  customer: CustomerInfo;
  shippingAddress: Address;
  billingAddress: Address;
  estimatedDeliveryDate: string;
  createdAt: string;
  tracking?: TrackingInfo;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CustomerInfo {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  courierService: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  currentStatus: string;
  lastUpdated: string;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

export interface ShareLink {
  id: string;
  shareToken: string;
  shareType: 'public_link' | 'protected_link' | 'one_time_link';
  shareUrl: string;
  password?: string;
  expirationDate?: string;
  maxViews?: number;
  viewCount: number;
  isActive: boolean;
  createdAt: string;
  lastAccessedAt?: string;
}

export interface CreateShareLinkData {
  shareType: 'public_link' | 'protected_link' | 'one_time_link';
  password?: string;
  expirationDate?: string;
  maxViews?: number;
}

// Response from generateInvoice endpoint
export interface InvoiceGenerationResponse {
  invoiceId: string;
  invoiceNumber: string;
  downloadUrl: string;
  message?: string;
}

// Invoice record from database (returned by getInvoices)
export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  invoiceDate: string;
  dueDate?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  pdfUrl: string;
  sentAt?: string;
  paidAt?: string;
  // Additional fields from backend response
  downloadUrl?: string;
}

export interface NotificationSubscription {
  id: string;
  orderId: string;
  channels: NotificationChannel[];
  notificationTypes: NotificationType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
export type NotificationType = 
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'refund_initiated'
  | 'refund_completed'
  | 'tracking_update'
  | 'delivery_reminder';

export interface Notification {
  id: string;
  orderId: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface NotificationStats {
  totalSent: number;
  delivered: number;
  failed: number;
  successRate: number;
  byChannel: Record<NotificationChannel, number>;
  byType: Record<NotificationType, number>;
  overTime: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;
}

export interface InvoiceStats {
  totalGenerated: number;
  totalAmount: number;
  byStatus: Record<string, number>;
  overTime: Array<{
    date: string;
    generated: number;
    amount: number;
  }>;
}

export interface ShareStats {
  totalShared: number;
  activeShares: number;
  totalViews: number;
  byType: Record<string, number>;
  overTime: Array<{
    date: string;
    shared: number;
    views: number;
  }>;
}

// Helper function to build query string
const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

// Order Confirmation APIs
export const orderConfirmationApi = {
  /**
   * Get order confirmation data
   */
  async getOrderConfirmation(orderId: string): Promise<OrderConfirmationData> {
    return apiClient.get<OrderConfirmationData>(
      `/orders/${orderId}/confirmation`
    );
  },

  /**
   * Track confirmation page view
   */
  async trackConfirmationView(orderId: string, data: { userAgent?: string; referrer?: string }): Promise<void> {
    await apiClient.post(`/orders/${orderId}/confirmation/track`, data);
  },

  // Share Link APIs
  /**
   * Create a share link for an order
   */
  async createShareLink(orderId: string, data: CreateShareLinkData): Promise<ShareLink> {
    return apiClient.post<ShareLink>(
      `/orders/${orderId}/share`,
      data
    );
  },

  /**
   * Get all share links for an order
   */
  async getShareLinks(orderId: string): Promise<ShareLink[]> {
    return apiClient.get<ShareLink[]>(
      `/orders/${orderId}/share`
    );
  },

  /**
   * Update a share link
   */
  async updateShareLink(orderId: string, shareId: string, data: Partial<CreateShareLinkData>): Promise<ShareLink> {
    return apiClient.put<ShareLink>(
      `/orders/${orderId}/share/${shareId}`,
      data
    );
  },

  /**
   * Delete a share link
   */
  async deleteShareLink(orderId: string, shareId: string): Promise<void> {
    await apiClient.delete(`/orders/${orderId}/share/${shareId}`);
  },

  /**
   * Get shared order via token
   */
  async getSharedOrder(token: string, password?: string): Promise<OrderConfirmationData> {
    return apiClient.post<OrderConfirmationData>(
      `/orders/share/${token}`,
      password ? { password } : {}
    );
  },

  // Invoice APIs
  /**
   * Get invoices for an order
   */
  async getInvoices(orderId: string): Promise<Invoice[]> {
    return apiClient.get<Invoice[]>(
      `/orders/${orderId}/invoices`
    );
  },

  /**
   * Download invoice PDF
   */
  async downloadInvoice(orderId: string, invoiceId: string): Promise<Blob> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/orders/${orderId}/invoices/${invoiceId}/download`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }
    return response.blob();
  },

  /**
   * Preview invoice PDF
   */
  async previewInvoice(orderId: string, invoiceId: string): Promise<string> {
    const data = await apiClient.get<{ url: string }>(
      `/orders/${orderId}/invoices/${invoiceId}/preview`
    );
    return data.url;
  },

  /**
   * Email invoice
   */
  async emailInvoice(orderId: string, invoiceId: string, email?: string): Promise<void> {
    await apiClient.post(
      `/orders/${orderId}/invoices/${invoiceId}/email`,
      email ? { email } : {}
    );
  },

  /**
   * Generate new invoice (admin only)
   */
  async generateInvoice(orderId: string): Promise<InvoiceGenerationResponse> {
    return apiClient.post<InvoiceGenerationResponse>(
      `/orders/${orderId}/invoices/generate`
    );
  },

  /**
   * Generate and download invoice PDF for an order
   * Makes a POST request to the backend API and returns a Blob (PDF file)
   */
  async generateInvoicePdf(orderId: string): Promise<Blob> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/orders/${orderId}/invoices/generate`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate invoice: ${response.status} ${response.statusText}. ${errorText}`);
    }
    
    return response.blob();
  },

  /**
   * Resend invoice email (admin only)
   */
  async resendInvoice(orderId: string, invoiceId: string): Promise<void> {
    await apiClient.post(
      `/admin/invoices/${invoiceId}/resend`
    );
  },

  // Notification Subscription APIs
  /**
   * Subscribe to notifications for an order
   */
  async subscribeToNotifications(
    orderId: string,
    data: {
      channels: NotificationChannel[];
      notificationTypes: NotificationType[];
    }
  ): Promise<NotificationSubscription> {
    return apiClient.post<NotificationSubscription>(
      `/orders/${orderId}/notifications/subscribe`,
      data
    );
  },

  /**
   * Get notification subscriptions for an order
   */
  async getNotificationSubscriptions(orderId: string): Promise<NotificationSubscription[]> {
    return apiClient.get<NotificationSubscription[]>(
      `/orders/${orderId}/notifications`
    );
  },

  /**
   * Update notification subscription
   */
  async updateNotificationSubscription(
    orderId: string,
    subscriptionId: string,
    data: {
      channels?: NotificationChannel[];
      notificationTypes?: NotificationType[];
    }
  ): Promise<NotificationSubscription> {
    return apiClient.put<NotificationSubscription>(
      `/orders/${orderId}/notifications/${subscriptionId}`,
      data
    );
  },

  /**
   * Unsubscribe from notifications
   */
  async unsubscribeFromNotifications(orderId: string, subscriptionId: string): Promise<void> {
    await apiClient.delete(
      `/orders/${orderId}/notifications/${subscriptionId}`
    );
  },

  // Tracking APIs
  /**
   * Get tracking information for an order
   */
  async getTrackingInformation(orderId: string): Promise<TrackingInfo> {
    return apiClient.get<TrackingInfo>(
      `/orders/${orderId}/track`
    );
  },

  /**
   * Update tracking information (admin only)
   */
  async updateTracking(orderId: string, data: {
    trackingNumber?: string;
    courierService?: string;
    estimatedDeliveryDate?: string;
  }): Promise<TrackingInfo> {
    return apiClient.put<TrackingInfo>(
      `/admin/orders/${orderId}/track`,
      data
    );
  },

  /**
   * Refresh tracking information
   */
  async refreshTracking(orderId: string): Promise<TrackingInfo> {
    return apiClient.post<TrackingInfo>(
      `/orders/${orderId}/track/refresh`
    );
  },
};

// Admin APIs
export const adminOrderConfirmationApi = {
  /**
   * Get all notifications with filters
   */
  async getNotifications(params?: {
    type?: NotificationType;
    channel?: NotificationChannel;
    status?: string;
    orderId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ notifications: Notification[]; total: number; page: number; totalPages: number }> {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get(
      `/admin/notifications${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get notification statistics
   */
  async getNotificationStats(params?: {
    startDate?: string;
    endDate?: string;
    channel?: NotificationChannel;
    type?: NotificationType;
  }): Promise<NotificationStats> {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get<NotificationStats>(
      `/admin/notifications/stats${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Resend notification
   */
  async resendNotification(notificationId: string): Promise<void> {
    await apiClient.post(`/admin/notifications/${notificationId}/resend`);
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/admin/notifications/${notificationId}`);
  },

  /**
   * Bulk resend notifications
   */
  async bulkResendNotifications(notificationIds: string[]): Promise<void> {
    await apiClient.post('/admin/notifications/bulk-resend', { notificationIds });
  },

  /**
   * Bulk delete notifications
   */
  async bulkDeleteNotifications(notificationIds: string[]): Promise<void> {
    await apiClient.post('/admin/notifications/bulk-delete', { notificationIds });
  },

  /**
   * Get all invoices with filters
   */
  async getInvoices(params?: {
    orderId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ invoices: Invoice[]; total: number; page: number; totalPages: number }> {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get(
      `/admin/invoices${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<InvoiceStats> {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get<InvoiceStats>(
      `/admin/invoices/stats${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Bulk download invoices
   */
  async bulkDownloadInvoices(invoiceIds: string[]): Promise<Blob> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/invoices/bulk-download`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ invoiceIds }),
    });
    if (!response.ok) {
      throw new Error('Failed to download invoices');
    }
    return response.blob();
  },

  /**
   * Bulk email invoices
   */
  async bulkEmailInvoices(invoiceIds: string[]): Promise<void> {
    await apiClient.post('/admin/invoices/bulk-email', { invoiceIds });
  },

  /**
   * Get all shared orders with filters
   */
  async getSharedOrders(params?: {
    orderId?: string;
    shareType?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ shares: ShareLink[]; total: number; page: number; totalPages: number }> {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get(
      `/admin/orders/sharing${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get sharing statistics
   */
  async getSharingStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ShareStats> {
    const queryString = params ? buildQueryString(params) : '';
    return apiClient.get<ShareStats>(
      `/admin/orders/sharing/stats${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Disable share link
   */
  async disableShareLink(shareId: string): Promise<void> {
    await apiClient.post(`/admin/orders/sharing/${shareId}/disable`);
  },

  /**
   * Delete share link
   */
  async deleteShareLink(shareId: string): Promise<void> {
    await apiClient.delete(`/admin/orders/sharing/${shareId}`);
  },

  /**
   * Bulk disable share links
   */
  async bulkDisableShareLinks(shareIds: string[]): Promise<void> {
    await apiClient.post('/admin/orders/sharing/bulk-disable', { shareIds });
  },

  /**
   * Bulk delete share links
   */
  async bulkDeleteShareLinks(shareIds: string[]): Promise<void> {
    await apiClient.post('/admin/orders/sharing/bulk-delete', { shareIds });
  },
};
