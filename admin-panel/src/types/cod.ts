/**
 * COD Entity Type Definitions for Admin Panel
 *
 * This file contains all TypeScript interfaces and types related to COD (Cash on Delivery)
 * including CodSettings, CodAvailabilityResult, CodFeeResult, and related request/response types.
 */

/**
 * COD Settings Interface
 */
export interface CodSettings {
  id: string;
  isEnabled: boolean;
  minAmount: number;
  maxAmount: number;
  availableDivisions: string[];
  unavailableDivisions: string[];
  additionalFee: number;
  freeAboveAmount: number;
  requirePhoneVerification: boolean;
  requireAddressVerification: boolean;
  maxDailyOrders: number;
  maxWeeklyOrders: number;
  deliveryDays: number;
  notes?: string | null;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * COD Configuration Constants
 */
export const COD_CONSTANTS = {
  MIN_AMOUNT: 0, // BDT 0
  MAX_AMOUNT: 100000, // BDT 100,000
  DEFAULT_FEE: 50, // BDT 50
  DEFAULT_FREE_ABOVE: 1000, // BDT 1,000
  DEFAULT_DAILY_ORDERS: 5,
  DEFAULT_WEEKLY_ORDERS: 10,
  DEFAULT_DELIVERY_DAYS: 3,
  DIVISIONS: [
    'dhaka',
    'chittagong',
    'khulna',
    'rajshahi',
    'sylhet',
    'barishal',
    'rangpur',
    'mymensingh'
  ],
  DIVISION_NAMES: {
    dhaka: 'Dhaka',
    chittagong: 'Chittagong',
    khulna: 'Khulna',
    rajshahi: 'Rajshahi',
    sylhet: 'Sylhet',
    barishal: 'Barishal',
    rangpur: 'Rangpur',
    mymensingh: 'Mymensingh'
  },
  DIVISION_NAMES_BN: {
    dhaka: 'ঢাকা',
    chittagong: 'চট্টগ্রাম',
    khulna: 'খুলনা',
    rajshahi: 'রাজশাহী',
    sylhet: 'সিলেট',
    barishal: 'বরিশাল',
    rangpur: 'রংপুর',
    mymensingh: 'ময়মনসিংহ'
  },
  DEFAULT_CURRENCY: 'BDT'
} as const;
