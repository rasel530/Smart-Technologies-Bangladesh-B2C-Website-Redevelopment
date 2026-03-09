/**
 * Order Management API Client
 * 
 * This file contains all API client functions for order management operations
 * including modifications, cancellations, fulfillments, tracking, notes, and bulk actions.
 */

import apiClient from './client';

// ============================================================================
// Type Definitions
// ============================================================================

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type ModificationType = 
  | 'item_add' 
  | 'item_remove' 
  | 'quantity_change' 
  | 'price_change' 
  | 'address_change' 
  | 'shipping_method_change' 
  | 'payment_method_change' 
  | 'custom';

export type CancellationType = 
  | 'customer_request' 
  | 'fraud' 
  | 'out_of_stock' 
  | 'payment_failed' 
  | 'duplicate' 
  | 'other';

export type NoteType = 'internal' | 'customer' | 'system' | 'fulfillment';

export interface OrderModification {
  id: string;
  orderId: string;
  modification_type: ModificationType;
  description?: string;
  changes?: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  requested_by: string;
  approved_by?: string;
  processed_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderCancellation {
  id: string;
  orderId: string;
  cancellationType: CancellationType;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requested_by: string;
  approved_by?: string;
  refundAmount?: number;
  refundMethod?: string;
  adminNotes?: string;
  processed_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderFulfillment {
  id: string;
  orderId: string;
  courierServiceId?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  shippedAt: Date;
  deliveredAt?: Date;
  packagingDetails?: Record<string, any>;
  notes?: string;
  courierService?: {
    id: string;
    name: string;
    code: string;
    trackingUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CourierService {
  id: string;
  name: string;
  code: string;
  apiEndpoint?: string;
  trackingUrl?: string;
  isActive: boolean;
  coverageAreas: string[];
  baseRate?: number;
  ratePerKg?: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderTrackingEvent {
  id: string;
  orderId: string;
  fulfillmentId: string;
  status: string;
  location?: string;
  description?: string;
  eventTime: Date;
  rawData?: Record<string, any>;
  createdAt: Date;
}

export interface OrderNote {
  id: string;
  orderId: string;
  userId: string;
  noteType: NoteType;
  content: string;
  isPinned: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  previousStatus?: OrderStatus;
  newStatus: OrderStatus;
  changedBy: string;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  paymentMethod: string;
  paymentStatus: string;
  created_at: Date;
  updated_at: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  internalNotes?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  address?: {
    fullName: string;
    phone: string;
    address: string;
    addressLine2?: string;
    city: string;
    district: string;
    postalCode: string;
  };
  items?: OrderItem[];
  paymentDetails?: any;
}

export interface ProductImage {
  id: string;
  originalUrl: string;
  altTextEn?: string;
  altTextBn?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  total: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    images?: ProductImage[];
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface OrderHistoryFilters extends PaginationParams {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface OrderHistoryResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetAllModificationsResponse {
  data: OrderModification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TrackingTimeline {
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    created_at: Date;
  };
  fulfillment?: OrderFulfillment;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  type: 'order_created' | 'status_change' | 'tracking_event';
  timestamp: Date;
  status?: string;
  previousStatus?: string;
  description: string;
  changedBy?: string;
  location?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateModificationRequest {
  type: ModificationType;
  reason?: string;
  changes?: Record<string, any>;
  items?: Array<{
    productId: string;
    quantity?: number;
    price?: number;
  }>;
}

export interface ApproveModificationRequest {
  adminNotes?: string;
}

export interface RejectModificationRequest {
  reason: string;
}

export interface CreateCancellationRequest {
  type: CancellationType;
  reason: string;
}

export interface ApproveCancellationRequest {
  refundAmount?: number;
  refundMethod?: string;
  adminNotes?: string;
}

export interface RejectCancellationRequest {
  reason: string;
}

export interface CreateFulfillmentRequest {
  courierServiceId?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  packagingDetails?: Record<string, any>;
}

export interface UpdateFulfillmentRequest {
  trackingNumber?: string;
  estimatedDelivery?: string;
  packagingDetails?: Record<string, any>;
  actualDeliveryDate?: string;
  notes?: string;
}

export interface CreateNoteRequest {
  content: string;
  type: NoteType;
  isPinned?: boolean;
}

export interface UpdateNoteRequest {
  content?: string;
  isPinned?: boolean;
}

export interface BulkUpdateStatusRequest {
  orderIds: string[];
  status: OrderStatus;
  notes?: string;
}

export interface BulkCancelRequest {
  orderIds: string[];
  type: CancellationType;
  reason: string;
}

export interface BulkExportRequest {
  orderIds: string[];
  format: 'csv' | 'excel' | 'pdf';
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Order Modification API Functions
 */

export const requestModification = async (orderId: string, data: CreateModificationRequest): Promise<{ modificationId: string; status: string }> => {
  return apiClient.post(`/orders/${orderId}/modifications`, data);
};

export const approveModification = async (orderId: string, modificationId: string, data: ApproveModificationRequest): Promise<{ message: string }> => {
  return apiClient.put(`/orders/${orderId}/modifications/${modificationId}/approve`, data);
};

export const rejectModification = async (orderId: string, modificationId: string, data: RejectModificationRequest): Promise<{ message: string }> => {
  return apiClient.put(`/orders/${orderId}/modifications/${modificationId}/reject`, data);
};

export const getOrderModifications = async (orderId: string): Promise<OrderModification[]> => {
  const response = await apiClient.get<{ data: OrderModification[] }>(`/orders/${orderId}/modifications`);
  return response.data;
};

export const getAllModifications = async (params?: {
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  type?: ModificationType;
  page?: number;
  limit?: number;
}): Promise<GetAllModificationsResponse> => {
  const queryParams: Record<string, string> = {};
  
  if (params?.status) queryParams.status = params.status;
  if (params?.type) queryParams.type = params.type;
  if (params?.page) queryParams.page = params.page.toString();
  if (params?.limit) queryParams.limit = params.limit.toString();
  
  const queryString = new URLSearchParams(queryParams).toString();
  // Pass unwrapResponse: false to get the full response with data and pagination
  // FIXED: Changed from /admin/modifications to //admin/orders/modifications to match backend route
  // Backend route is mounted at /api/v1/orders with route /admin/modifications
  // Full path: /api/v1/orders/admin/modifications
  return apiClient.get(`/orders/admin/modifications${queryString ? `?${queryString}` : ''}`, { unwrapResponse: false });
};

export interface GetAllCancellationsResponse {
  data: OrderCancellation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getAllCancellations = async (params?: {
  status?: 'pending' | 'approved' | 'rejected' | 'processed';
  type?: CancellationType;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<GetAllCancellationsResponse> => {
  const queryParams: Record<string, string> = {};
  
  if (params?.status) queryParams.status = params.status;
  if (params?.type) queryParams.type = params.type;
  if (params?.search) queryParams.search = params.search;
  if (params?.page) queryParams.page = params.page.toString();
  if (params?.limit) queryParams.limit = params.limit.toString();
  
  const queryString = new URLSearchParams(queryParams).toString();
  // Pass unwrapResponse: false to get the full response with data and pagination
  // Backend route is mounted at /api/v1/orders with route /admin/cancellations
  // Full path: /api/v1/orders/admin/cancellations
  return apiClient.get(`/orders/admin/cancellations${queryString ? `?${queryString}` : ''}`, { unwrapResponse: false });
};

/**
 * Order Cancellation API Functions
 */

export const requestCancellation = async (orderId: string, data: CreateCancellationRequest): Promise<{ cancellationId: string; status: string }> => {
  return apiClient.post(`/orders/${orderId}/cancellations`, data);
};

export const approveCancellation = async (orderId: string, cancellationId: string, data: ApproveCancellationRequest): Promise<{ message: string; refundDetails?: { amount: number; method: string } }> => {
  return apiClient.put(`/orders/${orderId}/cancellations/${cancellationId}/approve`, data);
};

export const rejectCancellation = async (orderId: string, cancellationId: string, data: RejectCancellationRequest): Promise<{ message: string }> => {
  return apiClient.put(`/orders/${orderId}/cancellations/${cancellationId}/reject`, data);
};

export const getOrderCancellations = async (orderId: string): Promise<OrderCancellation[]> => {
  const response = await apiClient.get<{ data: OrderCancellation[] }>(`/orders/${orderId}/cancellations`);
  return response.data;
};

/**
 * Order Fulfillment API Functions
 */

export const createFulfillment = async (orderId: string, data: CreateFulfillmentRequest): Promise<{ fulfillmentId: string; trackingNumber?: string }> => {
  return apiClient.post(`/orders/${orderId}/fulfillments`, data);
};

export const updateFulfillment = async (orderId: string, fulfillmentId: string, data: UpdateFulfillmentRequest): Promise<{ message: string }> => {
  return apiClient.put(`/orders/${orderId}/fulfillments/${fulfillmentId}`, data);
};

export const getOrderFulfillments = async (orderId: string): Promise<OrderFulfillment[]> => {
  const response = await apiClient.get<{ data: OrderFulfillment[] }>(`/orders/${orderId}/fulfillments`);
  return response.data;
};

/**
 * Courier Service API Functions
 */

export const getCourierServices = async (isActive?: boolean): Promise<CourierService[]> => {
  const params = isActive !== undefined ? `?isActive=${isActive.toString()}` : '';
  const response = await apiClient.get<CourierService[]>(`/admin/courier-services${params}`);
  return response;
};

export const createCourierService = async (data: {
  name: string;
  code: string;
  apiEndpoint?: string;
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

export const updateCourierService = async (id: string, data: {
  name?: string;
  code?: string;
  apiEndpoint?: string;
  trackingUrlTemplate?: string;
  isActive?: boolean;
  coverageAreas?: string[];
  pricing?: {
    baseRate?: number;
    ratePerKg?: number;
  };
}): Promise<{ message: string }> => {
  return apiClient.put(`/admin/courier-services/${id}`, data);
};

export const deleteCourierService = async (id: string): Promise<{ message: string }> => {
  return apiClient.delete(`/admin/courier-services/${id}`);
};

/**
 * Order Tracking API Functions
 */

export const addTrackingEvent = async (orderId: string, data: {
  status: string;
  location?: string;
  description?: string;
  eventData?: Record<string, any>;
}): Promise<{ eventId: string }> => {
  return apiClient.post(`/orders/${orderId}/tracking-events`, data);
};

export const getOrderTrackingEvents = async (orderId: string): Promise<OrderTrackingEvent[]> => {
  const response = await apiClient.get<{ data: OrderTrackingEvent[] }>(`/orders/${orderId}/tracking-events`);
  return response.data;
};

export const getOrderTrackingTimeline = async (orderId: string): Promise<TrackingTimeline> => {
  return apiClient.get(`/orders/${orderId}/tracking-timeline`);
};

/**
 * Order Notes API Functions
 */

export const addOrderNote = async (orderId: string, data: CreateNoteRequest): Promise<{ noteId: string }> => {
  return apiClient.post(`/orders/${orderId}/notes`, data);
};

export const getOrderNotes = async (orderId: string, type?: NoteType): Promise<OrderNote[]> => {
  const params = type ? `?type=${type}` : '';
  const response = await apiClient.get<{ data: OrderNote[] }>(`/orders/${orderId}/notes${params}`);
  return response.data;
};

export const updateOrderNote = async (orderId: string, noteId: string, data: UpdateNoteRequest): Promise<{ message: string }> => {
  return apiClient.put(`/orders/${orderId}/notes/${noteId}`, data);
};

export const deleteOrderNote = async (orderId: string, noteId: string): Promise<{ message: string }> => {
  return apiClient.delete(`/orders/${orderId}/notes/${noteId}`);
};

/**
 * Order Status History API Functions
 */

export const getOrderStatusHistory = async (orderId: string): Promise<OrderStatusHistory[]> => {
  const response = await apiClient.get<{ data: OrderStatusHistory[] }>(`/orders/${orderId}/status-history`);
  return response.data;
};

/**
 * Order History API Functions
 */

export const getOrderHistory = async (filters?: OrderHistoryFilters): Promise<OrderHistoryResponse> => {
  const params: Record<string, string> = {};
  
  if (filters?.page) params.page = filters.page.toString();
  if (filters?.limit) params.limit = filters.limit.toString();
  if (filters?.status) params.status = filters.status;
  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;
  if (filters?.sortBy) params.sortBy = filters.sortBy;
  if (filters?.sortOrder) params.sortOrder = filters.sortOrder;
  
  const queryString = new URLSearchParams(params).toString();
  // Pass unwrapResponse: false to get the full response with data and pagination
  return apiClient.get(`/orders/history${queryString ? `?${queryString}` : ''}`, { unwrapResponse: false });
};

export const getOrderDetails = async (orderId: string): Promise<Order> => {
  return apiClient.get(`/orders/${orderId}`);
};

export const getOrderTracking = async (orderId: string): Promise<TrackingTimeline> => {
  return apiClient.get(`/orders/${orderId}/tracking-timeline`);
};

/**
 * Bulk Actions API Functions
 */

export const bulkUpdateStatus = async (data: BulkUpdateStatusRequest): Promise<{ updatedCount: number; failedOrders: Array<{ order_id: string; error: string }> }> => {
  return apiClient.post('/admin/orders/bulk/status', data);
};

export const bulkCancelOrders = async (data: BulkCancelRequest): Promise<{ cancelledCount: number; failedOrders: Array<{ order_id: string; error: string }> }> => {
  return apiClient.post('/admin/orders/bulk/cancel', data);
};

export const bulkExportOrders = async (data: BulkExportRequest): Promise<{ downloadUrl: string; exportId: string; format: string; orderCount: number }> => {
  return apiClient.post('/admin/orders/bulk/export', data);
};

/**
 * Order Reports and Analytics API Functions
 */

export const getOrderReports = async (params: {
  reportType: 'sales' | 'cancellations' | 'modifications' | 'fulfillments' | 'status_distribution';
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}): Promise<any> => {
  const queryString = new URLSearchParams(params as any).toString();
  return apiClient.get(`/admin/orders/reports${queryString ? `?${queryString}` : ''}`);
};

export const getOrderAnalytics = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
  cancellationRate: number;
  modificationRate: number;
  averageFulfillmentTime: number;
  topProducts: Array<{ name: string; quantity: number }>;
}> => {
  const queryString = params ? new URLSearchParams(params as any).toString() : '';
  return apiClient.get(`/admin/orders/analytics${queryString ? `?${queryString}` : ''}`);
};

// ============================================================================
// Default Export
// ============================================================================

const orderManagementApi = {
  // Modifications
  requestModification,
  approveModification,
  rejectModification,
  getOrderModifications,
  getAllModifications,
  
  // Cancellations
  requestCancellation,
  approveCancellation,
  rejectCancellation,
  getOrderCancellations,
  getAllCancellations,
  
  // Fulfillments
  createFulfillment,
  updateFulfillment,
  getOrderFulfillments,
  
  // Courier Services
  getCourierServices,
  createCourierService,
  updateCourierService,
  deleteCourierService,
  
  // Tracking
  addTrackingEvent,
  getOrderTrackingEvents,
  getOrderTrackingTimeline,
  
  // Notes
  addOrderNote,
  getOrderNotes,
  updateOrderNote,
  deleteOrderNote,
  
  // Status History
  getOrderStatusHistory,
  
  // Order History
  getOrderHistory,
  getOrderDetails,
  getOrderTracking,
  
  // Bulk Actions
  bulkUpdateStatus,
  bulkCancelOrders,
  bulkExportOrders,
  
  // Reports and Analytics
  getOrderReports,
  getOrderAnalytics,
};

export default orderManagementApi;
