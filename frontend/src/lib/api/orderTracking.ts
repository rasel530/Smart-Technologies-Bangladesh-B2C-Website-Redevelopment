/**
 * Order Tracking API Client
 * 
 * This file contains all API client functions for order tracking operations
 * including real-time status, courier integration, notifications, tracking timeline,
 * delivery confirmation, webhooks, and tracking analytics.
 */

import apiClient from './client';

// ============================================================================
// Type Definitions
// ============================================================================

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';

export interface OrderStatusResponse {
  status: OrderStatus;
  previousStatus?: OrderStatus | null;
  statusHistory: Array<{
    status: OrderStatus;
    previousStatus?: OrderStatus | null;
    reason?: string;
    changedAt: Date;
  }>;
  currentStep: string;
  estimatedCompletion?: Date | null;
  fulfillment?: {
    trackingNumber?: string;
    courierService?: string;
    estimatedDelivery?: Date | null;
  } | null;
}

export interface RealTimeStatusResponse {
  status: OrderStatus;
  lastUpdated: Date;
  trackingEvents: Array<{
    status: string;
    description?: string;
    location?: string;
    timestamp: Date;
  }>;
  nextSteps: string[];
  fulfillment?: {
    trackingNumber?: string;
    courierService?: string;
    estimatedDelivery?: Date | null;
  } | null;
}

export interface CourierService {
  id: string;
  name: string;
  code: string;
  apiEndpoint?: string | null;
  trackingUrl?: string | null;
  isActive: boolean;
  coverageAreas: string[];
  baseRate?: number | null;
  ratePerKg?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSubscription {
  id: string;
  orderId: string;
  userId?: string | null;
  notificationType: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string | null;
  message?: string | null;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingEvent {
  id: string;
  orderId: string;
  fulfillmentId: string;
  status: string;
  location?: string | null;
  description?: string | null;
  eventTime: Date;
  rawData?: Record<string, any> | null;
  createdAt: Date;
}

export interface TimelineEvent {
  timestamp: Date;
  status: string;
  description: string;
  location?: string | null;
  icon: string;
}

export interface TrackingTimeline {
  timeline: TimelineEvent[];
  currentStatus: OrderStatus;
  estimatedDelivery?: Date | null;
  trackingNumber?: string | null;
  courierService?: string | null;
}

export interface TrackingMilestone {
  name: string;
  status: 'completed' | 'pending';
  completedAt?: Date | null;
  estimatedAt?: Date | null;
}

export interface TrackingMilestones {
  milestones: TrackingMilestone[];
  progress: number;
}

export interface DeliveryConfirmation {
  confirmationId: string;
  recipientName: string;
  recipientPhone?: string | null;
  confirmedAt: Date;
  signature?: string | null;
  photo?: string[] | null;
  notes?: string | null;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  } | null;
}

export interface DeliveryConfirmationWithOrder extends DeliveryConfirmation {
  orderId: string;
  orderNumber: string;
  courierService?: {
    id: string;
    name: string;
  } | null;
  trackingNumber?: string | null;
  confirmationMethod?: 'signature' | 'otp' | 'photo' | 'manual' | null;
  otpCode?: string | null;
}

export interface DeliveryConfirmationsResponse {
  confirmations: BackendConfirmation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Backend response type for confirmations
export interface BackendConfirmation {
  id: string;
  recipientName: string;
  recipientPhone?: string | null;
  confirmedAt: Date;
  signatureUrl?: string | null;
  photos?: string[] | null;
  deliveryNotes?: string | null;
  deliveryLocation?: string | null;
  confirmationMethod?: 'signature' | 'otp' | 'photo' | 'manual' | null;
  otpCode?: string | null;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: Date;
    deliveredAt?: Date | null;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
    } | null;
  } | null;
  fulfillment?: {
    id: string;
    trackingNumber?: string | null;
    courierServiceId?: string | null;
    courierService?: {
      id: string;
      name: string;
      code: string;
      contactPhone?: string | null;
    } | null;
  } | null;
}

export interface DeliveryConfirmationsStats {
  total: number;
  withSignature: number;
  withPhoto: number;
  withOtp: number;
  byCourier: Array<{
    name: string;
    total: number;
    withSignature: number;
    withPhoto: number;
    withOtp: number;
  }>;
  byDate: Record<string, {
    total: number;
    withSignature: number;
    withPhoto: number;
    withOtp: number;
  }>;
  byMethod: Record<string, number>;
}

