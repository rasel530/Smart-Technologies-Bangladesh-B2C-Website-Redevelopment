/**
 * useOrderManagement Hook
 * 
 * Custom hook for order management operations including modifications,
 * cancellations, fulfillments, notes, and bulk actions.
 */

import { useState, useCallback } from 'react';
import orderManagementApi, {
  CreateModificationRequest,
  ApproveModificationRequest,
  RejectModificationRequest,
  CreateCancellationRequest,
  ApproveCancellationRequest,
  RejectCancellationRequest,
  CreateFulfillmentRequest,
  UpdateFulfillmentRequest,
  CreateNoteRequest,
  UpdateNoteRequest,
  BulkUpdateStatusRequest,
  BulkCancelRequest,
  BulkExportRequest,
  OrderModification,
  OrderCancellation,
  OrderFulfillment,
  OrderNote,
  OrderStatusHistory,
  CourierService,
  GetAllModificationsResponse,
  GetAllCancellationsResponse,
  ModificationType,
} from '@/lib/api/orderManagement';

interface UseOrderManagementReturn {
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Modification operations
  requestModification: (orderId: string, data: CreateModificationRequest) => Promise<{ modificationId: string; status: string } | null>;
  approveModification: (orderId: string, modificationId: string, data: ApproveModificationRequest) => Promise<boolean>;
  rejectModification: (orderId: string, modificationId: string, data: RejectModificationRequest) => Promise<boolean>;
  
  // Cancellation operations
  requestCancellation: (orderId: string, data: CreateCancellationRequest) => Promise<{ cancellationId: string; status: string } | null>;
  approveCancellation: (orderId: string, cancellationId: string, data: ApproveCancellationRequest) => Promise<boolean>;
  rejectCancellation: (orderId: string, cancellationId: string, data: RejectCancellationRequest) => Promise<boolean>;
  
  // Fulfillment operations
  createFulfillment: (orderId: string, data: CreateFulfillmentRequest) => Promise<{ fulfillmentId: string; trackingNumber?: string } | null>;
  updateFulfillment: (orderId: string, fulfillmentId: string, data: UpdateFulfillmentRequest) => Promise<boolean>;
  
  // Note operations
  addOrderNote: (orderId: string, data: CreateNoteRequest) => Promise<{ noteId: string } | null>;
  updateOrderNote: (orderId: string, noteId: string, data: UpdateNoteRequest) => Promise<boolean>;
  deleteOrderNote: (orderId: string, noteId: string) => Promise<boolean>;
  
  // Data fetching
  getOrderStatusHistory: (orderId: string) => Promise<OrderStatusHistory[] | null>;
  getOrderModifications: (orderId: string) => Promise<OrderModification[] | null>;
  getAllModifications: (params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
    type?: ModificationType;
    page?: number;
    limit?: number;
  }) => Promise<GetAllModificationsResponse | null>;
  getOrderCancellations: (orderId: string) => Promise<OrderCancellation[] | null>;
  getAllCancellations: (params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'processed';
    type?: 'customer_request' | 'fraud' | 'out_of_stock' | 'payment_failed' | 'duplicate' | 'other';
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<GetAllCancellationsResponse | null>;
  getOrderFulfillments: (orderId: string) => Promise<OrderFulfillment[] | null>;
  getOrderNotes: (orderId: string, type?: 'internal' | 'customer' | 'system' | 'fulfillment') => Promise<OrderNote[] | null>;
  
  // Bulk operations
  bulkUpdateStatus: (data: BulkUpdateStatusRequest) => Promise<{ updatedCount: number; failedOrders: any[] } | null>;
  bulkCancelOrders: (data: BulkCancelRequest) => Promise<{ cancelledCount: number; failedOrders: any[] } | null>;
  bulkExportOrders: (data: BulkExportRequest) => Promise<{ downloadUrl: string; exportId: string; format: string; orderCount: number } | null>;
  
  // Courier operations
  getCourierServices: (isActive?: boolean) => Promise<CourierService[] | null>;
  
  // Error handling
  clearError: () => void;
}

