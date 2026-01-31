import apiClient, { ApiError } from './client';
import {
  CorporateRegistrationData,
  CorporateAccount,
  CorporateAccountStatus,
  CorporateUser,
  CorporateProduct,
  PurchaseOrder,
  CreatePurchaseOrderData,
  Invoice,
  CreditLimit,
  CreditRequest,
  CreateCreditRequestData,
  CorporateDashboardStats,
  Notification,
} from '@/types/corporate';

/**
 * Corporate Account API
 * Handles all corporate account related operations
 */
export const CorporateAPI = {
  /**
   * Register a new corporate account
   */
  register: async (data: CorporateRegistrationData): Promise<{ accountId: string; status: string }> => {
    const formData = new FormData();
    
    // Add all fields to FormData
    if (data.userId) formData.append('userId', data.userId);
    formData.append('companyName', data.companyName);
    formData.append('companyRegistrationNumber', data.companyRegistrationNumber);
    if (data.tinNumber) formData.append('tinNumber', data.tinNumber);
    formData.append('businessAddress', data.businessAddress);
    formData.append('division', data.division);
    formData.append('district', data.district);
    if (data.upazila) formData.append('upazila', data.upazila);
    if (data.postalCode) formData.append('postalCode', data.postalCode);
    formData.append('authorizedPersonName', data.authorizedPersonName);
    formData.append('authorizedPersonEmail', data.authorizedPersonEmail);
    formData.append('authorizedPersonPhone', data.authorizedPersonPhone);
    formData.append('companyEmail', data.companyEmail);
    formData.append('termsAccepted', data.termsAccepted.toString());
    
    // Add documents if provided
    if (data.documents?.tradeLicense) {
      formData.append('tradeLicense', data.documents.tradeLicense);
    }
    if (data.documents?.tinCertificate) {
      formData.append('tinCertificate', data.documents.tinCertificate);
    }
    if (data.documents?.vatCertificate) {
      formData.append('vatCertificate', data.documents.vatCertificate);
    }
    
    const response = await apiClient.post<{ accountId: string; status: string }>('/corporate/register', formData);
    return response;
  },

  /**
   * Get corporate account status
   */
  getAccountStatus: async (accountId: string): Promise<CorporateAccountStatus> => {
    const response = await apiClient.get<CorporateAccountStatus>(`/corporate/${accountId}/status`);
    return response;
  },

  /**
   * Get corporate account details
   */
  getAccount: async (accountId: string): Promise<CorporateAccount> => {
    const response = await apiClient.get<CorporateAccount>(`/corporate/${accountId}`);
    return response;
  },

  /**
   * Get corporate account for authenticated user
   */
  getMyAccount: async (): Promise<{ id: string; account: CorporateAccount }> => {
    const response = await apiClient.get<{ id: string; account: CorporateAccount }>('/corporate/my-account');
    return response;
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (accountId: string): Promise<CorporateDashboardStats> => {
    const response = await apiClient.get<CorporateDashboardStats>(`/corporate/${accountId}/dashboard`);
    return response;
  },
};

/**
 * Corporate User Management API
 */
export const CorporateUserAPI = {
  /**
   * Get all users in a corporate account
   */
  getUsers: async (accountId: string): Promise<CorporateUser[]> => {
    const response: any = await apiClient.get<{ corporateUsers: CorporateUser[] }>(`/corporate/${accountId}/users`);
    return response.corporateUsers;
  },

  /**
   * Add a new user to corporate account
   */
  addUser: async (accountId: string, data: { userId: string; role: string }): Promise<CorporateUser> => {
    const response = await apiClient.post<CorporateUser>(`/corporate/${accountId}/users`, data);
    return response;
  },

  /**
   * Update user role
   */
  updateUserRole: async (accountId: string, userId: string, role: string): Promise<CorporateUser> => {
    const response = await apiClient.put<CorporateUser>(`/corporate/${accountId}/users/${userId}`, { role });
    return response;
  },

  /**
   * Remove user from corporate account
   */
  removeUser: async (accountId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/corporate/${accountId}/users/${userId}`);
  },

  /**
   * Get user activity log
   */
  getActivityLog: async (accountId: string, userId?: string): Promise<any[]> => {
    const url = userId
      ? `/corporate/${accountId}/users/${userId}/activity`
      : `/corporate/${accountId}/users/activity`;
    const response = await apiClient.get<any[]>(url);
    return response;
  },
};

/**
 * Corporate Pricing API
 */
export const CorporatePricingAPI = {
  /**
   * Get products with corporate pricing
   */
  getProducts: async (accountId: string, filters?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: CorporateProduct[]; total: number }> => {
    const params = new URLSearchParams();
    params.append('accountId', accountId);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const url = `/corporate/pricing/products?${queryString}`;
    
    const response: any = await apiClient.get<{ products: CorporateProduct[]; total: number }>(url);
    return response;
  },

  /**
   * Get product categories
   */
  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/corporate/pricing/categories');
    return response;
  },
};

/**
 * Purchase Order Management API
 */
export const PurchaseOrderAPI = {
  /**
   * Get all purchase orders for a corporate account
   */
  getOrders: async (accountId: string, filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PurchaseOrder[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const url = queryString
      ? `/corporate/${accountId}/purchase-orders?${queryString}`
      : `/corporate/${accountId}/purchase-orders`;
    
    const response: any = await apiClient.get<{ purchaseOrders: PurchaseOrder[]; pagination: any }>(url);
    return response.purchaseOrders;
  },

  /**
   * Get a specific purchase order
   */
  getOrder: async (accountId: string, orderId: string): Promise<PurchaseOrder> => {
    const response = await apiClient.get<PurchaseOrder>(`/corporate/${accountId}/purchase-orders/${orderId}`);
    return response;
  },

  /**
   * Create a new purchase order
   */
  createOrder: async (accountId: string, data: CreatePurchaseOrderData): Promise<PurchaseOrder> => {
    const formData = new FormData();
    
    // Add items
    formData.append('items', JSON.stringify(data.items));
    if (data.notes) formData.append('notes', data.notes);
    
    // Add document if provided
    if (data.document) {
      formData.append('document', data.document);
    }
    
    const response = await apiClient.post<PurchaseOrder>(`/corporate/${accountId}/purchase-orders`, formData);
    return response;
  },

  /**
   * Approve a purchase order
   */
  approveOrder: async (accountId: string, orderId: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/corporate/${accountId}/purchase-orders/${orderId}/approve`);
    return response;
  },

  /**
   * Reject a purchase order
   */
  rejectOrder: async (accountId: string, orderId: string, reason?: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/corporate/${accountId}/purchase-orders/${orderId}/reject`, { reason });
    return response;
  },

  /**
   * Cancel a purchase order
   */
  cancelOrder: async (accountId: string, orderId: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(`/corporate/${accountId}/purchase-orders/${orderId}/cancel`);
    return response;
  },
};

/**
 * Invoice Management API
 */
export const InvoiceAPI = {
  /**
   * Get all invoices for a corporate account
   */
  getInvoices: async (accountId: string, filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<Invoice[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const url = queryString
      ? `/corporate/${accountId}/invoices?${queryString}`
      : `/corporate/${accountId}/invoices`;
    
    const response: any = await apiClient.get<{ invoices: Invoice[]; pagination: any }>(url);
    return response.invoices;
  },

  /**
   * Get a specific invoice
   */
  getInvoice: async (accountId: string, invoiceId: string): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(`/corporate/${accountId}/invoices/${invoiceId}`);
    return response;
  },

  /**
   * Download invoice PDF
   */
  downloadInvoice: async (accountId: string, invoiceId: string): Promise<Blob> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const response = await fetch(`${API_BASE_URL}/corporate/${accountId}/invoices/${invoiceId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new ApiError('Failed to download invoice', response.status);
    }
    
    return response.blob();
  },
};

