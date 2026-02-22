/**
 * EMI Entity Type Definitions
 *
 * This file contains all TypeScript interfaces and types related to EMI (Equated Monthly Installment)
 * including EmiProvider, EmiPlan, EmiCalculationResult, and related request/response types.
 */

/**
 * EMI Provider Interface
 */
export interface EmiProvider {
  id: string;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  interestRate: number;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  emiPlans?: EmiPlan[];
}

/**
 * EMI Plan Interface
 */
export interface EmiPlan {
  id: string;
  providerId: string;
  name: string;
  duration: number; // Duration in months
  interestRate: number; // Annual interest rate (e.g., 12 for 12%)
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  downPayment: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  provider?: EmiProvider;
}

/**
 * EMI Calculation Result Interface
 */
export interface EmiCalculationResult {
  principal: number;
  emiAmount: number; // Monthly EMI amount
  totalInterest: number;
  processingFee: number;
  totalPayable: number; // Total amount including interest and fees
  totalAmount: number; // Principal + Interest + Processing Fee
  duration: number;
  interestRate: number;
  monthlyRate: number; // Monthly interest rate
}

/**
 * EMI Details Interface (includes provider info)
 */
export interface EmiDetails extends EmiCalculationResult {
  planId: string;
  planName: string;
  provider: {
    id: string;
    name: string;
    logoUrl?: string | null;
    website?: string | null;
  };
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  downPayment: number;
}

/**
 * EMI Eligibility Result Interface
 */
export interface EmiEligibilityResult {
  eligible: boolean;
  reason?: string | null;
  availablePlans?: EmiPlan[];
  minAmount: number;
  maxAmount: number;
}

/**
 * EMI Configuration Interface
 */
export interface EmiConfiguration {
  minAmount: number;
  maxAmount: number;
  defaultDurations: number[];
  providers: Array<{
    id: string;
    name: string;
    logoUrl?: string | null;
    website?: string | null;
    plans: Array<{
      id: string;
      name: string;
      duration: number;
      interestRate: number;
      minAmount: number;
      maxAmount: number;
      processingFee: number;
      downPayment: number;
    }>;
  }>;
}

/**
 * Get EMI Providers Response Interface
 */
export interface GetEmiProvidersResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: EmiProvider[];
}

/**
 * Get EMI Plans Response Interface
 */
export interface GetEmiPlansResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: EmiPlan[];
}

/**
 * Calculate EMI Request Interface
 */
export interface CalculateEmiRequest {
  amount: number;
  planId?: string;
}

/**
 * Calculate EMI Response Interface
 */
export interface CalculateEmiResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: EmiDetails | {
    amount: number;
    availablePlans: EmiPlan[];
  };
}

/**
 * Check EMI Eligibility Request Interface
 */
export interface CheckEmiEligibilityRequest {
  amount: number;
  planId?: string;
}

/**
 * Check EMI Eligibility Response Interface
 */
export interface CheckEmiEligibilityResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: EmiEligibilityResult;
}

/**
 * Get Available EMI Plans Request Interface
 */
export interface GetAvailableEmiPlansRequest {
  amount: number;
}

/**
 * Get Available EMI Plans Response Interface
 */
export interface GetAvailableEmiPlansResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: {
    amount: number;
    plans: EmiPlan[];
  };
}

/**
 * Get EMI Configuration Response Interface
 */
export interface GetEmiConfigurationResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: EmiConfiguration;
}

/**
 * EMI Display Component Props Interface
 */
export interface EmiDisplayProps {
  amount: number;
  onPlanSelect?: (planId: string, emiDetails: EmiDetails) => void;
  language?: 'en' | 'bn';
  className?: string;
  showCalculator?: boolean;
}

/**
 * EMI Calculator Component Props Interface
 */
export interface EmiCalculatorProps {
  amount?: number;
  onCalculate?: (result: EmiCalculationResult) => void;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * EMI Details Component Props Interface
 */
export interface EmiDetailsProps {
  emiDetails: EmiDetails;
  language?: 'en' | 'bn';
  className?: string;
  showProviderInfo?: boolean;
}

/**
 * EMI Selector Component Props Interface
 */
export interface EmiSelectorProps {
  availablePlans: EmiPlan[];
  selectedPlanId?: string;
  onPlanSelect?: (planId: string, plan: EmiPlan) => void;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * EMI Summary Component Props Interface
 */
export interface EmiSummaryProps {
  emiDetails: EmiDetails;
  language?: 'en' | 'bn';
  className?: string;
  showBreakdown?: boolean;
}

/**
 * EMI Plan Card Component Props Interface
 */
export interface EmiPlanCardProps {
  plan: EmiPlan;
  amount: number;
  isSelected?: boolean;
  onSelect?: (plan: EmiPlan) => void;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * EMI Provider Badge Component Props Interface
 */
export interface EmiProviderBadgeProps {
  provider: EmiProvider;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * EMI Breakdown Item Interface
 */
export interface EmiBreakdownItem {
  label: string;
  labelBn?: string;
  value: string;
  valueBn?: string;
  isHighlighted?: boolean;
}

/**
 * EMI Options State Interface
 */
export interface EmiOptionsState {
  isEligible: boolean;
  availablePlans: EmiPlan[];
  selectedPlanId: string | null;
  selectedPlan: EmiPlan | null;
  emiDetails: EmiDetails | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * EMI Calculator Form Data Interface
 */
export interface EmiCalculatorFormData {
  amount: number;
  planId?: string;
}

/**
 * EMI Cart Integration Props Interface
 */
export interface EmiCartIntegrationProps {
  cartTotal: number;
  onEmiSelect?: (planId: string, emiDetails: EmiDetails) => void;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * EMI Configuration Constants
 */
export const EMI_CONSTANTS = {
  MIN_AMOUNT: 5000, // BDT 5,000
  MAX_AMOUNT: 500000, // BDT 500,000
  DEFAULT_DURATIONS: [3, 6, 9, 12, 18, 24],
  DEFAULT_PROVIDERS: ['city-bank', 'brac-bank', 'eastern-bank', 'dutch-bangla-bank'],
  DEFAULT_CURRENCY: 'BDT'
} as const;

/**
 * EMI Error Types
 */
export type EmiErrorType = 
  | 'PLAN_NOT_FOUND'
  | 'PLAN_NOT_ACTIVE'
  | 'AMOUNT_OUT_OF_RANGE'
  | 'AMOUNT_TOO_LOW'
  | 'AMOUNT_TOO_HIGH'
  | 'CALCULATION_ERROR'
  | 'ELIGIBILITY_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * EMI Error Interface
 */
export interface EmiError {
  type: EmiErrorType;
  message: string;
  messageBn?: string;
  details?: Record<string, any>;
}

/**
 * EMI Success Type
 */
export type EmiSuccessType = 
  | 'PLAN_SELECTED'
  | 'CALCULATION_SUCCESS'
  | 'ELIGIBILITY_CHECKED'
  | 'PROVIDERS_LOADED'
  | 'PLANS_LOADED';

/**
 * EMI Success Interface
 */
export interface EmiSuccess {
  type: EmiSuccessType;
  message: string;
  messageBn?: string;
  data?: any;
}
