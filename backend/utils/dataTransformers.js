/**
 * Data Transformation Utilities
 * Handles conversion between Prisma schema (snake_case) and frontend expectations (camelCase)
 * Converts Decimal values to numbers for consistent JSON serialization
 */

/**
 * Convert snake_case string to camelCase
 * @param {string} str - snake_case string
 * @returns {string} - camelCase string
 */
function toCamelCase(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 * @param {string} str - camelCase string
 * @returns {string} - snake_case string
 */
function toSnakeCase(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Recursively transform object keys from snake_case to camelCase
 * @param {any} data - Data to transform
 * @returns {any} - Transformed data
 */
function transformSnakeToCamel(data) {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => transformSnakeToCamel(item));
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data;
  }

  // Handle objects
  if (typeof data === 'object') {
    const transformed = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const camelKey = toCamelCase(key);
        transformed[camelKey] = transformSnakeToCamel(data[key]);
      }
    }
    return transformed;
  }

  // Handle primitives
  return data;
}

/**
 * Convert Decimal value to number
 * @param {any} value - Value to convert
 * @returns {number} - Converted number
 */
function decimalToNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  
  // Handle Prisma Decimal objects
  if (typeof value === 'object' && value !== null && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  
  // Handle strings
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  // Handle numbers
  if (typeof value === 'number') {
    return value;
  }
  
  return 0;
}

/**
 * Transform order object for frontend consumption
 * Converts snake_case to camelCase and Decimal to number
 * @param {object} order - Order object from Prisma
 * @returns {object} - Transformed order object
 */
function transformOrder(order) {
  if (!order) return null;

  return {
    ...transformSnakeToCamel(order),
    // Ensure monetary values are numbers
    subtotal: decimalToNumber(order.subtotal),
    tax: decimalToNumber(order.tax),
    shippingCost: decimalToNumber(order.shippingCost),
    discount: decimalToNumber(order.discount),
    total: decimalToNumber(order.total),
    // Transform items if present
    items: order.items ? order.items.map(transformOrderItem) : order.order_items ? order.order_items.map(transformOrderItem) : [],
    // Transform users to user for consistency
    user: order.users || order.user,
    // Transform addresses to address for consistency
    address: order.addresses || order.address
  };
}

/**
 * Transform order item object for frontend consumption
 * @param {object} item - Order item object from Prisma
 * @returns {object} - Transformed order item object
 */
function transformOrderItem(item) {
  if (!item) return null;

  return {
    ...transformSnakeToCamel(item),
    // Ensure monetary values are numbers
    unitPrice: decimalToNumber(item.unitPrice || item.price),
    totalPrice: decimalToNumber(item.totalPrice || (item.price * item.quantity)),
    // Add price for backward compatibility
    price: decimalToNumber(item.price || item.unitPrice)
  };
}

/**
 * Transform order modification object for frontend consumption
 * @param {object} modification - Order modification object from Prisma
 * @returns {object} - Transformed order modification object
 */
function transformOrderModification(modification) {
  if (!modification) return null;

  return {
    ...transformSnakeToCamel(modification),
    // Ensure monetary values are numbers
    refundAmount: decimalToNumber(modification.refundAmount)
  };
}

/**
 * Transform order cancellation object for frontend consumption
 * @param {object} cancellation - Order cancellation object from Prisma
 * @returns {object} - Transformed order cancellation object
 */
function transformOrderCancellation(cancellation) {
  if (!cancellation) return null;

  return {
    ...transformSnakeToCamel(cancellation),
    // Ensure monetary values are numbers
    refundAmount: decimalToNumber(cancellation.refundAmount)
  };
}

/**
 * Transform order fulfillment object for frontend consumption
 * @param {object} fulfillment - Order fulfillment object from Prisma
 * @returns {object} - Transformed order fulfillment object
 */
function transformOrderFulfillment(fulfillment) {
  if (!fulfillment) return null;

  return {
    ...transformSnakeToCamel(fulfillment),
    // Transform courier service if present
    courierService: fulfillment.courier_services || fulfillment.courierService
  };
}

/**
 * Transform order note object for frontend consumption
 * @param {object} note - Order note object from Prisma
 * @returns {object} - Transformed order note object
 */
function transformOrderNote(note) {
  if (!note) return null;

  return {
    ...transformSnakeToCamel(note),
    // Transform user if present
    user: note.users || note.user
  };
}

/**
 * Transform order status history object for frontend consumption
 * @param {object} history - Order status history object from Prisma
 * @returns {object} - Transformed order status history object
 */
function transformOrderStatusHistory(history) {
  if (!history) return null;

  return {
    ...transformSnakeToCamel(history),
    // Transform user if present
    user: history.users || history.user
  };
}

/**
 * Transform courier service object for frontend consumption
 * @param {object} courier - Courier service object from Prisma
 * @returns {object} - Transformed courier service object
 */
function transformCourierService(courier) {
  if (!courier) return null;

  return {
    ...transformSnakeToCamel(courier)
  };
}

/**
 * Transform paginated response for frontend consumption
 * @param {object} data - Data array
 * @param {object} pagination - Pagination metadata
 * @param {function} transformFn - Optional transform function for individual items
 * @returns {object} - Transformed paginated response
 */
function transformPaginatedResponse(data, pagination, transformFn) {
  const transformedData = transformFn 
    ? data.map(transformFn)
    : data.map(item => transformSnakeToCamel(item));

  return {
    success: true,
    data: transformedData,
    pagination: {
      page: parseInt(pagination.page),
      limit: parseInt(pagination.limit),
      total: parseInt(pagination.total),
      pages: Math.ceil(pagination.total / pagination.limit)
    }
  };
}

/**
 * Transform single item response for frontend consumption
 * @param {object} item - Item to transform
 * @param {function} transformFn - Optional transform function
 * @returns {object} - Transformed response
 */
function transformSingleResponse(item, transformFn) {
  const transformed = transformFn 
    ? transformFn(item)
    : transformSnakeToCamel(item);

  return {
    success: true,
    data: transformed
  };
}

/**
 * Standardize error response
 * @param {string} error - Error message
 * @param {string} message - Detailed message (optional)
 * @param {number} status - HTTP status code
 * @returns {object} - Standardized error response
 */
function transformErrorResponse(error, message = null, status = 500) {
  return {
    success: false,
    error,
    message: message || error,
    status
  };
}

module.exports = {
  toCamelCase,
  toSnakeCase,
  transformSnakeToCamel,
  decimalToNumber,
  transformOrder,
  transformOrderItem,
  transformOrderModification,
  transformOrderCancellation,
  transformOrderFulfillment,
  transformOrderNote,
  transformOrderStatusHistory,
  transformCourierService,
  transformPaginatedResponse,
  transformSingleResponse,
  transformErrorResponse
};
