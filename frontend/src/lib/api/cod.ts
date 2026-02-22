/**
 * COD API Client
 *
 * This file provides methods for interacting with COD API endpoints.
 * It follows the existing API client pattern and supports COD-related operations.
 */

import { apiClient } from './client';
import {
  CodSettings,
  CodAvailabilityResult,
  CodFeeResult,
  CodValidationResult,
  CodLimitCheckResult,
  CodConfiguration,
  CodAddress,
  GetCodSettingsResponse,
  GetCodConfigurationResponse,
  CheckCodAvailabilityResponse,
  ValidateCodOrderResponse,
  CalculateCodFeeResponse,
  CheckCodLimitResponse
} from '@/types/cod';

// Get API URL from environment or use default (backend runs on port 3001)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Get COD settings
 * @returns Promise<GetCodSettingsResponse> COD settings
 */
export const getCodSettings = async (): Promise<GetCodSettingsResponse> => {
  try {
    const response = await apiClient.get<GetCodSettingsResponse>('/cod/settings', { unwrapResponse: false });
    return response;
  } catch (error) {
    console.error('[COD API] Error getting COD settings:', error);
    throw error;
  }
};

/**
 * Get COD configuration (for frontend display)
 * @returns Promise<GetCodConfigurationResponse> COD configuration
 */
export const getCodConfiguration = async (): Promise<GetCodConfigurationResponse> => {
  try {
    const response = await apiClient.get<GetCodConfigurationResponse>('/cod/configuration', { unwrapResponse: false });
    return response;
  } catch (error) {
    console.error('[COD API] Error getting COD configuration:', error);
    throw error;
  }
};

/**
 * Check COD availability for address and amount
 * @param address - Address object with division
 * @param amount - Order amount
 * @returns Promise<CheckCodAvailabilityResponse> COD availability result
 */
export const checkCodAvailability = async (
  address?: CodAddress,
  amount?: number
): Promise<CheckCodAvailabilityResponse> => {
  try {
    const params = new URLSearchParams();
    if (address?.division) {
      params.append('division', address.division);
    }
    if (amount !== undefined) {
      params.append('amount', amount.toString());
    }
    
    const queryString = params.toString();
    const response = await apiClient.get<CheckCodAvailabilityResponse>(
      `/cod/availability${queryString ? `?${queryString}` : ''}`,
      { unwrapResponse: false }
    );
    return response;
  } catch (error) {
    console.error('[COD API] Error checking COD availability:', error);
    throw error;
  }
};

/**
 * Validate COD order
 * @param userId - User ID (optional)
 * @param address - Address object
 * @param amount - Order amount
 * @returns Promise<ValidateCodOrderResponse> COD validation result
 */
export const validateCodOrder = async (
  userId?: string,
  address?: CodAddress,
  amount?: number
): Promise<ValidateCodOrderResponse> => {
  try {
    const params = new URLSearchParams();
    if (userId) {
      params.append('userId', userId);
    }
    if (address?.division) {
      params.append('division', address.division);
    }
    if (amount !== undefined) {
      params.append('amount', amount.toString());
    }
    
    const queryString = params.toString();
    const response = await apiClient.get<ValidateCodOrderResponse>(
      `/cod/validate${queryString ? `?${queryString}` : ''}`,
      { unwrapResponse: false }
    );
    return response;
  } catch (error) {
    console.error('[COD API] Error validating COD order:', error);
    throw error;
  }
};

/**
 * Calculate COD fee for a given amount
 * @param amount - Order amount
 * @returns Promise<CalculateCodFeeResponse> COD fee result
 */
export const calculateCodFee = async (amount: number): Promise<CalculateCodFeeResponse> => {
  try {
    const response = await apiClient.get<CalculateCodFeeResponse>(`/cod/fee/${amount}`, { unwrapResponse: false });
    return response;
  } catch (error) {
    console.error('[COD API] Error calculating COD fee:', error);
    throw error;
  }
};

/**
 * Check COD order limits for a user
 * @param userId - User ID
 * @returns Promise<CheckCodLimitResponse> COD limit check result
 */
export const checkCodLimit = async (userId: string): Promise<CheckCodLimitResponse> => {
  try {
    const response = await apiClient.get<CheckCodLimitResponse>(`/cod/limit/${userId}`, { unwrapResponse: false });
    return response;
  } catch (error) {
    console.error('[COD API] Error checking COD limit:', error);
    throw error;
  }
};

/**
 * Check if COD is available for a given address and amount
 * @param address - Address object with division
 * @param amount - Order amount
 * @returns Promise<CodAvailabilityResult> COD availability result
 */
export const isCodAvailable = async (
  address?: CodAddress,
  amount?: number
): Promise<CodAvailabilityResult> => {
  try {
    const response = await checkCodAvailability(address, amount);
    console.log('[COD API] isCodAvailable response:', JSON.stringify(response, null, 2));
    // Backend returns availability directly, not wrapped in data property
    if (response.success && (response.data !== undefined)) {
      return response.data;
    }
    console.error('[COD API] Invalid isCodAvailable response structure:', response);
    throw new Error('Invalid COD availability response structure');
  } catch (error) {
    console.error('[COD API] Error checking if COD is available:', error);
    throw error;
  }
};

/**
 * Get COD fee for a given amount
 * @param amount - Order amount
 * @returns Promise<number> COD fee
 */
export const getCodFee = async (amount: number): Promise<number> => {
  try {
    const response = await calculateCodFee(amount);
    return response.data.fee;
  } catch (error) {
    console.error('[COD API] Error getting COD fee:', error);
    throw error;
  }
};

/**
 * Validate COD order and return validation result
 * @param userId - User ID (optional)
 * @param address - Address object
 * @param amount - Order amount
 * @returns Promise<CodValidationResult> COD validation result
 */
export const getValidationResult = async (
  userId?: string,
  address?: CodAddress,
  amount?: number
): Promise<CodValidationResult> => {
  try {
    const response = await validateCodOrder(userId, address, amount);
    return response.data;
  } catch (error) {
    console.error('[COD API] Error getting COD validation result:', error);
    throw error;
  }
};

/**
 * Get COD limit check result for a user
 * @param userId - User ID
 * @returns Promise<CodLimitCheckResult> COD limit check result
 */
export const getLimitCheckResult = async (userId: string): Promise<CodLimitCheckResult> => {
  try {
    const response = await checkCodLimit(userId);
    return response.data;
  } catch (error) {
    console.error('[COD API] Error getting COD limit check result:', error);
    throw error;
  }
};

export default {
  getCodSettings,
  getCodConfiguration,
  checkCodAvailability,
  validateCodOrder,
  calculateCodFee,
  checkCodLimit,
  isCodAvailable,
  getCodFee,
  getValidationResult,
  getLimitCheckResult
};
