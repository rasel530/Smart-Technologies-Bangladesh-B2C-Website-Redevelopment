/**
 * Cart Recovery API Client
 * 
 * Handles all API calls related to cart recovery functionality
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface CartRecoveryResponse {
  success: boolean;
  data?: any;
  error?: string;
  errorCode?: string;
  message?: string;
}

export interface CartRecoveryStats {
  summary: {
    totalAbandoned: number;
    totalRecovered: number;
    totalEmailsSent: number;
    totalConversions: number;
    recoveryRate: number;
    conversionRate: number;
    recoveredRevenue: number;
  };
  events: Record<string, number>;
  dailyBreakdown: Array<{
    date: string;
    abandoned: number;
    recovered: number;
    emailsSent: number;
    recoveryRate: number;
  }>;
}

/**
 * Validate recovery token
 */
export async function validateToken(token: string): Promise<CartRecoveryResponse> {
  const response = await fetch(`${API_BASE_URL}/cart/recover/${token}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}

/**
 * Recover cart via token
 */
export async function recoverCart(token: string, options?: {
  sessionId?: string;
  userId?: string;
}): Promise<CartRecoveryResponse> {
  const response = await fetch(`${API_BASE_URL}/cart/recover/${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options || {}),
  });

  return response.json();
}

/**
 * Mark cart as abandoned (authenticated)
 */
export async function markCartAbandoned(
  cartId: string,
  reason?: string,
  authToken?: string
): Promise<CartRecoveryResponse> {
  const response = await fetch(`${API_BASE_URL}/cart/abandon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
    },
    body: JSON.stringify({ cartId, reason }),
  });

  return response.json();
}

/**
 * Get recovery statistics (admin only)
 */
export async function getRecoveryStats(
  params?: { startDate?: string; endDate?: string },
  authToken?: string
): Promise<CartRecoveryResponse> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const response = await fetch(
    `${API_BASE_URL}/cart/recovery/stats?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : '',
      },
    }
  );

  return response.json();
}

/**
 * Schedule recovery emails (admin only)
 */
export async function scheduleRecovery(
  data: {
    cartId?: string;
    cartIds?: string[];
    template?: 'recovery' | 'reminder' | 'final';
    discountCode?: string;
    discountAmount?: string;
  },
  authToken?: string
): Promise<CartRecoveryResponse> {
  const response = await fetch(`${API_BASE_URL}/cart/recovery/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

/**
 * Cancel recovery reminders
 */
export async function cancelReminders(
  cartId: string,
  authToken?: string
): Promise<CartRecoveryResponse> {
  const response = await fetch(`${API_BASE_URL}/cart/recovery/cancel/${cartId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
    },
  });

  return response.json();
}

/**
 * Get abandoned carts (admin only)
 */
export async function getAbandonedCarts(
  params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
  authToken?: string
): Promise<CartRecoveryResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const response = await fetch(
    `${API_BASE_URL}/cart/abandoned?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : '',
      },
    }
  );

  return response.json();
}

/**
 * Track email open (1x1 pixel)
 */
export function getEmailTrackingUrl(token: string): string {
  return `${API_BASE_URL}/cart/recovery/email-track/${token}`;
}

// Export as default object
export const cartRecoveryApi = {
  validateToken,
  recoverCart,
  markCartAbandoned,
  getRecoveryStats,
  scheduleRecovery,
  cancelReminders,
  getAbandonedCarts,
  getEmailTrackingUrl,
};

export default cartRecoveryApi;
