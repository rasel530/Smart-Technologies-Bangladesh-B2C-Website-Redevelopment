/**
 * Response Transformation Middleware
 * Automatically transforms Prisma responses to frontend-compatible format
 * Handles snake_case to camelCase conversion and Decimal to number conversion
 */

const {
  transformSnakeToCamel,
  decimalToNumber,
  transformOrder,
  transformOrderItem,
  transformOrderModification,
  transformOrderCancellation,
  transformOrderFulfillment,
  transformOrderNote,
  transformOrderStatusHistory,
  transformCourierService
} = require('../utils/dataTransformers');

/**
 * Middleware to transform response data
 * Automatically converts snake_case to camelCase and Decimal to number
 */
function responseTransformer(req, res, next) {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method
  res.json = function(data) {
    // Only transform if data exists and is an object
    if (data && typeof data === 'object') {
      // Transform the data
      const transformed = transformResponseData(data);
      return originalJson(transformed);
    }
    return originalJson(data);
  };

  next();
}

/**
 * Transform response data based on route context
 * @param {any} data - Response data
 * @returns {any} - Transformed data
 */
function transformResponseData(data) {
  // If data is an array, transform each item
  if (Array.isArray(data)) {
    return data.map(item => transformResponseData(item));
  }

  // If data is an object, transform it
  if (data && typeof data === 'object') {
    // Check if it's a paginated response
    if (data.data && Array.isArray(data.data) && data.pagination) {
      return {
        ...data,
        data: data.data.map(item => transformResponseData(item)),
        pagination: {
          ...data.pagination,
          page: parseInt(data.pagination.page),
          limit: parseInt(data.pagination.limit),
          total: parseInt(data.pagination.total),
          pages: Math.ceil(data.pagination.total / data.pagination.limit)
        }
      };
    }

    // Check if it's a single item response with data property
    if (data.data && !Array.isArray(data.data)) {
      return {
        ...data,
        data: transformResponseData(data.data)
      };
    }

    // Check for common Prisma response patterns
    const transformed = transformSnakeToCamel(data);

    // Transform monetary values
    if (transformed.subtotal !== undefined) {
      transformed.subtotal = decimalToNumber(transformed.subtotal);
    }
    if (transformed.tax !== undefined) {
      transformed.tax = decimalToNumber(transformed.tax);
    }
    if (transformed.shippingCost !== undefined) {
      transformed.shippingCost = decimalToNumber(transformed.shippingCost);
    }
    if (transformed.discount !== undefined) {
      transformed.discount = decimalToNumber(transformed.discount);
    }
    if (transformed.total !== undefined) {
      transformed.total = decimalToNumber(transformed.total);
    }
    if (transformed.refundAmount !== undefined) {
      transformed.refundAmount = decimalToNumber(transformed.refundAmount);
    }

    // Transform nested arrays
    if (transformed.orderItems || transformed.order_items) {
      const items = transformed.orderItems || transformed.order_items;
      transformed.orderItems = items.map(item => {
        const transformedItem = transformSnakeToCamel(item);
        if (transformedItem.unitPrice !== undefined) {
          transformedItem.unitPrice = decimalToNumber(transformedItem.unitPrice);
        }
        if (transformedItem.totalPrice !== undefined) {
          transformedItem.totalPrice = decimalToNumber(transformedItem.totalPrice);
        }
        if (transformedItem.price !== undefined) {
          transformedItem.price = decimalToNumber(transformedItem.price);
        }
        return transformedItem;
      });
      delete transformed.order_items;
    }

    // Transform users to user for consistency
    if (transformed.users && !transformed.user) {
      transformed.user = transformed.users;
    }

    // Transform addresses to address for consistency
    if (transformed.addresses && !transformed.address) {
      transformed.address = transformed.addresses;
    }

    return transformed;
  }

  return data;
}

/**
 * Helper function to manually transform a response
 * Use this when you need more control over transformation
 * @param {object} data - Data to transform
 * @param {string} type - Type of data (order, modification, cancellation, etc.)
 * @returns {object} - Transformed data
 */
function manualTransform(data, type = 'default') {
  switch (type) {
    case 'order':
      return transformOrder(data);
    case 'orderItem':
      return transformOrderItem(data);
    case 'modification':
      return transformOrderModification(data);
    case 'cancellation':
      return transformOrderCancellation(data);
    case 'fulfillment':
      return transformOrderFulfillment(data);
    case 'note':
      return transformOrderNote(data);
    case 'statusHistory':
      return transformOrderStatusHistory(data);
    case 'courier':
      return transformCourierService(data);
    default:
      return transformSnakeToCamel(data);
  }
}

module.exports = {
  responseTransformer,
  transformResponseData,
  manualTransform
};
