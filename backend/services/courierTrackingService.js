const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Courier Tracking Service
 * Handles integration with courier services for order tracking
 */

// Cache for tracking data to reduce API calls
const trackingCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Sync tracking information from courier API
 * @param {string} orderId - Order ID
 * @param {string} courierServiceId - Courier service ID
 * @param {string} trackingNumber - Tracking number
 * @returns {Promise<{success: boolean, syncedEventsCount: number, statusUpdated: boolean, error?: string}>}
 */
async function syncTrackingFromCourier(orderId, courierServiceId, trackingNumber) {
  try {
    console.log(`[CourierTracking] Syncing tracking for order ${orderId}, tracking: ${trackingNumber}`);

    // Get courier service details
    const courierService = await prisma.courierService.findUnique({
      where: { id: courierServiceId }
    });

    if (!courierService) {
      return {
        success: false,
        syncedEventsCount: 0,
        statusUpdated: false,
        error: 'Courier service not found'
      };
    }

    if (!courierService.isActive) {
      return {
        success: false,
        syncedEventsCount: 0,
        statusUpdated: false,
        error: 'Courier service is not active'
      };
    }

    // Get tracking data from courier API
    const trackingResult = await getTrackingFromCourier(courierServiceId, trackingNumber);
    
    if (!trackingResult.success) {
      return {
        success: false,
        syncedEventsCount: 0,
        statusUpdated: false,
        error: trackingResult.error || 'Failed to get tracking data from courier'
      };
    }

    // Parse tracking data
    const parsedData = parseCourierTrackingData(courierServiceId, trackingResult.trackingData);

    // Get existing tracking events to avoid duplicates
    const existingEvents = await prisma.orderTrackingEvent.findMany({
      where: { orderId }
    });

    const existingEventKeys = new Set(
      existingEvents.map(e => `${e.status}_${e.eventTime.toISOString()}`)
    );

    // Create new tracking events
    let syncedEventsCount = 0;
    const newEvents = [];

    for (const event of parsedData.events) {
      const eventKey = `${event.status}_${event.timestamp.toISOString()}`;
      
      if (!existingEventKeys.has(eventKey)) {
        newEvents.push({
          orderId,
          fulfillmentId: await getFulfillmentId(orderId),
          status: event.status,
          description: event.description,
          location: event.location,
          eventTime: event.timestamp,
          rawData: event.rawData || {}
        });
        syncedEventsCount++;
      }
    }

    // Create tracking events in database
    if (newEvents.length > 0) {
      await prisma.orderTrackingEvent.createMany({
        data: newEvents
      });
    }

    // Update order status based on latest tracking event
    let statusUpdated = false;
    if (parsedData.currentStatus) {
      const order = await prisma.orders.findUnique({
        where: { id: orderId }
      });

      if (order && order.status !== parsedData.currentStatus) {
        // Map courier status to order status
        const orderStatus = mapCourierStatusToOrderStatus(parsedData.currentStatus);
        
        if (orderStatus && orderStatus !== order.status) {
          await prisma.$transaction(async (tx) => {
            // Update order status
            const updateData = { status: orderStatus };
            if (orderStatus === 'shipped') updateData.shippedAt = new Date();
            if (orderStatus === 'delivered') updateData.deliveredAt = new Date();

            await tx.order.update({
              where: { id: orderId },
              data: updateData
            });

            // Create status history record
            await tx.orderStatusHistory.create({
              data: {
                orderId,
                previousStatus: order.status,
                newStatus: orderStatus,
                reason: `Tracking update from ${courierService.name}`,
                metadata: {
                  courierServiceId,
                  trackingNumber,
                  courierStatus: parsedData.currentStatus
                }
              }
            });
          });

          statusUpdated = true;
        }
      }
    }

    console.log(`[CourierTracking] Synced ${syncedEventsCount} events for order ${orderId}`);

    return {
      success: true,
      syncedEventsCount,
      statusUpdated
    };

  } catch (error) {
    console.error('[CourierTracking] Error syncing tracking:', error);
    return {
      success: false,
      syncedEventsCount: 0,
      statusUpdated: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    };
  }
}