export interface DeliveryConfirmationsParams {
  startDate?: string;
  endDate?: string;
  courierServiceId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TrackingAnalytics {
  totalTracked: number;
  onTimeRate: number;
  delayedRate: number;
  averageDeliveryTime: number;
  byCourier: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface TrackingIssue {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: Date;
  trackingNumber?: string | null;
  courierService?: string | null;
  issue: string;
}

export interface DeliveryPerformance {
  totalDeliveries: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
  byCourier: Record<string, { total: number; onTime: number }>;
  byRegion: Record<string, number>;
}

export interface CourierTestResult {
  success: boolean;
  message?: string;
  trackingData?: any;
  error?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  reason?: string;
  notifyCustomer?: boolean;
}

export interface SubscribeToNotificationsRequest {
  channels: NotificationChannel[];
  phoneNumber?: string;
  email?: string;
}

export interface UpdateSubscriptionRequest {
  channels?: NotificationChannel[];
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
}

export interface AddTrackingEventRequest {
  status: string;
  location?: string;
  description?: string;
  eventData?: Record<string, any>;
  timestamp?: string;
}

export interface ConfirmDeliveryRequest {
  recipientName: string;
  recipientPhone?: string;
  signature?: string;
  photo?: string;
  notes?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

export interface VerifyOTPRequest {
  otp: string;
}

export interface TestCourierConnectionRequest {
  testTrackingNumber?: string;
}

export interface BulkSyncRequest {
  courierServiceId?: string;
  orderStatus?: 'confirmed' | 'processing' | 'shipped';
}

export interface BulkUpdateRequest {
  orderIds: string[];
  trackingNumbers: Array<{
    trackingNumber: string;
    courierServiceId?: string;
  }>;
}

export interface InvestigateIssuesRequest {
  orderIds: string[];
}

export interface ResolveIssuesRequest {
  orderIds: string[];
}

export interface TrackingFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  courierServiceId?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 1. Real-Time Status API Functions
 */

export const getOrderStatus = async (
  orderId: string,
  email?: string,
  phone?: string
): Promise<OrderStatusResponse> => {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (phone) params.append('phone', phone);
  
  return apiClient.get(`/orders/${orderId}/status${params ? `?${params}` : ''}`);
};

export const updateOrderStatus = async (
  orderId: string,
  data: UpdateOrderStatusRequest
): Promise<{ message: string; notificationSent: boolean }> => {
  return apiClient.post(`/orders/${orderId}/status`, data);
};

export const getOrderStatusRealtime = async (
  orderId: string,
  email?: string,
  phone?: string,
  lastUpdated?: string
): Promise<RealTimeStatusResponse> => {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (phone) params.append('phone', phone);
  if (lastUpdated) params.append('lastUpdated', lastUpdated);
  
  return apiClient.get(`/orders/${orderId}/status/realtime${params ? `?${params}` : ''}`);
};

/**
 * 2. Courier Integration API Functions
 */

export const getCourierServices = async (isActive?: boolean): Promise<CourierService[]> => {
  const params = isActive !== undefined ? `?isActive=${isActive.toString()}` : '';
  return apiClient.get<CourierService[]>(`/admin/courier-services${params}`);
};

export const createCourierService = async (data: {
  name: string;
  code: string;
  apiUrl?: string;
  apiKey?: string;
  trackingUrlTemplate?: string;
  isActive?: boolean;
  coverageAreas?: string[];
  pricing?: {
    baseRate?: number;
    ratePerKg?: number;
  };
}): Promise<{ courierServiceId: string }> => {
  return apiClient.post('/admin/courier-services', data);
};

export const updateCourierService = async (
  id: string,
  data: {
    name?: string;
    code?: string;
    apiUrl?: string;
    apiKey?: string;
    trackingUrlTemplate?: string;
    isActive?: boolean;
    coverageAreas?: string[];
    pricing?: {
      baseRate?: number;
      ratePerKg?: number;
    };
  }
): Promise<{ message: string }> => {
  return apiClient.put(`/admin/courier-services/${id}`, data);
};

export const deleteCourierService = async (id: string): Promise<{ message: string }> => {
  return apiClient.delete(`/admin/courier-services/${id}`);
};

export const testCourierConnection = async (
  id: string,
  data?: TestCourierConnectionRequest
): Promise<CourierTestResult> => {
  return apiClient.post(`/admin/courier-services/${id}/test`, data || {});
};

/**
 * 3. Status Notification API Functions
 */

export const subscribeToNotifications = async (
  orderId: string,
  data: SubscribeToNotificationsRequest
): Promise<{ subscriptionIds: string[]; message: string }> => {
  return apiClient.post(`/orders/${orderId}/notifications/subscribe`, data);
};

export const getNotificationSubscriptions = async (orderId: string): Promise<NotificationSubscription[]> => {
  const response = await apiClient.get<{ data: NotificationSubscription[] }>(`/orders/${orderId}/notifications/subscriptions`);
  return response.data;
};

export const updateNotificationSubscription = async (
  orderId: string,
  subscriptionId: string,
  data: UpdateSubscriptionRequest
): Promise<{ message: string }> => {
  return apiClient.put(`/orders/${orderId}/notifications/subscriptions/${subscriptionId}`, data);
};

export const unsubscribeFromNotifications = async (
  orderId: string,
  subscriptionId: string
): Promise<{ message: string }> => {
  return apiClient.delete(`/orders/${orderId}/notifications/subscriptions/${subscriptionId}`);
};

/**
 * 4. Tracking Timeline API Functions
 */

export const getTrackingTimeline = async (
  orderId: string,
  email?: string,
  phone?: string
): Promise<TrackingTimeline> => {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (phone) params.append('phone', phone);
  
  return apiClient.get<TrackingTimeline>(`/orders/${orderId}/tracking/timeline${params ? `?${params}` : ''}`);
};

export const getTrackingEvents = async (
  orderId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }
): Promise<TrackingEvent[]> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.status) params.append('status', filters.status);
  
