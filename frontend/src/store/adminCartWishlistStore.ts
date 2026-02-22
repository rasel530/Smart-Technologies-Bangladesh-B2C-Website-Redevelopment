/**
 * Admin Cart-Wishlist Integration Zustand Store
 *
 * State management for admin cart-wishlist integration features
 * Following Phase 6 Milestone 3 specifications
 */

import { create } from 'zustand';
import {
  SyncDashboardData,
  ConflictData,
  SystemAnalytics,
  BehaviorAnalytics,
  ConversionAnalytics,
  AbandonmentAnalytics,
  PerformanceMetrics,
  MoveHistoryResponse,
  UserBehaviorData,
  UserSearchResult,
} from '@/lib/api/admin/cartWishlist';
import adminCartWishlistApi from '@/lib/api/admin/cartWishlist';

// ============================================================================
// Types
// ============================================================================

export interface SyncStatusState {
  totalSyncs: number;
  activeSyncs: number;
  completedSyncs: number;
  failedSyncs: number;
  recentSyncs: Array<{
    userId: string;
    userName: string;
    status: string;
    lastSyncAt: string;
    errorMessage?: string;
  }>;
  performanceMetrics: {
    averageSyncTime: number;
    successRate: number;
  };
}

export interface ConflictState {
  conflicts: ConflictData[];
  selectedConflictIds: Set<string>;
}

export interface AnalyticsState {
  systemAnalytics: SystemAnalytics | null;
  behaviorAnalytics: BehaviorAnalytics | null;
  conversionAnalytics: ConversionAnalytics | null;
  abandonmentAnalytics: AbandonmentAnalytics | null;
  performanceMetrics: PerformanceMetrics | null;
}