export const useOrderManagement = (): UseOrderManagementReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeOperation = useCallback(async <T,>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T | null> => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, []);

  // Modification operations
  const requestModification = useCallback(async (
    orderId: string,
    data: CreateModificationRequest
  ) => {
    return executeOperation(
      () => orderManagementApi.requestModification(orderId, data),
      'Failed to request order modification'
    );
  }, [executeOperation]);

  const approveModification = useCallback(async (
    orderId: string,
    modificationId: string,
    data: ApproveModificationRequest
  ) => {
    const result = await executeOperation(
      () => orderManagementApi.approveModification(orderId, modificationId, data),
      'Failed to approve modification'
    );
    return result !== null;
  }, [executeOperation]);

  const rejectModification = useCallback(async (
    orderId: string,
    modificationId: string,
    data: RejectModificationRequest
  ) => {
    const result = await executeOperation(
      () => orderManagementApi.rejectModification(orderId, modificationId, data),
      'Failed to reject modification'
    );
    return result !== null;
  }, [executeOperation]);

  // Cancellation operations
  const requestCancellation = useCallback(async (
    orderId: string,
    data: CreateCancellationRequest
  ) => {
    return executeOperation(
      () => orderManagementApi.requestCancellation(orderId, data),
      'Failed to request order cancellation'
    );
  }, [executeOperation]);

  const approveCancellation = useCallback(async (
    orderId: string,
    cancellationId: string,
    data: ApproveCancellationRequest
  ) => {
    const result = await executeOperation(
      () => orderManagementApi.approveCancellation(orderId, cancellationId, data),
      'Failed to approve cancellation'
    );
    return result !== null;
  }, [executeOperation]);

  const rejectCancellation = useCallback(async (
    orderId: string,
    cancellationId: string,
    data: RejectCancellationRequest
  ) => {
    const result = await executeOperation(
      () => orderManagementApi.rejectCancellation(orderId, cancellationId, data),
      'Failed to reject cancellation'
    );
    return result !== null;
  }, [executeOperation]);

  // Fulfillment operations
  const createFulfillment = useCallback(async (
    orderId: string,
    data: CreateFulfillmentRequest
  ) => {
    return executeOperation(
      () => orderManagementApi.createFulfillment(orderId, data),
      'Failed to create fulfillment'
    );
  }, [executeOperation]);

  const updateFulfillment = useCallback(async (
    orderId: string,
    fulfillmentId: string,
    data: UpdateFulfillmentRequest
  ) => {
    const result = await executeOperation(
      () => orderManagementApi.updateFulfillment(orderId, fulfillmentId, data),
      'Failed to update fulfillment'
    );
    return result !== null;
  }, [executeOperation]);

  // Note operations
  const addOrderNote = useCallback(async (
    orderId: string,
    data: CreateNoteRequest
  ) => {
    return executeOperation(
      () => orderManagementApi.addOrderNote(orderId, data),
      'Failed to add order note'
    );
  }, [executeOperation]);

  const updateOrderNote = useCallback(async (
    orderId: string,
    noteId: string,
    data: UpdateNoteRequest
  ) => {
    const result = await executeOperation(
      () => orderManagementApi.updateOrderNote(orderId, noteId, data),
      'Failed to update order note'
    );
    return result !== null;
  }, [executeOperation]);

  const deleteOrderNote = useCallback(async (
    orderId: string,
    noteId: string
  ) => {
    const result = await executeOperation(
      () => orderManagementApi.deleteOrderNote(orderId, noteId),
      'Failed to delete order note'
    );
    return result !== null;
  }, [executeOperation]);

  // Data fetching
  const getOrderStatusHistory = useCallback(async (orderId: string) => {
    return executeOperation(
      () => orderManagementApi.getOrderStatusHistory(orderId),
      'Failed to fetch order status history'
    );
  }, [executeOperation]);

  const getOrderModifications = useCallback(async (orderId: string) => {
    return executeOperation(
      () => orderManagementApi.getOrderModifications(orderId),
      'Failed to fetch order modifications'
    );
  }, [executeOperation]);

  const getAllModifications = useCallback(async (params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
    type?: ModificationType;
    page?: number;
    limit?: number;
  }) => {
    return executeOperation(
      () => orderManagementApi.getAllModifications(params),
      'Failed to fetch all modifications'
    );
  }, [executeOperation]);

  const getAllCancellations = useCallback(async (params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'processed';
    type?: 'customer_request' | 'fraud' | 'out_of_stock' | 'payment_failed' | 'duplicate' | 'other';
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    return executeOperation(
      () => orderManagementApi.getAllCancellations(params),
      'Failed to fetch all cancellations'
    );
  }, [executeOperation]);

  const getOrderCancellations = useCallback(async (orderId: string) => {
    return executeOperation(
      () => orderManagementApi.getOrderCancellations(orderId),
      'Failed to fetch order cancellations'
    );
  }, [executeOperation]);

  const getOrderFulfillments = useCallback(async (orderId: string) => {
    return executeOperation(
      () => orderManagementApi.getOrderFulfillments(orderId),
      'Failed to fetch order fulfillments'
    );
  }, [executeOperation]);

  const getOrderNotes = useCallback(async (
    orderId: string,
    type?: 'internal' | 'customer' | 'system' | 'fulfillment'
  ) => {
    return executeOperation(
      () => orderManagementApi.getOrderNotes(orderId, type),
      'Failed to fetch order notes'
    );
  }, [executeOperation]);

  // Bulk operations
  const bulkUpdateStatus = useCallback(async (data: BulkUpdateStatusRequest) => {
    return executeOperation(
      () => orderManagementApi.bulkUpdateStatus(data),
      'Failed to bulk update order status'
    );
  }, [executeOperation]);

  const bulkCancelOrders = useCallback(async (data: BulkCancelRequest) => {
    return executeOperation(
      () => orderManagementApi.bulkCancelOrders(data),
      'Failed to bulk cancel orders'
    );
  }, [executeOperation]);

  const bulkExportOrders = useCallback(async (data: BulkExportRequest) => {
    return executeOperation(
      () => orderManagementApi.bulkExportOrders(data),
      'Failed to bulk export orders'
    );
  }, [executeOperation]);

  // Courier operations
  const getCourierServices = useCallback(async (isActive?: boolean) => {
    return executeOperation(
      () => orderManagementApi.getCourierServices(isActive),
      'Failed to fetch courier services'
    );
  }, [executeOperation]);

  return {
    isLoading,
    error,
    
    // Modification operations
    requestModification,
    approveModification,
    rejectModification,
    
    // Cancellation operations
    requestCancellation,
    approveCancellation,
    rejectCancellation,
    
    // Fulfillment operations
    createFulfillment,
    updateFulfillment,
    
    // Note operations
    addOrderNote,
    updateOrderNote,
    deleteOrderNote,
    
    // Data fetching
    getOrderStatusHistory,
    getOrderModifications,
    getAllModifications,
    getOrderCancellations,
    getAllCancellations,
    getOrderFulfillments,
    getOrderNotes,
    
    // Bulk operations
    bulkUpdateStatus,
    bulkCancelOrders,
    bulkExportOrders,
    
    // Courier operations
    getCourierServices,
    
    // Error handling
    clearError,
  };
};

export default useOrderManagement;