/**
 * Get tracking information from courier API
 * @param {string} courierServiceId - Courier service ID
 * @param {string} trackingNumber - Tracking number
 * @returns {Promise<{success: boolean, trackingData?: any, error?: string}>}
 */
async function getTrackingFromCourier(courierServiceId, trackingNumber) {
  try {
    // Check cache first
    const cacheKey = `${courierServiceId}_${trackingNumber}`;
    const cached = trackingCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        success: true,
        trackingData: cached.data
      };
    }

    // Get courier service details
    const courierService = await prisma.courierService.findUnique({
      where: { id: courierServiceId }
    });

    if (!courierService || !courierService.apiEndpoint) {
      return {
        success: false,
        error: 'Courier service not configured'
      };
    }

    // Make API call to courier service
    // This is a placeholder - actual implementation depends on courier API
    const response = await fetch(`${courierService.apiEndpoint}/track/${trackingNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${courierService.apiKey || ''}`
      }
    });

    if (!response.ok) {
      throw new Error(`Courier API returned ${response.status}`);
    }

    const trackingData = await response.json();

    // Cache the result
    trackingCache.set(cacheKey, {
      data: trackingData,
      timestamp: Date.now()
    });

    return {
      success: true,
      trackingData
    };

  } catch (error) {
    console.error('[CourierTracking] Error getting tracking from courier:', error);
    return {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch tracking data'
    };
  }
}

/**
 * Parse raw tracking data from courier API
 * @param {string} courierServiceId - Courier service ID
 * @param {any} rawData - Raw tracking data from courier API
 * @returns {{events: Array, currentStatus: string, estimatedDelivery: Date, lastLocation: string}}
 */
function parseCourierTrackingData(courierServiceId, rawData) {
  // Default structure
  const result = {
    events: [],
    currentStatus: null,
    estimatedDelivery: null,
    lastLocation: null
  };

  try {
    // Parse based on courier service type
    // This is a placeholder - actual parsing depends on courier API format
    
    if (Array.isArray(rawData.events)) {
      // Standard format with events array
      result.events = rawData.events.map(event => ({
        status: event.status || event.statusCode || 'unknown',
        description: event.description || event.statusDescription || '',
        location: event.location || event.locationName || null,
        timestamp: event.timestamp || event.date || event.eventTime ? new Date(event.timestamp || event.date || event.eventTime) : new Date(),
        rawData: event
      }));
    } else if (rawData.trackings && Array.isArray(rawData.trackings)) {
      // Alternative format
      result.events = rawData.trackings.map(track => ({
        status: track.status || 'unknown',
        description: track.description || '',
        location: track.location || null,
        timestamp: track.date ? new Date(track.date) : new Date(),
        rawData: track
      }));
    }

    // Get current status
    if (rawData.currentStatus || rawData.status) {
      result.currentStatus = rawData.currentStatus || rawData.status;
    } else if (result.events.length > 0) {
      result.currentStatus = result.events[result.events.length - 1].status;
    }

    // Get estimated delivery
    if (rawData.estimatedDelivery || rawData.eta) {
      result.estimatedDelivery = new Date(rawData.estimatedDelivery || rawData.eta);
    }

    // Get last location
    if (rawData.lastLocation || rawData.currentLocation) {
      result.lastLocation = rawData.lastLocation || rawData.currentLocation;
    } else if (result.events.length > 0) {
      const lastEventWithLocation = result.events
        .slice()
        .reverse()
        .find(e => e.location);
      if (lastEventWithLocation) {
        result.lastLocation = lastEventWithLocation.location;
      }
    }

  } catch (error) {
    console.error('[CourierTracking] Error parsing tracking data:', error);
  }

  return result;
}