/**
 * Credit Management API
 */
export const CreditAPI = {
  /**
   * Get credit limit information
   */
  getCreditLimit: async (accountId: string): Promise<CreditLimit> => {
    const response = await apiClient.get<CreditLimit>(`/corporate/${accountId}/credit-limit`);
    return response;
  },

  /**
   * Get credit history
   */
  getCreditHistory: async (accountId: string): Promise<CreditRequest[]> => {
    const response = await apiClient.get<CreditRequest[]>(`/corporate/${accountId}/credit-history`);
    return response;
  },

  /**
   * Request credit increase
   */
  requestCreditIncrease: async (accountId: string, data: CreateCreditRequestData): Promise<CreditRequest> => {
    const response = await apiClient.post<CreditRequest>(`/corporate/${accountId}/credit-request`, data);
    return response;
  },
};

/**
 * Notification API
 */
export const NotificationAPI = {
  /**
   * Get all notifications for a corporate account
   */
  getNotifications: async (accountId: string): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>(`/corporate/${accountId}/notifications`);
    return response;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (accountId: string, notificationId: string): Promise<void> => {
    await apiClient.put(`/corporate/${accountId}/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (accountId: string): Promise<void> => {
    await apiClient.put(`/corporate/${accountId}/notifications/read-all`);
  },
};

export default CorporateAPI;
