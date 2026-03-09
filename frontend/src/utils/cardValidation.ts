/**
 * Card Validation Utilities
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Provides card number validation, type detection, and formatting
 */

import { CardType } from '@/types/payment';

/**
 * Card validation utilities
 */
export const cardValidation = {
  /**
   * Validate card number using Luhn algorithm
   * @param cardNumber - The card number to validate
   * @returns true if valid, false otherwise
   */
  validateCardNumber: (cardNumber: string): boolean => {
    // Remove all non-digit characters
    const cleanedCardNumber = cardNumber.replace(/\D/g, '');
    
    // Check if card number is empty or too short
    if (!cleanedCardNumber || cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      return false;
    }
    
    // Apply Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    // Process from right to left
    for (let i = cleanedCardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanedCardNumber[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },

  /**
   * Detect card type based on card number
   * @param cardNumber - The card number to analyze
   * @returns The detected card type
   */
  detectCardType: (cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'unknown' => {
    const cleanedCardNumber = cardNumber.replace(/\D/g, '');
    
    // Visa: starts with 4
    if (/^4/.test(cleanedCardNumber)) {
      return 'visa';
    }
    
    // MasterCard: starts with 51-55 or 2221-2720
    if (/^5[1-5]/.test(cleanedCardNumber) || /^2[2-7][2-9][0-9]/.test(cleanedCardNumber)) {
      return 'mastercard';
    }
    
    // Amex: starts with 34 or 37
    if (/^3[47]/.test(cleanedCardNumber)) {
      return 'amex';
    }
    
    return 'unknown';
  },

  /**
   * Validate expiry date
   * @param expiryDate - The expiry date in MM/YY or MM/YYYY format
   * @returns true if valid and not expired, false otherwise
   */
  validateExpiryDate: (expiryDate: string): boolean => {
    // Remove all non-digit characters
    const cleanedExpiry = expiryDate.replace(/\D/g, '');
    
    // Check if expiry date has correct length (4 for MMYY, 6 for MMYYYY)
    if (cleanedExpiry.length !== 4 && cleanedExpiry.length !== 6) {
      return false;
    }
    
    // Parse month and year
    const month = parseInt(cleanedExpiry.substring(0, 2), 10);
    const year = parseInt(cleanedExpiry.substring(2), 10);
    
    // Validate month
    if (month < 1 || month > 12) {
      return false;
    }
    
    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Handle 2-digit year
    const fullYear = cleanedExpiry.length === 4 ? 2000 + year : year;
    
    // Check if card is expired
    if (fullYear < currentYear) {
      return false;
    }
    
    if (fullYear === currentYear && month < currentMonth) {
      return false;
    }
    
    return true;
  },

  /**
   * Validate CVV
   * @param cvv - The CVV to validate
   * @param cardType - The card type (affects CVV length)
   * @returns true if valid, false otherwise
   */
  validateCVV: (cvv: string, cardType: string): boolean => {
    const cleanedCVV = cvv.replace(/\D/g, '');
    
    // Amex requires 4-digit CVV, others require 3-digit
    const requiredLength = cardType === 'amex' ? 4 : 3;
    
    return cleanedCVV.length === requiredLength;
  },

  /**
   * Format card number with spaces
   * @param cardNumber - The card number to format
   * @returns Formatted card number with spaces
   */
  formatCardNumber: (cardNumber: string): string => {
    const cleanedCardNumber = cardNumber.replace(/\D/g, '');
    const cardType = cardValidation.detectCardType(cleanedCardNumber);
    
    // Amex: 4-6-5 format
    if (cardType === 'amex') {
      const parts = [
        cleanedCardNumber.substring(0, 4),
        cleanedCardNumber.substring(4, 10),
        cleanedCardNumber.substring(10, 15),
      ];
      return parts.filter(part => part.length > 0).join(' ');
    }
    
    // Other cards: 4-4-4-4 format
    const parts = [];
    for (let i = 0; i < cleanedCardNumber.length; i += 4) {
      parts.push(cleanedCardNumber.substring(i, i + 4));
    }
    return parts.join(' ');
  },

  /**
   * Format expiry date
   * @param expiryDate - The expiry date to format
   * @returns Formatted expiry date in MM/YY format
   */
  formatExpiryDate: (expiryDate: string): string => {
    const cleanedExpiry = expiryDate.replace(/\D/g, '');
    
    if (cleanedExpiry.length <= 2) {
      return cleanedExpiry;
    }
    
    const month = cleanedExpiry.substring(0, 2);
    const year = cleanedExpiry.substring(2, 4);
    
    return `${month}/${year}`;
  },
};

/**
 * Get card type information
 * @param cardType - The card type
 * @returns Card type information with icon and name
 */
export const getCardTypeInfo = (cardType: string): CardType => {
  const cardTypes: Record<string, CardType> = {
    visa: {
      type: 'visa',
      icon: '💳',
      name: 'Visa',
    },
    mastercard: {
      type: 'mastercard',
      icon: '💳',
      name: 'MasterCard',
    },
    amex: {
      type: 'amex',
      icon: '💳',
      name: 'American Express',
    },
    unknown: {
      type: 'unknown',
      icon: '💳',
      name: 'Unknown Card',
    },
  };
  
  return cardTypes[cardType] || cardTypes.unknown;
};

/**
 * Validate complete card data
 * @param cardData - The card data to validate
 * @returns Validation result with errors
 */
export const validateCardData = (cardData: {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}): {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
} => {
  const errors: Array<{ field: string; message: string }> = [];
  
  // Validate card number
  if (!cardData.cardNumber) {
    errors.push({ field: 'cardNumber', message: 'Card number is required' });
  } else if (!cardValidation.validateCardNumber(cardData.cardNumber)) {
    errors.push({ field: 'cardNumber', message: 'Invalid card number' });
  }
  
  // Validate expiry date
  if (!cardData.expiryDate) {
    errors.push({ field: 'expiryDate', message: 'Expiry date is required' });
  } else if (!cardValidation.validateExpiryDate(cardData.expiryDate)) {
    errors.push({ field: 'expiryDate', message: 'Invalid or expired card' });
  }
  
  // Validate CVV
  const cardType = cardValidation.detectCardType(cardData.cardNumber);
  if (!cardData.cvv) {
    errors.push({ field: 'cvv', message: 'CVV is required' });
  } else if (!cardValidation.validateCVV(cardData.cvv, cardType)) {
    errors.push({ field: 'cvv', message: `CVV must be ${cardType === 'amex' ? '4' : '3'} digits` });
  }
  
  // Validate cardholder name
  if (!cardData.cardholderName) {
    errors.push({ field: 'cardholderName', message: 'Cardholder name is required' });
  } else if (cardData.cardholderName.trim().length < 2) {
    errors.push({ field: 'cardholderName', message: 'Cardholder name is too short' });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Mask card number for display
 * @param cardNumber - The card number to mask
 * @returns Masked card number showing only last 4 digits
 */
export const maskCardNumber = (cardNumber: string): string => {
  const cleanedCardNumber = cardNumber.replace(/\D/g, '');
  const lastFourDigits = cleanedCardNumber.slice(-4);
  const maskedPart = '*'.repeat(cleanedCardNumber.length - 4);
  
  return `${maskedPart}${lastFourDigits}`;
};

/**
 * Get card icon URL based on card type
 * @param cardType - The card type
 * @returns URL to card icon
 */
export const getCardIconUrl = (cardType: string): string => {
  const iconUrls: Record<string, string> = {
    visa: '/images/payment/visa.svg',
    mastercard: '/images/payment/mastercard.svg',
    amex: '/images/payment/amex.svg',
    unknown: '/images/payment/card.svg',
  };
  
  return iconUrls[cardType] || iconUrls.unknown;
};

export default cardValidation;
