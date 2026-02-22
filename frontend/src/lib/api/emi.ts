/**
 * EMI API Client
 *
 * This file provides methods for interacting with EMI API endpoints.
 * It follows the existing API client pattern and supports EMI-related operations.
 */

import { apiClient } from './client';
import {
  EmiProvider,
  EmiPlan,
  EmiCalculationResult,
  EmiDetails,
  EmiEligibilityResult,
  EmiConfiguration,
  GetEmiProvidersResponse,
  GetEmiPlansResponse,
  CalculateEmiResponse,
  CheckEmiEligibilityResponse,
  GetAvailableEmiPlansResponse,
  GetEmiConfigurationResponse
} from '@/types/emi';

// Get API URL from environment or use default (backend runs on port 3001)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Get all EMI providers
 * @returns Promise<GetEmiProvidersResponse> List of EMI providers
 */
export const getEmiProviders = async (): Promise<GetEmiProvidersResponse> => {
  try {
    const response = await apiClient.get<GetEmiProvidersResponse>('/emi/providers', { unwrapResponse: false });
    return response;
  } catch (error) {
    console.error('[EMI API] Error getting EMI providers:', error);
    throw error;
  }
};

/**
 * Get EMI provider by ID
 * @param providerId - The EMI provider ID
 * @returns Promise<EmiProvider> The EMI provider
 */
export const getEmiProviderById = async (providerId: string): Promise<EmiProvider> => {
  try {
    const response = await apiClient.get<{ success: boolean; message: string; data: EmiProvider }>(`/emi/providers/${providerId}`, { unwrapResponse: false });
    return response.data;
  } catch (error) {
    console.error('[EMI API] Error getting EMI provider:', error);
    throw error;
  }
};

/**
 * Get all EMI plans
 * @returns Promise<GetEmiPlansResponse> List of EMI plans
 */
export const getEmiPlans = async (): Promise<GetEmiPlansResponse> => {
  try {
    const response = await apiClient.get<GetEmiPlansResponse>('/emi/plans', { unwrapResponse: false });
    return response;
  } catch (error) {
    console.error('[EMI API] Error getting EMI plans:', error);
    throw error;
  }
};

/**
 * Get EMI plan by ID
 * @param planId - The EMI plan ID
 * @returns Promise<EmiPlan> The EMI plan
 */
export const getEmiPlanById = async (planId: string): Promise<EmiPlan> => {
  try {
    const response = await apiClient.get<{ success: boolean; message: string; data: EmiPlan }>(`/emi/plans/${planId}`, { unwrapResponse: false });
    return response.data;
  } catch (error) {
    console.error('[EMI API] Error getting EMI plan:', error);
    throw error;
  }
};

/**
 * Calculate EMI for a given amount and plan
 * @param amount - The amount to calculate EMI for
 * @param planId - Optional EMI plan ID. If not provided, returns available plans
 * @returns Promise<CalculateEmiResponse> EMI calculation result
 */
export const calculateEmi = async (
  amount: number,
  planId?: string
): Promise<CalculateEmiResponse> => {
  try {
    const params = planId ? `?amount=${amount}&planId=${planId}` : `?amount=${amount}`;
    const response = await apiClient.get<CalculateEmiResponse>(`/emi/calculate${params}`, { unwrapResponse: false });
    return response;
  } catch (error) {
    console.error('[EMI API] Error calculating EMI:', error);
    throw error;
  }
};

/**
 * Check EMI eligibility for a given amount
 * @param amount - The amount to check eligibility for
 * @param planId - Optional plan ID to validate against
 * @returns Promise<CheckEmiEligibilityResponse> Eligibility result
 */
export const checkEmiEligibility = async (
  amount: number,
  planId?: string
): Promise<CheckEmiEligibilityResponse> => {
  try {
    const params = planId ? `?planId=${planId}` : '';
    const response = await apiClient.get<CheckEmiEligibilityResponse>(`/emi/eligibility/${amount}${params}`, { unwrapResponse: false });
    return response;
  } catch (error) {
    console.error('[EMI API] Error checking EMI eligibility:', error);
    throw error;
  }
};

/**
 * Get available EMI plans for a given amount
 * @param amount - The amount to check available plans for
 * @returns Promise<GetAvailableEmiPlansResponse> Available EMI plans
 */
export const getAvailableEmiPlans = async (amount: number): Promise<GetAvailableEmiPlansResponse> => {
  try {
    const response = await apiClient.get<GetAvailableEmiPlansResponse>(`/emi/available/${amount}`, { unwrapResponse: false });
    return response;
  } catch (error) {
    console.error('[EMI API] Error getting available EMI plans:', error);
    throw error;
  }
};

/**
 * Get EMI configuration
 * @returns Promise<GetEmiConfigurationResponse> EMI configuration
 */
export const getEmiConfiguration = async (): Promise<GetEmiConfigurationResponse> => {
  try {
    const response = await apiClient.get<GetEmiConfigurationResponse>('/emi/configuration', { unwrapResponse: false });
    return response;
  } catch (error) {
    console.error('[EMI API] Error getting EMI configuration:', error);
    throw error;
  }
};

/**
 * Get EMI details for a specific plan and amount
 * @param planId - The EMI plan ID
 * @param amount - The amount to calculate EMI for
 * @returns Promise<EmiDetails> Detailed EMI breakdown
 */
export const getEmiDetails = async (
  planId: string,
  amount: number
): Promise<EmiDetails> => {
  try {
    const response = await apiClient.get<{ success: boolean; message: string; data: EmiDetails }>(`/emi/calculate?amount=${amount}&planId=${planId}`, { unwrapResponse: false });
    return response.data;
  } catch (error) {
    console.error('[EMI API] Error getting EMI details:', error);
    throw error;
  }
};

export default {
  getEmiProviders,
  getEmiProviderById,
  getEmiPlans,
  getEmiPlanById,
  calculateEmi,
  checkEmiEligibility,
  getAvailableEmiPlans,
  getEmiConfiguration,
  getEmiDetails
};
