/**
 * Admin Discount API Client
 * 
 * Handles all API calls for admin discount management
 */

const API_BASE = '/api/v1/admin';

interface Discount {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'PROMOTIONAL';
  value: number;
  description?: string;
  isActive: boolean;
  maxUses?: number;
  usedCount: number;
  startsAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface DiscountWithStats extends Discount {
  usageStats: {
    usedCount: number;
    maxUses?: number;
    remainingUses?: number;
    usagePercentage?: number;
  };
}

interface CartWithDiscount {
  id: string;
  items: CartItem[];
  discount: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  discountBreakdown: DiscountBreakdownItem[];
  totalDiscount: number;
  itemCount: number;
  totalItems: number;
}

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  subtotal: number;
  product?: {
    id: string;
    name: string;
    nameEn: string;
    sku: string;
    images: Array<{
      id: string;
      originalUrl?: string;
      optimizedUrl?: string;
      thumbnailUrl?: string;
    }>;
  };
  variant?: {
    id: string;
    name: string;
  };
  originalPrice?: number;
  appliedDiscount?: number;
  discountType?: string;
  discountReason?: string;
  adminDiscountId?: string;
}

interface DiscountBreakdownItem {
  itemId: string;
  productName: string;
  originalPrice: number;
  appliedDiscount: number;
  finalPrice: number;
  discountType?: string;
  discountReason?: string;
}

interface PaginationResult<T> {
  discounts: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CreateDiscountData {
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'PROMOTIONAL';
  value: number;
  description?: string;
  maxUses?: number;
  expiresAt?: string;
}

interface ApplyDiscountData {
  discountCode: string;
  adminId?: string;
}

interface ApplyToItemsData {
  itemIds: string[];
  discountType: 'PERCENTAGE' | 'FIXED' | 'PROMOTIONAL';
  discountValue: number;
  adminId?: string;
}

class AdminDiscountApi {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    return headers;
  }

  /**
   * Get all discounts with pagination
   */
  async getDiscounts(options: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginationResult<Discount>> {
    const params = new URLSearchParams();
    if (typeof options.isActive === 'boolean') {
      params.append('isActive', String(options.isActive));
    }
    if (options.page) params.append('page', String(options.page));
    if (options.limit) params.append('limit', String(options.limit));

    const response = await fetch(
      `${API_BASE}/discounts?${params.toString()}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch discounts' }));
      throw new Error(error.error || 'Failed to fetch discounts');
    }

    return response.json();
  }

  /**
   * Get a single discount by ID
   */
  async getDiscount(id: string): Promise<DiscountWithStats> {
    const response = await fetch(`${API_BASE}/discounts/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch discount' }));
      throw new Error(error.error || 'Failed to fetch discount');
    }

    return response.json();
  }

  /**
   * Create a new discount
   */
  async createDiscount(data: CreateDiscountData): Promise<Discount> {
    const response = await fetch(`${API_BASE}/discounts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create discount' }));
      throw new Error(error.error || 'Failed to create discount');
    }

    return response.json();
  }

  /**
   * Update a discount
   */
  async updateDiscount(
    id: string,
    data: Partial<{
      isActive: boolean;
      maxUses: number;
      expiresAt: string;
      description: string;
    }>
  ): Promise<Discount> {
    const response = await fetch(`${API_BASE}/discounts/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update discount' }));
      throw new Error(error.error || 'Failed to update discount');
    }

    return response.json();
  }

  /**
   * Delete/deactivate a discount
   */
  async deleteDiscount(id: string, reason?: string): Promise<void> {
    const response = await fetch(`${API_BASE}/discounts/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete discount' }));
      throw new Error(error.error || 'Failed to delete discount');
    }
  }

  /**
   * Validate a discount code
   */
  async validateDiscount(code: string): Promise<{
    valid: boolean;
    reason?: string;
    message?: string;
    discount?: {
      id: string;
      code: string;
      type: string;
      value: number;
      description?: string;
    };
  }> {
    const response = await fetch(`${API_BASE}/discounts/validate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ discountCode: code }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to validate discount' }));
      throw new Error(error.error || 'Failed to validate discount');
    }

    return response.json();
  }

  /**
   * Apply discount to a cart
   */
  async applyDiscount(cartId: string, data: ApplyDiscountData): Promise<{
    success: boolean;
    cart: CartWithDiscount;
    discountAmount: number;
  }> {
    const response = await fetch(`${API_BASE}/carts/${cartId}/discount`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to apply discount' }));
      throw new Error(error.error || 'Failed to apply discount');
    }

    return response.json();
  }

  /**
   * Remove discount from a cart
   */
  async removeDiscount(cartId: string, reason?: string, adminId?: string): Promise<{
    success: boolean;
    cart: CartWithDiscount;
  }> {
    const response = await fetch(`${API_BASE}/carts/${cartId}/discount`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason, adminId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to remove discount' }));
      throw new Error(error.error || 'Failed to remove discount');
    }

    return response.json();
  }

  /**
   * Apply discount to specific items in a cart
   */
  async applyDiscountToItems(cartId: string, data: ApplyToItemsData): Promise<{
    success: boolean;
    cart: CartWithDiscount;
  }> {
    const response = await fetch(`${API_BASE}/carts/${cartId}/discount/items`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to apply discount to items' }));
      throw new Error(error.error || 'Failed to apply discount to items');
    }

    return response.json();
  }

  /**
   * Get cart with discount details
   */
  async getCartWithDiscount(cartId: string): Promise<CartWithDiscount> {
    const response = await fetch(`${API_BASE}/carts/${cartId}/discount`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch cart' }));
      throw new Error(error.error || 'Failed to fetch cart');
    }

    return response.json();
  }

  /**
   * Bulk apply discount to multiple carts
   */
  async bulkApplyDiscount(
    cartIds: string[],
    discountCode: string,
    adminId?: string
  ): Promise<{
    applied: string[];
    failed: Array<{ cartId: string; reason: string }>;
    summary: {
      total: number;
      applied: number;
      failed: number;
    };
  }> {
    const response = await fetch(`${API_BASE}/carts/bulk/discount`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ cartIds, discountCode, adminId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to bulk apply discount' }));
      throw new Error(error.error || 'Failed to bulk apply discount');
    }

    return response.json();
  }

  /**
   * Get audit logs for a discount
   */
  async getAuditLogs(
    discountId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{
    logs: Array<{
      id: string;
      discountId: string;
      cartId?: string;
      adminId: string;
      action: string;
      previousData?: Record<string, unknown>;
      newData?: Record<string, unknown>;
      reason?: string;
      createdAt: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', String(options.page));
    if (options.limit) params.append('limit', String(options.limit));

    const response = await fetch(
      `${API_BASE}/discounts/${discountId}/audit?${params.toString()}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch audit logs' }));
      throw new Error(error.error || 'Failed to fetch audit logs');
    }

    return response.json();
  }
}

// Export singleton instance
const adminDiscountApi = new AdminDiscountApi();

export default adminDiscountApi;

// Export types
export type {
  Discount,
  DiscountWithStats,
  CartWithDiscount,
  CartItem,
  DiscountBreakdownItem,
  CreateDiscountData,
  ApplyDiscountData,
  ApplyToItemsData,
  PaginationResult,
};