/**
 * Generate tracking URL for customer
 * @param {string} courierServiceId - Courier service ID
 * @param {string} trackingNumber - Tracking number
 * @returns {Promise<{success: boolean, trackingUrl?: string, error?: string}>}
 */
async function getTrackingUrl(courierServiceId, trackingNumber) {
  try {
    const courierService = await prisma.courierService.findUnique({
      where: { id: courierServiceId }
    });

    if (!courierService) {
      return {
        success: false,
        error: 'Courier service not found'
      };
    }

    if (!courierService.trackingUrl) {
      return {
        success: false,
        error: 'Tracking URL not configured for this courier service'
      };
    }

    // Replace placeholder with tracking number
    const trackingUrl = courierService.trackingUrl.replace('{tracking_number}', trackingNumber);

    return {
      success: true,
      trackingUrl
    };

  } catch (error) {
    console.error('[CourierTracking] Error generating tracking URL:', error);
    return {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to generate tracking URL'
    };
  }
}

/**
 * Test courier service connection
 * @param {string} courierServiceId - Courier service ID
 * @param {string} testTrackingNumber - Optional test tracking number
 * @returns {Promise<{success: boolean, connected: boolean, responseTime?: number, error?: string}>}
 */
async function testCourierConnection(courierServiceId, testTrackingNumber) {
  const startTime = Date.now();
  
  try {
    const courierService = await prisma.courierService.findUnique({
      where: { id: courierServiceId }
    });

    if (!courierService) {
      return {
        success: true,
        connected: false,
        error: 'Courier service not found'
      };
    }

    if (!courierService.apiEndpoint) {
      return {
        success: true,
        connected: false,
        error: 'API endpoint not configured'
      };
    }

    // Test connection with a simple health check or tracking query
    const testUrl = testTrackingNumber 
      ? `${courierService.apiEndpoint}/track/${testTrackingNumber}`
      : `${courierService.apiEndpoint}/health`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${courierService.apiKey || ''}`
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    const connected = response.ok || response.status < 500;

    return {
      success: true,
      connected,
      responseTime,
      error: !connected ? `API returned status ${response.status}` : undefined
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      connected: false,
      responseTime,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Connection failed'
    };
  }
}

/**
 * Get fulfillment ID for an order
 * @param {string} orderId - Order ID
 * @returns {Promise<string|null>}
 */
async function getFulfillmentId(orderId) {
  try {
    const fulfillment = await prisma.orderFulfillment.findFirst({
      where: { orderId }
    });
    return fulfillment ? fulfillment.id : null;
  } catch (error) {
    console.error('[CourierTracking] Error getting fulfillment ID:', error);
    return null;
  }
}

/**
 * Map courier status to order status
 * @param {string} courierStatus - Status from courier API
 * @returns {string|null}
 */
function mapCourierStatusToOrderStatus(courierStatus) {
  const status = courierStatus.toLowerCase();
  
  // Delivered statuses
  if (status.includes('delivered') || status.includes('delivered') || status === 'delivered') {
    return 'delivered';
  }
  
  // Shipped/Out for delivery statuses
  if (status.includes('shipped') || status.includes('out for delivery') || 
      status.includes('in transit') || status.includes('on the way') ||
      status.includes('picked up') || status === 'shipped') {
    return 'shipped';
  }
  
  // Processing statuses
  if (status.includes('processing') || status.includes('picked') || status === 'processing') {
    return 'processing';
  }
  
  // Default to current status if no match
  return null;
}

/**
 * Clear tracking cache
 * @param {string} courierServiceId - Optional courier service ID
 * @param {string} trackingNumber - Optional tracking number
 */
function clearTrackingCache(courierServiceId, trackingNumber) {
  if (courierServiceId && trackingNumber) {
    trackingCache.delete(`${courierServiceId}_${trackingNumber}`);
  } else {
    trackingCache.clear();
  }
}

module.exports = {
  syncTrackingFromCourier,
  getTrackingFromCourier,
  parseCourierTrackingData,
  getTrackingUrl,
  testCourierConnection,
  clearTrackingCache
};
