const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * SMS Notification Service
 * Handles sending SMS notifications for orders
 */

/**
 * Send order confirmation SMS to customer
 * @param {string} orderId - Order ID
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendOrderConfirmationSMS(orderId) {
  try {
    console.log(`[SMS Service] Sending order confirmation SMS for order: ${orderId}`);

    // Get order details
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        addresses: true
      }
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found'
      };
    }

    // Get recipient phone number
    let recipient = null;
    if (order.user && order.user.phone) {
      recipient = order.user.phone;
    } else if (order.addresses[0]?.phone) {
      recipient = order.addresses[0].phone;
    }

    if (!recipient) {
      return {
        success: false,
        error: 'No phone number found for this order'
      };
    }

    // Generate SMS content
    const message = `Smart Tech: Order #${order.orderNumber} confirmed! Total: ৳${parseFloat(order.total).toFixed(2)}. Thank you for your purchase!`;

    // Create notification record
    const notification = await prisma.orderNotification.create({
      data: {
        orderId,
        userId: order.userId,
        notificationType: 'order_confirmed',
        channel: 'sms',
        recipient,
        subject: 'Order Confirmation',
        message,
        status: 'pending',
        metadata: {
          orderNumber: order.orderNumber,
          total: order.total.toString()
        }
      }
    });

    console.log(`[SMS Service] Order confirmation notification created: ${notification.id}`);

    // Send SMS (async - don't block)
    sendSMSAsync(notification.id, recipient, message)
      .then(() => {
        console.log(`[SMS Service] Order confirmation SMS sent successfully to ${recipient}`);
      })
      .catch((error) => {
        console.error(`[SMS Service] Failed to send order confirmation SMS:`, error);
        updateNotificationStatus(notification.id, 'failed', error.message);
      });

    return {
      success: true,
      notificationId: notification.id
    };

  } catch (error) {
    console.error('[SMS Service] Error sending order confirmation SMS:', error);
    return {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send SMS'
    };
  }
}

/**
 * Send order status update SMS
 * @param {string} orderId - Order ID
 * @param {string} status - Order status
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendOrderStatusUpdateSMS(orderId, status) {
  try {
    console.log(`[SMS Service] Sending order status update SMS for order: ${orderId} - ${status}`);

    // Get order details
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        addresses: true
      }
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found'
      };
    }

    // Get recipient phone number
    let recipient = null;
    if (order.user && order.user.phone) {
      recipient = order.user.phone;
    } else if (order.addresses[0]?.phone) {
      recipient = order.addresses[0].phone;
    }

    if (!recipient) {
      return {
        success: false,
        error: 'No phone number found for this order'
      };
    }

    // Generate SMS content based on status
    const statusMessages = {
      confirmed: `Smart Tech: Order #${order.orderNumber} has been confirmed and is being prepared.`,
      processing: `Smart Tech: Order #${order.orderNumber} is being processed.`,
      shipped: `Smart Tech: Order #${order.orderNumber} has been shipped! Track your package for updates.`,
      delivered: `Smart Tech: Order #${order.orderNumber} has been delivered. Enjoy your purchase!`,
      cancelled: `Smart Tech: Order #${order.orderNumber} has been cancelled. Contact us for more info.`,
      refunded: `Smart Tech: Order #${order.orderNumber} refund has been processed.`
    };

    const message = statusMessages[status] || `Smart Tech: Order #${order.orderNumber} status updated to ${status}.`;

    // Create notification record
    const notification = await prisma.orderNotification.create({
      data: {
        orderId,
        userId: order.userId,
        notificationType: 'tracking_update',
        channel: 'sms',
        recipient,
        subject: 'Order Status Update',
        message,
        status: 'pending',
        metadata: {
          orderNumber: order.orderNumber,
          status
        }
      }
    });

    console.log(`[SMS Service] Order status update notification created: ${notification.id}`);

    // Send SMS (async - don't block)
    sendSMSAsync(notification.id, recipient, message)
      .then(() => {
        console.log(`[SMS Service] Order status update SMS sent successfully to ${recipient}`);
      })
      .catch((error) => {
        console.error(`[SMS Service] Failed to send order status update SMS:`, error);
        updateNotificationStatus(notification.id, 'failed', error.message);
      });

    return {
      success: true,
      notificationId: notification.id
    };

  } catch (error) {
    console.error('[SMS Service] Error sending order status update SMS:', error);
    return {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send SMS'
    };
  }
}

/**
 * Send shipment notification SMS
 * @param {string} orderId - Order ID
 * @param {string} trackingNumber - Tracking number
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendShipmentNotificationSMS(orderId, trackingNumber) {
  try {
    console.log(`[SMS Service] Sending shipment notification SMS for order: ${orderId}`);

    // Get order details
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        addresses: true
      }
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found'
      };
    }

    // Get recipient phone number
    let recipient = null;
    if (order.user && order.user.phone) {
      recipient = order.user.phone;
    } else if (order.addresses[0]?.phone) {
      recipient = order.addresses[0].phone;
    }

    if (!recipient) {
      return {
        success: false,
        error: 'No phone number found for this order'
      };
    }

    // Generate SMS content
    const message = `Smart Tech: Order #${order.orderNumber} has been shipped! Tracking: ${trackingNumber}. Track your package for updates.`;

    // Create notification record
    const notification = await prisma.orderNotification.create({
      data: {
        orderId,
        userId: order.userId,
        notificationType: 'order_shipped',
        channel: 'sms',
        recipient,
        subject: 'Order Shipped',
        message,
        status: 'pending',
        metadata: {
          orderNumber: order.orderNumber,
          trackingNumber
        }
      }
    });

    console.log(`[SMS Service] Shipment notification created: ${notification.id}`);

    // Send SMS (async - don't block)
    sendSMSAsync(notification.id, recipient, message)
      .then(() => {
        console.log(`[SMS Service] Shipment notification SMS sent successfully to ${recipient}`);
      })
      .catch((error) => {
        console.error(`[SMS Service] Failed to send shipment notification SMS:`, error);
        updateNotificationStatus(notification.id, 'failed', error.message);
      });

    return {
      success: true,
      notificationId: notification.id
    };

  } catch (error) {
    console.error('[SMS Service] Error sending shipment notification SMS:', error);
    return {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send SMS'
    };
  }
}

/**
 * Send delivery reminder SMS
 * @param {string} orderId - Order ID
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendDeliveryReminderSMS(orderId) {
  try {
    console.log(`[SMS Service] Sending delivery reminder SMS for order: ${orderId}`);

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        address: true,
        fulfillments: {
          where: {
            shippedAt: { not: null }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found'
      };
    }

    // Get recipient phone number
    let recipient = null;
    if (order.user && order.user.phone) {
      recipient = order.user.phone;
    } else if (order.addresses[0]?.phone) {
      recipient = order.addresses[0].phone;
    }

    if (!recipient) {
      return {
        success: false,
        error: 'No phone number found for this order'
      };
    }

    // Get tracking number if available
    const trackingNumber = order.fulfillments[0]?.trackingNumber || 'N/A';

    // Generate SMS content
    const message = `Smart Tech: Your order #${order.orderNumber} is out for delivery! Tracking: ${trackingNumber}. Please ensure someone is available to receive.`;

    // Create notification record
    const notification = await prisma.orderNotification.create({
      data: {
        orderId,
        userId: order.userId,
        notificationType: 'delivery_reminder',
        channel: 'sms',
        recipient,
        subject: 'Delivery Reminder',
        message,
        status: 'pending',
        metadata: {
          orderNumber: order.orderNumber,
          trackingNumber
        }
      }
    });

    console.log(`[SMS Service] Delivery reminder notification created: ${notification.id}`);

    // Send SMS (async - don't block)
    sendSMSAsync(notification.id, recipient, message)
      .then(() => {
        console.log(`[SMS Service] Delivery reminder SMS sent successfully to ${recipient}`);
      })
      .catch((error) => {
        console.error(`[SMS Service] Failed to send delivery reminder SMS:`, error);
        updateNotificationStatus(notification.id, 'failed', error.message);
      });

    return {
      success: true,
      notificationId: notification.id
    };

  } catch (error) {
    console.error('[SMS Service] Error sending delivery reminder SMS:', error);
    return {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send SMS'
    };
  }
}

/**
 * Helper function to send SMS asynchronously
 * This should be replaced with actual SMS service integration
 */
