/**
 * Cart-Wishlist Integration Zustand Store
 *
 * State management for cart-wishlist integration features
 * Following Phase 6 Milestone 3 specifications
 */

import { create } from 'zustand';
import {
  SyncStatus,
  PendingSyncOperation,
  SyncConflict,
  BehaviorAnalytics,
  ConversionAnalytics,
  AbandonmentAnalytics,
  PerformanceMetrics,
} from '@/lib/api/cartWishlistApi';
import cartWishlistApi from '@/lib/api/cartWishlistApi';

// ============================================================================
// Types
// ============================================================================

export interface SyncStatusInfo {
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  lastSyncAt: string;
  pendingOperations: number;
  syncId?: string;
}

export interface ConflictInfo {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

export interface OfflineOperation {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// ============================================================================
// Store State Interface
// ============================================================================

interface CartWishlistStoreState {
  // Sync status
  syncStatus: SyncStatusInfo;
  conflicts: ConflictInfo[];
  offlineQueue: OfflineOperation[];
  
  // UI state
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  
  // Analytics data
  behaviorAnalytics: BehaviorAnalytics | null;
  conversionAnalytics: ConversionAnalytics | null;
  abandonmentAnalytics: AbandonmentAnalytics | null;
  performanceMetrics: PerformanceMetrics | null;
  
  // Tracking
  lastSyncCheck: number | null;
}

// ============================================================================
// Store Actions Interface
// ============================================================================

interface CartWishlistStoreActions {
  // Sync status actions
  setSyncStatus: (status: SyncStatusInfo) => void;
  refreshSyncStatus: () => Promise<void>;
  triggerManualSync: () => Promise<void>;
  
  // Conflict actions
  addConflict: (conflict: ConflictInfo) => void;
  removeConflict: (conflictId: string) => void;
  resolveConflict: (conflictId: string, resolution: 'keep_cart' | 'keep_wishlist' | 'merge') => Promise<void>;
  loadConflicts: () => Promise<void>;
  
  // Offline queue actions
  addToOfflineQueue: (operation: OfflineOperation) => void;
  syncOfflineQueue: () => Promise<void>;
  clearOfflineQueue: () => void;
  removeFromOfflineQueue: (operationId: string) => void;
  
  // Analytics actions
  loadBehaviorAnalytics: (params?: any) => Promise<void>;
  loadConversionAnalytics: () => Promise<void>;
  loadAbandonmentAnalytics: () => Promise<void>;
  loadPerformanceMetrics: () => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: CartWishlistStoreState = {
  syncStatus: {
    status: 'pending',
    lastSyncAt: new Date().toISOString(),
    pendingOperations: 0,
  },
  conflicts: [],
  offlineQueue: [],
  isLoading: false,
  isSyncing: false,
  error: null,
  behaviorAnalytics: null,
  conversionAnalytics: null,
  abandonmentAnalytics: null,
  performanceMetrics: null,
  lastSyncCheck: null,
};

// ============================================================================
// Create Store
// ============================================================================

export const useCartWishlistStore = create<
  CartWishlistStoreState & CartWishlistStoreActions
>()((set, get) => ({
  ...initialState,

  /**
   * Set sync status
   */
  setSyncStatus: (status: SyncStatusInfo) => {
    set({ syncStatus: status });
  },

  /**
   * Refresh sync status from server
   */
  refreshSyncStatus: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const status = await cartWishlistApi.getSyncStatus();
      set({
        syncStatus: {
          status: status.status,
          lastSyncAt: status.lastSyncAt,
          pendingOperations: status.pendingOperations,
          syncId: status.syncId,
        },
        isLoading: false,
        lastSyncCheck: Date.now(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh sync status',
      });
    }
  },

  /**
   * Trigger manual sync
   */
  triggerManualSync: async () => {
    set({ isSyncing: true, error: null });
    
    try {
      const status = await cartWishlistApi.triggerSync();
      set({
        syncStatus: {
          status: status.status,
          lastSyncAt: status.lastSyncAt,
          pendingOperations: status.pendingOperations,
          syncId: status.syncId,
        },
        isSyncing: false,
        lastSyncCheck: Date.now(),
      });
    } catch (error) {
      set({
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Failed to trigger sync',
      });
    }
  },

  /**
   * Add conflict to list
   */
  addConflict: (conflict: ConflictInfo) => {
    set((state) => ({
      conflicts: [...state.conflicts, conflict],
    }));
  },

  /**
   * Remove conflict from list
   */
  removeConflict: (conflictId: string) => {
    set((state) => ({
      conflicts: state.conflicts.filter((c) => c.id !== conflictId),
    }));
  },

  /**
   * Resolve a conflict
   */
  resolveConflict: async (
    conflictId: string,
    resolution: 'keep_cart' | 'keep_wishlist' | 'merge'
  ) => {
    set({ isLoading: true, error: null });
    
    try {
      await cartWishlistApi.resolveConflict(conflictId, resolution);
      set((state) => ({
        conflicts: state.conflicts.filter((c) => c.id !== conflictId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to resolve conflict',
      });
    }
  },

  /**
   * Load all conflicts from server
   */
  loadConflicts: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const conflicts = await cartWishlistApi.getSyncConflicts();
      set({
        conflicts: conflicts.map((c) => ({
          id: c.id,
          type: c.type,
          data: c.data,
          timestamp: c.timestamp,
        })),
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load conflicts',
      });
    }
  },

  /**
   * Add operation to offline queue
   */
  addToOfflineQueue: (operation: OfflineOperation) => {
    // Add to local state
    set((state) => ({
      offlineQueue: [...state.offlineQueue, operation],
    }));
    
    // Also persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        const existingQueue = JSON.parse(
          localStorage.getItem('cartWishlistOfflineQueue') || '[]'
        );
        existingQueue.push(operation);
        localStorage.setItem(
          'cartWishlistOfflineQueue',
          JSON.stringify(existingQueue)
        );
      } catch (error) {
        console.error('[CartWishlistStore] Error saving to localStorage:', error);
      }
    }
  },