  return apiClient.get<TrackingEvent[]>(`/orders/${orderId}/tracking/events${params ? `?${params}` : ''}`);
};

export const addTrackingEvent = async (
  orderId: string,
  data: AddTrackingEventRequest
): Promise<{ eventId: string; statusUpdated: boolean; message: string }> => {
  return apiClient.post(`/orders/${orderId}/tracking/events`, data);
};

export const getTrackingMilestones = async (
  orderId: string,
  email?: string,
  phone?: string
): Promise<TrackingMilestones> => {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (phone) params.append('phone', phone);
  
  return apiClient.get<TrackingMilestones>(`/orders/${orderId}/tracking/milestones${params ? `?${params}` : ''}`);
};

/**
 * 5. Delivery Confirmation API Functions
 */

export const confirmDelivery = async (
  orderId: string,
  data: ConfirmDeliveryRequest
): Promise<{ message: string }> => {
  return apiClient.post(`/orders/${orderId}/delivery/confirm`, data);
};

export const getDeliveryConfirmation = async (orderId: string): Promise<DeliveryConfirmation> => {
  return apiClient.get<DeliveryConfirmation>(`/orders/${orderId}/delivery/confirmation`);
};

export const verifyDeliveryOTP = async (
  orderId: string,
  data: VerifyOTPRequest
): Promise<{ message: string }> => {
  return apiClient.post(`/orders/${orderId}/delivery/otp/verify`, data);
};

export const sendDeliveryOTP = async (orderId: string): Promise<{ message: string }> => {
  return apiClient.post(`/orders/${orderId}/delivery/otp/send`);
};

/**
 * Admin Delivery Confirmations API Functions
 */

export const getDeliveryConfirmations = async (
  params?: DeliveryConfirmationsParams
): Promise<DeliveryConfirmationsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.courierServiceId) queryParams.append('courierServiceId', params.courierServiceId);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  console.log('[getDeliveryConfirmations] Making API request to:', `/admin/delivery/confirmations${queryString ? `?${queryString}` : ''}`);
  const response = await apiClient.get<DeliveryConfirmationsResponse>(
    `/admin/delivery/confirmations${queryString ? `?${queryString}` : ''}`
  );
  console.log('[getDeliveryConfirmations] Raw response from apiClient:', response);
  console.log('[getDeliveryConfirmations] Response type:', typeof response);
  console.log('[getDeliveryConfirmations] Response keys:', response ? Object.keys(response) : 'response is null/undefined');
  console.log('[getDeliveryConfirmations] response.confirmations:', response?.confirmations);
  console.log('[getDeliveryConfirmations] response.pagination:', response?.pagination);
  // API client already unwraps the response, so return it directly
  return response;
};

