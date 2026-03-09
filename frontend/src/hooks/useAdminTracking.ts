/**
 * useAdminTracking Hook
 * 
 * Custom hook for admin tracking operations including courier services,
 * tracking analytics, tracking issues, delivery performance, and bulk operations.
 */

import { useState, useCallback } from 'react';
import orderTrackingApi, {
  CourierService,
  TrackingAnalytics,
  TrackingIssue,
  DeliveryPerformance,
  DeliveryConfirmation,
  TrackingFilters,
  TestCourierConnectionRequest,
  BulkSyncRequest,
  BulkUpdateRequest,
  InvestigateIssuesRequest,
  ResolveIssuesRequest,
  CourierTestResult,
} from '@/lib/api/orderTracking';

interface UseAdminTrackingReturn {
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Data states
  courierServices: CourierService[];
  trackingAnalytics: TrackingAnalytics | null;
  trackingIssues: TrackingIssue[];
  deliveryPerformance: DeliveryPerformance | null;
  deliveryConfirmations: DeliveryConfirmation[];
  
  // Courier service operations
  getCourierServices: (isActive?: boolean) => Promise<void>;
  createCourierService: (data: {
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
  }) => Promise<boolean>;
  updateCourierService: (id: string, data: {
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
  }) => Promise<boolean>;
  deleteCourierService: (id: string) => Promise<boolean>;
  testCourierConnection: (id: string, data?: TestCourierConnectionRequest) => Promise<CourierTestResult | null>;
  
  // Tracking analytics operations
  getTrackingAnalytics: (filters?: TrackingFilters) => Promise<void>;
  
  // Tracking issues operations
  getTrackingIssues: (filters?: TrackingFilters) => Promise<void>;
  
  // Delivery performance operations
  getDeliveryPerformance: (filters?: TrackingFilters) => Promise<void>;
  
  // Bulk operations
  syncAllTracking: (data?: BulkSyncRequest) => Promise<{
    syncedCount: number;
    failedCount: number;
    errors: Array<{ orderId: string; orderNumber: string; error: string }>;
  } | null>;
  bulkUpdateTracking: (data: BulkUpdateRequest) => Promise<{
    updatedCount: number;
    failedCount: number;
    errors: Array<{ orderId: string; error: string }>;
  } | null>;
  investigateIssues: (data: InvestigateIssuesRequest) => Promise<{
    investigatedCount: number;
    failedCount: number;
    errors: Array<{ orderId: string; error: string }>;
  } | null>;
  resolveIssues: (data: ResolveIssuesRequest) => Promise<{
    resolvedCount: number;
    failedCount: number;
    errors: Array<{ orderId: string; error: string }>;
  } | null>;
  
  // Error handling
  clearError: () => void;
}

export const useAdminTracking = (): UseAdminTrackingReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [courierServices, setCourierServices] = useState<CourierService[]>([]);
  const [trackingAnalytics, setTrackingAnalytics] = useState<TrackingAnalytics | null>(null);
  const [trackingIssues, setTrackingIssues] = useState<TrackingIssue[]>([]);
  const [deliveryPerformance, setDeliveryPerformance] = useState<DeliveryPerformance | null>(null);
  const [deliveryConfirmations, setDeliveryConfirmations] = useState<DeliveryConfirmation[]>([]);

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

  // Courier service operations
  const getCourierServices = useCallback(async (isActive?: boolean) => {
    const result = await executeOperation(
      () => orderTrackingApi.getCourierServices(isActive),
      'Failed to fetch courier services'
    );
    if (result) {
      setCourierServices(result);
    }
  }, [executeOperation]);

  const createCourierService = useCallback(async (data: {
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
  }) => {
    const result = await executeOperation(
      () => orderTrackingApi.createCourierService(data),
      'Failed to create courier service'
    );
    if (result) {
      // Refresh courier services after creating
      await getCourierServices();
      return true;
    }
    return false;
  }, [executeOperation, getCourierServices]);

  const updateCourierService = useCallback(async (
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
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.updateCourierService(id, data),
      'Failed to update courier service'
    );
    if (result) {
      // Refresh courier services after updating
      await getCourierServices();
      return true;
    }
    return false;
  }, [executeOperation, getCourierServices]);

  const deleteCourierService = useCallback(async (id: string) => {
    const result = await executeOperation(
      () => orderTrackingApi.deleteCourierService(id),
      'Failed to delete courier service'
    );
    if (result) {
      // Refresh courier services after deleting
      await getCourierServices();
      return true;
    }
    return false;
  }, [executeOperation, getCourierServices]);

  const testCourierConnection = useCallback(async (
    id: string,
    data?: TestCourierConnectionRequest
  ) => {
    const result = await executeOperation(
      () => orderTrackingApi.testCourierConnection(id, data),
      'Failed to test courier connection'
    );
    return result;
  }, [executeOperation]);

  // Tracking analytics operations
  const getTrackingAnalytics = useCallback(async (filters?: TrackingFilters) => {
    const result = await executeOperation(
      () => orderTrackingApi.getTrackingAnalytics(filters),
      'Failed to fetch tracking analytics'
    );
    if (result) {
      setTrackingAnalytics(result);
    }
  }, [executeOperation]);

  // Tracking issues operations
  const getTrackingIssues = useCallback(async (filters?: TrackingFilters) => {
    const result = await executeOperation(
      () => orderTrackingApi.getTrackingIssues(filters),
      'Failed to fetch tracking issues'
    );
    if (result) {
      setTrackingIssues(result);
    }
  }, [executeOperation]);

  // Delivery performance operations
  const getDeliveryPerformance = useCallback(async (filters?: TrackingFilters) => {
    const result = await executeOperation(
      () => orderTrackingApi.getDeliveryPerformance(filters),
      'Failed to fetch delivery performance'
    );
    if (result) {
      setDeliveryPerformance(result);
    }
  }, [executeOperation]);

  // Bulk operations
  const syncAllTracking = useCallback(async (data?: BulkSyncRequest) => {
    const result = await executeOperation(
      () => orderTrackingApi.syncAllTracking(data),
      'Failed to sync all tracking'
    );
    return result;
  }, [executeOperation]);

  const bulkUpdateTracking = useCallback(async (data: BulkUpdateRequest) => {
    const result = await executeOperation(
      () => orderTrackingApi.bulkUpdateTracking(data),
      'Failed to bulk update tracking'
    );
    return result;
  }, [executeOperation]);

  const investigateIssues = useCallback(async (data: InvestigateIssuesRequest) => {
    const result = await executeOperation(
      () => orderTrackingApi.investigateIssues(data),
      'Failed to investigate issues'
    );
    return result;
  }, [executeOperation]);

  const resolveIssues = useCallback(async (data: ResolveIssuesRequest) => {
    const result = await executeOperation(
      () => orderTrackingApi.resolveIssues(data),
      'Failed to resolve issues'
    );
    return result;
  }, [executeOperation]);

  return {
    // Loading states
    isLoading,
    error,
    
    // Data states
    courierServices,
    trackingAnalytics,
    trackingIssues,
    deliveryPerformance,
    deliveryConfirmations,
    
    // Courier service operations
    getCourierServices,
    createCourierService,
    updateCourierService,
    deleteCourierService,
    testCourierConnection,
    
    // Tracking analytics operations
    getTrackingAnalytics,
    
    // Tracking issues operations
    getTrackingIssues,
    
    // Delivery performance operations
    getDeliveryPerformance,
    
    // Bulk operations
    syncAllTracking,
    bulkUpdateTracking,
    investigateIssues,
    resolveIssues,

    // Error handling
    clearError,
  };
};

export default useAdminTracking;