  /**
   * Sync offline queue with server
   */
  syncOfflineQueue: async () => {
    const state = get();
    
    if (state.offlineQueue.length === 0) {
      return;
    }
    
    set({ isSyncing: true, error: null });
    
    try {
      // Sync all pending operations
      await cartWishlistApi.syncOfflineChanges(state.offlineQueue);
      
      // Clear queue after successful sync
      set({
        offlineQueue: [],
        isSyncing: false,
        syncStatus: {
          ...state.syncStatus,
          pendingOperations: 0,
        },
      });
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cartWishlistOfflineQueue');
      }
    } catch (error) {
      set({
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Failed to sync offline queue',
      });
    }
  },

  /**
   * Clear offline queue
   */
  clearOfflineQueue: () => {
    set({ offlineQueue: [] });
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cartWishlistOfflineQueue');
    }
  },

  /**
   * Remove operation from offline queue
   */
  removeFromOfflineQueue: (operationId: string) => {
    set((state) => ({
      offlineQueue: state.offlineQueue.filter((op) => op.id !== operationId),
    }));
    
    if (typeof window !== 'undefined') {
      try {
        const existingQueue = JSON.parse(
          localStorage.getItem('cartWishlistOfflineQueue') || '[]'
        );
        const filteredQueue = existingQueue.filter(
          (op: any) => op.id !== operationId
        );
        localStorage.setItem(
          'cartWishlistOfflineQueue',
          JSON.stringify(filteredQueue)
        );
      } catch (error) {
        console.error('[CartWishlistStore] Error updating localStorage:', error);
      }
    }
  },

  /**
   * Load behavior analytics
   */
  loadBehaviorAnalytics: async (params?: any) => {
    set({ isLoading: true, error: null });
    
    try {
      const analytics = await cartWishlistApi.getBehaviorAnalytics(params);
      set({
        behaviorAnalytics: analytics,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load behavior analytics',
      });
    }
  },

  /**
   * Load conversion analytics
   */
  loadConversionAnalytics: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const analytics = await cartWishlistApi.getConversionAnalytics();
      set({
        conversionAnalytics: analytics,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load conversion analytics',
      });
    }
  },

  /**
   * Load abandonment analytics
   */
  loadAbandonmentAnalytics: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const analytics = await cartWishlistApi.getAbandonmentAnalytics();
      set({
        abandonmentAnalytics: analytics,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load abandonment analytics',
      });
    }
  },

  /**
   * Load performance metrics
   */
  loadPerformanceMetrics: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const metrics = await cartWishlistApi.getPerformanceMetrics();
      set({
        performanceMetrics: metrics,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load performance metrics',
      });
    }
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cartWishlistOfflineQueue');
    }
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectSyncStatus = (state: CartWishlistStoreState) => state.syncStatus;
export const selectConflicts = (state: CartWishlistStoreState) => state.conflicts;
export const selectOfflineQueue = (state: CartWishlistStoreState) => state.offlineQueue;
export const selectIsSyncing = (state: CartWishlistStoreState) => state.isSyncing;
export const selectPendingOperationsCount = (state: CartWishlistStoreState) =>
  state.syncStatus.pendingOperations;

export default useCartWishlistStore;