async function sendSMSAsync(notificationId, to, message) {
  try {
    // TODO: Integrate with actual SMS service (e.g., Twilio, Vonage, local SMS gateway)
    // For now, this is a placeholder that simulates SMS sending
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update notification status to sent
    await updateNotificationStatus(notificationId, 'sent');

    // Simulate delivery
    setTimeout(async () => {
      await updateNotificationStatus(notificationId, 'delivered');
    }, 2000);

    console.log(`[SMS Service] SMS sent to ${to} (notificationId: ${notificationId})`);
    console.log(`[SMS Service] Message: ${message}`);
    
    return { success: true };
  } catch (error) {
    console.error(`[SMS Service] Error sending SMS:`, error);
    throw error;
  }
}

/**
 * Helper function to update notification status
 */
async function updateNotificationStatus(notificationId, status, failureReason = null) {
  try {
    const updateData = {
      status
    };

    if (status === 'sent') {
      updateData.sentAt = new Date();
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    } else if (status === 'failed') {
      updateData.failedAt = new Date();
      updateData.failureReason = failureReason;
    }

    await prisma.orderNotification.update({
      where: { id: notificationId },
      data: updateData
    });

    console.log(`[SMS Service] Notification ${notificationId} status updated to ${status}`);
  } catch (error) {
    console.error(`[SMS Service] Error updating notification status:`, error);
  }
}

module.exports = {
  sendOrderConfirmationSMS,
  sendOrderStatusUpdateSMS,
  sendShipmentNotificationSMS,
  sendDeliveryReminderSMS
};