export const getDeliveryConfirmationsStats = async (
  params?: Pick<DeliveryConfirmationsParams, 'startDate' | 'endDate'>
): Promise<DeliveryConfirmationsStats> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const response = await apiClient.get<DeliveryConfirmationsStats>(
    `/admin/delivery/confirmations/stats${queryString ? `?${queryString}` : ''}`
  );
  // API client already unwraps the response, so return it directly
  return response;
};

/**
 * 6. Tracking Analytics API Functions (Admin)
 */

export const getTrackingAnalytics = async (filters?: TrackingFilters): Promise<TrackingAnalytics> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.courierServiceId) params.append('courierServiceId', filters.courierServiceId);
  
  return apiClient.get<TrackingAnalytics>(`/admin/tracking/analytics${params ? `?${params}` : ''}`);
};

export const getTrackingIssues = async (filters?: TrackingFilters): Promise<TrackingIssue[]> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.courierServiceId) params.append('courierServiceId', filters.courierServiceId);
  
  return apiClient.get<TrackingIssue[]>(`/admin/tracking/issues${params ? `?${params}` : ''}`);
};

export const getDeliveryPerformance = async (filters?: TrackingFilters): Promise<DeliveryPerformance> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.courierServiceId) params.append('courierServiceId', filters.courierServiceId);
  
  return apiClient.get<DeliveryPerformance>(`/admin/tracking/performance${params ? `?${params}` : ''}`);
};

/**
 * 7. Bulk Tracking Operations API Functions (Admin)
 */

export const syncAllTracking = async (data?: BulkSyncRequest): Promise<{
  syncedCount: number;
  failedCount: number;
  errors: Array<{ orderId: string; orderNumber: string; error: string }>;
}> => {
  return apiClient.post('/admin/tracking/sync-all', data || {});
};

export const bulkUpdateTracking = async (data: BulkUpdateRequest): Promise<{
  updatedCount: number;
  failedCount: number;
  errors: Array<{ orderId: string; error: string }>;
}> => {
  return apiClient.post('/admin/tracking/bulk-update', data);
};

export const investigateIssues = async (data: InvestigateIssuesRequest): Promise<{
  investigatedCount: number;
  failedCount: number;
  errors: Array<{ orderId: string; error: string }>;
}> => {
  return apiClient.post('/admin/tracking/issues/investigate', data);
};

export const resolveIssues = async (data: ResolveIssuesRequest): Promise<{
  resolvedCount: number;
  failedCount: number;
  errors: Array<{ orderId: string; error: string }>;
}> => {
  return apiClient.post('/admin/tracking/issues/resolve', data);
};

// ============================================================================
// Default Export
// ============================================================================

const orderTrackingApi = {
  // Real-Time Status
  getOrderStatus,
  updateOrderStatus,
  getOrderStatusRealtime,

  // Courier Integration
  getCourierServices,
  createCourierService,
  updateCourierService,
  deleteCourierService,
  testCourierConnection,

  // Status Notifications
  subscribeToNotifications,
  getNotificationSubscriptions,
  updateNotificationSubscription,
  unsubscribeFromNotifications,

  // Tracking Timeline
  getTrackingTimeline,
  getTrackingEvents,
  addTrackingEvent,
  getTrackingMilestones,

  // Delivery Confirmation
  confirmDelivery,
  getDeliveryConfirmation,
  verifyDeliveryOTP,
  sendDeliveryOTP,

  // Admin Delivery Confirmations
  getDeliveryConfirmations,
  getDeliveryConfirmationsStats,

  // Tracking Analytics
  getTrackingAnalytics,
  getTrackingIssues,
  getDeliveryPerformance,

  // Bulk Operations
  syncAllTracking,
  bulkUpdateTracking,
  investigateIssues,
  resolveIssues,
};

export default orderTrackingApi;
