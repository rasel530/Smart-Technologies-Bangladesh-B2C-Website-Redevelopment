/**
 * Admin Gateway API Client
 * Phase 7 Milestone 4: Connect Admin Payment Pages to Real Backend APIs
 * Handles all admin gateway settings API calls
 */

import { apiClient } from '../client';

/**
 * Gateway config interface
 */
export interface GatewayConfig {
  apiKey?: string;
  apiSecret?: string;
  merchantId?: string;
  storeId?: string;
  storePassword?: string;
  username?: string;
  password?: string;
  webhookUrl?: string;
  sandboxUrl?: string;
  productionUrl?: string;
}

/**
 * Gateway stats interface
 */
export interface GatewayStats {
  totalTransactions: number;
  successRate: number;
  lastTransaction?: string;
}

/**
 * Payment gateway interface
 */
export interface PaymentGateway {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  testMode: boolean;
  config: GatewayConfig;
  stats: GatewayStats;
}

/**
 * Gateway settings interface
 */
export interface GatewaySettings {
  gateway: string;
  enabled: boolean;
  testMode: boolean;
  config: GatewayConfig;
}

/**
 * Connection test result interface
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: string;
  gateway?: string;
}

/**
 * Get all gateway settings
 * @returns Promise<PaymentGateway[]> The gateway settings list
 */
export const getGateways = async (): Promise<PaymentGateway[]> => {
  try {
    const response = await apiClient.get<PaymentGateway[]>('/api/v1/admin/gateways');
    return response;
  } catch (error: any) {
    console.error('[Admin Gateway API] Error getting gateways:', error);
    
    // Enhanced error handling with user-friendly messages
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to load gateways. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Get gateway settings by gateway name
 * @param gateway - The gateway name
 * @returns Promise<GatewaySettings> The gateway settings
 */
export const getGatewaySettings = async (gateway: string): Promise<GatewaySettings> => {
  try {
    const response = await apiClient.get<GatewaySettings>(`/api/v1/admin/gateways/${gateway}`);
    return response;
  } catch (error: any) {
    console.error('[Admin Gateway API] Error getting gateway settings:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to load gateway settings. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Update gateway settings
 * @param gateway - The gateway name
 * @param settings - The gateway settings
 * @returns Promise<GatewaySettings> The updated gateway settings
 */
export const updateGatewaySettings = async (
  gateway: string,
  settings: Partial<GatewaySettings>
): Promise<GatewaySettings> => {
  try {
    const response = await apiClient.put<GatewaySettings>(
      `/api/v1/admin/gateways/${gateway}`,
      settings
    );
    return response;
  } catch (error: any) {
    console.error('[Admin Gateway API] Error updating gateway settings:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to update gateway settings. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Toggle gateway enable/disable
 * @param gateway - The gateway name
 * @param enabled - Whether to enable or disable the gateway
 * @returns Promise<GatewaySettings> The updated gateway settings
 */
export const toggleGateway = async (
  gateway: string,
  enabled: boolean
): Promise<GatewaySettings> => {
  try {
    const response = await apiClient.put<GatewaySettings>(
      `/api/v1/admin/gateways/${gateway}`,
      { enabled }
    );
    return response;
  } catch (error: any) {
    console.error('[Admin Gateway API] Error toggling gateway:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to toggle gateway. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Toggle test mode
 * @param gateway - The gateway name
 * @param testMode - Whether to enable or disable test mode
 * @returns Promise<GatewaySettings> The updated gateway settings
 */
export const toggleTestMode = async (
  gateway: string,
  testMode: boolean
): Promise<GatewaySettings> => {
  try {
    const response = await apiClient.put<GatewaySettings>(
      `/api/v1/admin/gateways/${gateway}`,
      { testMode }
    );
    return response;
  } catch (error: any) {
    console.error('[Admin Gateway API] Error toggling test mode:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to toggle test mode. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Update gateway configuration
 * @param gateway - The gateway name
 * @param config - The gateway configuration
 * @returns Promise<GatewaySettings> The updated gateway settings
 */
export const updateGatewayConfig = async (
  gateway: string,
  config: Partial<GatewayConfig>
): Promise<GatewaySettings> => {
  try {
    const response = await apiClient.put<GatewaySettings>(
      `/api/v1/admin/gateways/${gateway}/config`,
      { config }
    );
    return response;
  } catch (error: any) {
    console.error('[Admin Gateway API] Error updating gateway config:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to update gateway configuration. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Test gateway connection
 * @param gateway - The gateway name
 * @returns Promise<ConnectionTestResult> The connection test result
 */
export const testGatewayConnection = async (
  gateway: string
): Promise<ConnectionTestResult> => {
  try {
    const response = await apiClient.post<ConnectionTestResult>(
      `/api/v1/admin/gateways/${gateway}/test`,
      {}
    );
    return response;
  } catch (error: any) {
    console.error('[Admin Gateway API] Error testing gateway connection:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to test gateway connection. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Update webhook URL
 * @param gateway - The gateway name
 * @param webhookUrl - The webhook URL
 * @returns Promise<GatewaySettings> The updated gateway settings
 */
export const updateWebhookUrl = async (
  gateway: string,
  webhookUrl: string
): Promise<GatewaySettings> => {
  try {
    const response = await apiClient.put<GatewaySettings>(
      `/api/v1/admin/gateways/${gateway}/webhook`,
      { webhookUrl }
    );
    return response;
  } catch (error: any) {
    console.error('[Admin Gateway API] Error updating webhook URL:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to update webhook URL. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Add new gateway
 * @param gateway - The gateway settings for new gateway
 * @returns Promise<PaymentGateway> The created gateway
 */
export const addGateway = async (
  gateway: Omit<PaymentGateway, 'id' | 'stats'>
): Promise<PaymentGateway> => {
  try {
    const response = await apiClient.post<PaymentGateway>(
      '/api/v1/admin/gateways',
      gateway
    );
    return response;
  } catch (error: any) {
    console.error('[Admin Gateway API] Error adding gateway:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to add gateway. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Delete gateway
 * @param gateway - The gateway name
 * @returns Promise<{ success: boolean }> Success response
 */
export const deleteGateway = async (gateway: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.delete<{ success: boolean }>(
      `/api/v1/admin/gateways/${gateway}`
    );
    return response;
  } catch (error: any) {
    console.error('[Admin Gateway API] Error deleting gateway:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to delete gateway. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Export gateways to CSV
 * @returns Promise<Blob> CSV file as blob
 */
export const exportGateways = async (): Promise<Blob> => {
  try {
    // Use fetch directly to get blob response
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/gateways/export`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to export gateways');
    }

    return await response.blob();
  } catch (error: any) {
    console.error('[Admin Gateway API] Error exporting gateways:', error);
    
    const errorMessage = error?.response?.data?.error || 
                     error?.response?.data?.message || 
                     error?.message || 
                     'Failed to export gateways. Please try again.';
    
    throw new Error(errorMessage);
  }
};

// Export all admin gateway API functions
export default {
  getGateways,
  getGatewaySettings,
  updateGatewaySettings,
  toggleGateway,
  toggleTestMode,
  updateGatewayConfig,
  testGatewayConnection,
  updateWebhookUrl,
  addGateway,
  deleteGateway,
  exportGateways,
};