export interface MoveHistoryState {
  history: Array<{
    id: string;
    userId: string;
    userName: string;
    productId: string;
    productName: string;
    moveType: 'cart_to_wishlist' | 'wishlist_to_cart';
    quantity: number;
    sourceId: string;
    destinationId: string;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  filters: {
    userId?: string;
    productId?: string;
    moveType?: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface UserBehaviorState {
  selectedUser: UserBehaviorData | null;
  searchResults: UserSearchResult[];
}

// ============================================================================
// Store State Interface
// ============================================================================

interface AdminCartWishlistStoreState {
  // Sync status
  syncStatus: SyncStatusState | null;
  
  // Conflicts
  conflicts: ConflictState;
  
  // Analytics
  analytics: AnalyticsState;
  
  // Move history
  moveHistory: MoveHistoryState;
  
  // User behavior
  userBehavior: UserBehaviorState;
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Store Actions Interface
// ============================================================================

interface AdminCartWishlistStoreActions {
  // Sync status actions
  setSyncStatus: (status: SyncStatusState) => void;
  fetchSyncStatus: () => Promise<void>;
  fetchRecentSyncs: (params?: { limit?: number; status?: string }) => Promise<void>;
  
  // Conflict actions
  setConflicts: (conflicts: ConflictData[]) => void;
  fetchConflicts: (params?: { userId?: string; status?: string }) => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'keep_cart' | 'keep_wishlist' | 'merge', adminNote?: string) => Promise<void>;
  bulkResolveConflicts: (conflictIds: string[], resolution: 'keep_cart' | 'keep_wishlist' | 'merge', adminNote?: string) => Promise<void>;
  toggleConflictSelection: (conflictId: string) => void;
  selectAllConflicts: () => void;
  clearConflictSelection: () => void;
  
  // Analytics actions
  setSystemAnalytics: (analytics: SystemAnalytics) => void;
  setBehaviorAnalytics: (analytics: BehaviorAnalytics) => void;
  setConversionAnalytics: (analytics: ConversionAnalytics) => void;
  setAbandonmentAnalytics: (analytics: AbandonmentAnalytics) => void;
  setPerformanceMetrics: (metrics: PerformanceMetrics) => void;
  fetchSystemAnalytics: (params?: { startDate?: string; endDate?: string }) => Promise<void>;
  fetchBehaviorAnalytics: (params?: { startDate?: string; endDate?: string }) => Promise<void>;
  fetchConversionAnalytics: () => Promise<void>;
  fetchAbandonmentAnalytics: () => Promise<void>;
  fetchPerformanceMetrics: () => Promise<void>;
  
  // Move history actions
  setMoveHistory: (history: MoveHistoryResponse) => void;
  setMoveHistoryFilters: (filters: Partial<MoveHistoryState['filters']>) => void;
  fetchMoveHistory: (params?: {
    userId?: string;
    productId?: string;
    moveType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  exportMoveHistory: (format: 'json' | 'csv') => Promise<void>;
  
  // User behavior actions
  setSelectedUser: (user: UserBehaviorData | null) => void;
  searchUsers: (query: string) => Promise<void>;
  fetchUserBehavior: (userId: string) => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialConflictsState: ConflictState = {
  conflicts: [],
  selectedConflictIds: new Set(),
};

const initialAnalyticsState: AnalyticsState = {
  systemAnalytics: null,
  behaviorAnalytics: null,
  conversionAnalytics: null,
  abandonmentAnalytics: null,
  performanceMetrics: null,
};

const initialMoveHistoryState: MoveHistoryState = {
  history: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filters: {},
};

const initialUserBehaviorState: UserBehaviorState = {
  selectedUser: null,
  searchResults: [],
};

const initialState: AdminCartWishlistStoreState = {
  syncStatus: null,
  conflicts: initialConflictsState,
  analytics: initialAnalyticsState,
  moveHistory: initialMoveHistoryState,
  userBehavior: initialUserBehaviorState,
  isLoading: false,
  error: null,
};

// ============================================================================
// Create Store
// ============================================================================

export const useAdminCartWishlistStore = create<
  AdminCartWishlistStoreState & AdminCartWishlistStoreActions
>()((set, get) => ({
  ...initialState,

  /**
   * Set sync status
   */
  setSyncStatus: (status: SyncStatusState) => {
    set({ syncStatus: status });
  },

  /**
   * Fetch system sync status
   */
  fetchSyncStatus: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const status = await adminCartWishlistApi.getSystemSyncStatus();
      set({
        syncStatus: status,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sync status',
      });
    }
  },

  /**
   * Fetch recent syncs
   */
  fetchRecentSyncs: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await adminCartWishlistApi.getRecentSyncs(params);
      set((state) => ({
        syncStatus: state.syncStatus ? {
          ...state.syncStatus,
          recentSyncs: response.syncs,
        } : null,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch recent syncs',
      });
    }
  },

  /**
   * Set conflicts
   */
  setConflicts: (conflicts: ConflictData[]) => {
    set((state) => ({
      conflicts: {
        ...state.conflicts,
        conflicts,
      },
    }));
  },

  /**
   * Fetch conflicts
   */
  fetchConflicts: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await adminCartWishlistApi.getAllConflicts(params);
      set({
        conflicts: {
          conflicts: response.conflicts,
          selectedConflictIds: new Set(),
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch conflicts',
      });
    }
  },

  /**
   * Resolve a single conflict
   */
  resolveConflict: async (conflictId, resolution, adminNote) => {
    set({ isLoading: true, error: null });
    
    try {
      await adminCartWishlistApi.resolveConflictAdmin(conflictId, resolution, adminNote);
      set((state) => ({
        conflicts: {
          ...state.conflicts,
          conflicts: state.conflicts.conflicts.filter((c) => c.id !== conflictId),
          selectedConflictIds: new Set(Array.from(state.conflicts.selectedConflictIds).filter((id) => id !== conflictId)),
        },
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
   * Bulk resolve conflicts
   */
  bulkResolveConflicts: async (conflictIds, resolution, adminNote) => {
    set({ isLoading: true, error: null });
    
    try {
      await adminCartWishlistApi.bulkResolveConflicts(conflictIds, resolution, adminNote);
      set((state) => ({
        conflicts: {
          ...state.conflicts,
          conflicts: state.conflicts.conflicts.filter((c) => !conflictIds.includes(c.id)),
          selectedConflictIds: new Set(),
        },
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to resolve conflicts',
      });
    }
  },

  /**
   * Toggle conflict selection
   */
  toggleConflictSelection: (conflictId: string) => {
    set((state) => {
      const newSelectedIds = new Set(state.conflicts.selectedConflictIds);
      if (newSelectedIds.has(conflictId)) {
        newSelectedIds.delete(conflictId);
      } else {
        newSelectedIds.add(conflictId);
      }
      return {
        conflicts: {
          ...state.conflicts,
          selectedConflictIds: newSelectedIds,
        },
      };
    });
  },

  /**
   * Select all conflicts
   */
  selectAllConflicts: () => {
    set((state) => ({
      conflicts: {
        ...state.conflicts,
        selectedConflictIds: new Set(state.conflicts.conflicts.map((c) => c.id)),
      },
    }));
  },

  /**
   * Clear conflict selection
   */
  clearConflictSelection: () => {
    set((state) => ({
      conflicts: {
        ...state.conflicts,
        selectedConflictIds: new Set(),
      },
    }));
  },

  /**
   * Set system analytics
   */
  setSystemAnalytics: (analytics: SystemAnalytics) => {
    set((state) => ({
      analytics: {
        ...state.analytics,
        systemAnalytics: analytics,
      },
    }));
  },

  /**
   * Set behavior analytics
   */
  setBehaviorAnalytics: (analytics: BehaviorAnalytics) => {
    set((state) => ({
      analytics: {
        ...state.analytics,
        behaviorAnalytics: analytics,
      },
    }));
  },

  /**
   * Set conversion analytics
   */
  setConversionAnalytics: (analytics: ConversionAnalytics) => {
    set((state) => ({
      analytics: {
        ...state.analytics,
        conversionAnalytics: analytics,
      },
    }));
  },

  /**
   * Set abandonment analytics
   */
  setAbandonmentAnalytics: (analytics: AbandonmentAnalytics) => {
    set((state) => ({
      analytics: {
        ...state.analytics,
        abandonmentAnalytics: analytics,
      },
    }));
  },

  /**
   * Set performance metrics
   */
  setPerformanceMetrics: (metrics: PerformanceMetrics) => {
    set((state) => ({
      analytics: {
        ...state.analytics,
        performanceMetrics: metrics,
      },
    }));
  },

  /**
   * Fetch system analytics
   */
  fetchSystemAnalytics: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const analytics = await adminCartWishlistApi.getSystemAnalytics(params);
      set({
        analytics: {
          ...get().analytics,
          systemAnalytics: analytics,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch system analytics',
      });
    }
  },

  /**
   * Fetch behavior analytics
   */
  fetchBehaviorAnalytics: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const analytics = await adminCartWishlistApi.getBehaviorAnalytics(params);
      set({
        analytics: {
          ...get().analytics,
          behaviorAnalytics: analytics,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch behavior analytics',
      });
    }
  },

  /**
   * Fetch conversion analytics
   */
  fetchConversionAnalytics: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const analytics = await adminCartWishlistApi.getConversionAnalytics();
      set({
        analytics: {
          ...get().analytics,
          conversionAnalytics: analytics,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch conversion analytics',
      });
    }
  },

  /**
   * Fetch abandonment analytics
   */
  fetchAbandonmentAnalytics: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const analytics = await adminCartWishlistApi.getAbandonmentAnalytics();
      set({
        analytics: {
          ...get().analytics,
          abandonmentAnalytics: analytics,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch abandonment analytics',
      });
    }
  },

  /**
   * Fetch performance metrics
   */
  fetchPerformanceMetrics: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const metrics = await adminCartWishlistApi.getPerformanceMetrics();
      set({
        analytics: {
          ...get().analytics,
          performanceMetrics: metrics,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch performance metrics',
      });
    }
  },

  /**
   * Set move history
   */
  setMoveHistory: (history: MoveHistoryResponse) => {
    set((state) => ({
      moveHistory: {
        ...state.moveHistory,
        history: history.history,
        total: history.total,
        page: history.page,
        pageSize: history.pageSize,
      },
    }));
  },

  /**
   * Set move history filters
   */
  setMoveHistoryFilters: (filters) => {
    set((state) => ({
      moveHistory: {
        ...state.moveHistory,
        filters: { ...state.moveHistory.filters, ...filters },
        page: 1, // Reset to first page when filters change
      },
    }));
  },

  /**
   * Fetch move history
   */
  fetchMoveHistory: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await adminCartWishlistApi.getMoveHistoryAdmin({
        ...get().moveHistory.filters,
        ...params,
      });
      set({
        moveHistory: {
          ...get().moveHistory,
          history: response.history,
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch move history',
      });
    }
  },

  /**
   * Export move history
   */
  exportMoveHistory: async (format) => {
    set({ isLoading: true, error: null });
    
    try {
      const blob = await adminCartWishlistApi.generateReport({
        format,
        include: ['moves'],
        startDate: get().moveHistory.filters.startDate,
        endDate: get().moveHistory.filters.endDate,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `move_history_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to export move history',
      });
    }
  },

  /**
   * Set selected user
   */
  setSelectedUser: (user: UserBehaviorData | null) => {
    set({
      userBehavior: {
        ...get().userBehavior,
        selectedUser: user,
      },
    });
  },

  /**
   * Search users
   */
  searchUsers: async (query) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await adminCartWishlistApi.searchUsers(query);
      set({
        userBehavior: {
          ...get().userBehavior,
          searchResults: response.users,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to search users',
      });
    }
  },

  /**
   * Fetch user behavior data
   */
  fetchUserBehavior: async (userId) => {
    set({ isLoading: true, error: null });
    
    try {
      const userBehavior = await adminCartWishlistApi.getUserBehaviorData(userId);
      set({
        userBehavior: {
          ...get().userBehavior,
          selectedUser: userBehavior,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user behavior data',
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
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectSyncStatus = (state: AdminCartWishlistStoreState) => state.syncStatus;
export const selectConflicts = (state: AdminCartWishlistStoreState) => state.conflicts;
export const selectAnalytics = (state: AdminCartWishlistStoreState) => state.analytics;
export const selectMoveHistory = (state: AdminCartWishlistStoreState) => state.moveHistory;
export const selectUserBehavior = (state: AdminCartWishlistStoreState) => state.userBehavior;
export const selectIsLoading = (state: AdminCartWishlistStoreState) => state.isLoading;
export const selectError = (state: AdminCartWishlistStoreState) => state.error;

export default useAdminCartWishlistStore;
