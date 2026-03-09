const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Email Notification Service
 * Handles sending email notifications for orders
 */

// Helper function to generate email content for order confirmation
const generateOrderConfirmationEmail = (order, items, customer, address) => {
  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        ${item.product.name}
        ${item.variant ? `<br><small style="color: #666;">Variant: ${item.variant.name}</small>` : ''}
      </td>
      <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e0e0e0;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e0e0e0;">৳${parseFloat(item.unitPrice).toFixed(2)}</td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e0e0e0;">৳${parseFloat(item.totalPrice).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .order-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .order-info p { margin: 5px 0; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #007bff; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #007bff; color: #ffffff; padding: 12px; text-align: left; }
        th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
        .total-section { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .total-row.final { font-weight: bold; font-size: 18px; color: #007bff; border-top: 2px solid #007bff; padding-top: 10px; margin-top: 10px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${customer.firstName} ${customer.lastName},</p>
          <p>Thank you for your order! We're pleased to confirm that we have received your order and it's being processed.</p>
          
          <div class="order-info">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>

          <div class="section-title">Order Items</div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row"><span>Subtotal:</span><span>৳${parseFloat(order.subtotal).toFixed(2)}</span></div>
            <div class="total-row"><span>Tax:</span><span>৳${parseFloat(order.tax).toFixed(2)}</span></div>
            <div class="total-row"><span>Shipping:</span><span>৳${parseFloat(order.shippingCost).toFixed(2)}</span></div>
            <div class="total-row"><span>Discount:</span><span>-৳${parseFloat(order.discount).toFixed(2)}</span></div>
            <div class="total-row final"><span>Total:</span><span>৳${parseFloat(order.total).toFixed(2)}</span></div>
          </div>

          <div class="section-title">Shipping Address</div>
          <p>
            ${address.firstName} ${address.lastName}<br>
            ${address.address}<br>
            ${address.addressLine2 ? address.addressLine2 + '<br>' : ''}
            ${address.city}, ${address.district}<br>
            ${address.division}<br>
            ${address.postalCode ? address.postalCode : ''}
          </p>

          <div class="section-title">Payment Method</div>
          <p>${order.paymentMethod.replace('_', ' ').toUpperCase()}</p>

          <p>If you have any questions about your order, please don't hesitate to contact us.</p>
          <p>Thank you for shopping with us!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Smart Technologies Bangladesh. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Helper function to generate email content for order status update
const generateOrderStatusUpdateEmail = (order, previousStatus, newStatus) => {
  const statusMessages = {
    confirmed: 'Your order has been confirmed and is being prepared for shipment.',
    processing: 'Your order is currently being processed.',
    shipped: 'Your order has been shipped and is on its way to you!',
    delivered: 'Your order has been delivered. We hope you enjoy your purchase!',
    cancelled: 'Your order has been cancelled.',
    refunded: 'Your order has been refunded.'
  };

  const message = statusMessages[newStatus] || `Your order status has been updated to ${newStatus}.`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Update - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .status-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
        .status-box .status { font-size: 24px; font-weight: bold; color: #007bff; }
        .order-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .order-info p { margin: 5px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Status Update</h1>
        </div>
        <div class="content">
          <p>Dear Customer,</p>
          
          <div class="status-box">
            <p>Your order status has been updated:</p>
            <div class="status">${newStatus.toUpperCase()}</div>
          </div>

          <div class="order-info">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Previous Status:</strong> ${previousStatus}</p>
            <p><strong>New Status:</strong> ${newStatus}</p>
            <p><strong>Updated At:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <p>${message}</p>

          <p>If you have any questions about your order, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Smart Technologies Bangladesh. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Helper function to generate email content for shipment notification
const generateShipmentNotificationEmail = (order, trackingNumber, courier) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Shipped - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #28a745; color: #ffffff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .tracking-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
        .tracking-box .tracking-number { font-size: 20px; font-weight: bold; color: #007bff; }
        .order-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .order-info p { margin: 5px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 10px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Order Has Been Shipped!</h1>
        </div>
        <div class="content">
          <p>Dear Customer,</p>
          <p>Great news! Your order has been shipped and is on its way to you.</p>
          
          <div class="order-info">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Courier:</strong> ${courier}</p>
            <p><strong>Shipped Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="tracking-box">
            <p><strong>Tracking Number:</strong></p>
            <div class="tracking-number">${trackingNumber}</div>
            <a href="#" class="button">Track Your Package</a>
          </div>

          <p>You can track your package's journey using the tracking number above.</p>
          <p>Expected delivery time depends on your location and the courier service.</p>

          <p>If you have any questions about your shipment, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Smart Technologies Bangladesh. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Helper function to generate email content for delivery confirmation
const generateDeliveryConfirmationEmail = (order) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Delivered - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #28a745; color: #ffffff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .order-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .order-info p { margin: 5px 0; }
        .review-box { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #ffc107; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 10px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Delivered!</h1>
        </div>
        <div class="content">
          <p>Dear Customer,</p>
          <p>Your order has been successfully delivered. We hope you enjoy your purchase!</p>
          
          <div class="order-info">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> ৳${parseFloat(order.total).toFixed(2)}</p>
          </div>

          <div class="review-box">
            <p><strong>Share Your Experience</strong></p>
            <p>We'd love to hear what you think about your purchase. Please take a moment to leave a review.</p>
            <a href="#" class="button">Write a Review</a>
          </div>

          <p>If you have any questions or concerns about your order, please don't hesitate to contact us.</p>
          <p>Thank you for shopping with us!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Smart Technologies Bangladesh. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Helper function to generate email content for cancellation
const generateCancellationEmail = (order, reason) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Cancelled - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #dc3545; color: #ffffff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .order-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .order-info p { margin: 5px 0; }
        .reason-box { background-color: #f8d7da; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #dc3545; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Cancelled</h1>
        </div>
        <div class="content">
          <p>Dear Customer,</p>
          <p>We regret to inform you that your order has been cancelled.</p>
          
          <div class="order-info">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> ৳${parseFloat(order.total).toFixed(2)}</p>
          </div>

          <div class="reason-box">
            <p><strong>Cancellation Reason:</strong></p>
            <p>${reason || 'No reason provided'}</p>
          </div>

          <p>If you have already made a payment, a refund will be processed according to our refund policy.</p>
          <p>If you have any questions about this cancellation, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Smart Technologies Bangladesh. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Helper function to generate email content for refund notification
const generateRefundNotificationEmail = (order, refundAmount, refundMethod) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Refund Processed - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #ffc107; color: #333; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .order-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .order-info p { margin: 5px 0; }
        .refund-box { background-color: #d4edda; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #28a745; }
        .refund-box .amount { font-size: 24px; font-weight: bold; color: #28a745; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Refund Processed</h1>
        </div>
        <div class="content">
          <p>Dear Customer,</p>
          <p>We have processed a refund for your order.</p>
          
          <div class="order-info">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Refund Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="refund-box">
            <p><strong>Refund Amount:</strong></p>
            <div class="amount">৳${parseFloat(refundAmount).toFixed(2)}</div>
            <p><strong>Refund Method:</strong> ${refundMethod}</p>
          </div>

          <p>The refund has been initiated to your original payment method. Please allow 3-7 business days for the refund to appear in your account, depending on your payment provider.</p>
          <p>If you have any questions about this refund, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Smart Technologies Bangladesh. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send order confirmation email to customer
 * @param {string} orderId - Order ID
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendOrderConfirmationEmail(orderId) {
  try {
    console.log(`[Email Service] Sending order confirmation email for order: ${orderId}`);

    // Get order details
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        addresses: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            },
            variant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found'
      };
    }

    // For guest orders, get customer info from address
    const customer = order.user || {
      firstName: order.addresses[0].firstName,
      lastName: order.addresses[0].lastName,
      email: order.addresses[0].firstName + '@guest.com' // Placeholder for guest
    };

    // Generate email content
    const subject = `Order Confirmation - ${order.orderNumber}`;
    const htmlContent = generateOrderConfirmationEmail(order, order.items, customer, order.addresses[0]);

    // Create notification record
    const notification = await prisma.orderNotification.create({
      data: {
        orderId,
        userId: order.userId,
        notificationType: 'order_confirmed',
        channel: 'email',
        recipient: customer.email,
        subject,
        message: htmlContent,
        status: 'pending',
        metadata: {
          orderNumber: order.orderNumber,
          total: order.total.toString()
        }
      }
    });

    console.log(`[Email Service] Order confirmation notification created: ${notification.id}`);

    // Send email (async - don't block)
    sendEmailAsync(notification.id, customer.email, subject, htmlContent)
      .then(() => {
        console.log(`[Email Service] Order confirmation email sent successfully to ${customer.email}`);
      })
      .catch((error) => {
        console.error(`[Email Service] Failed to send order confirmation email:`, error);
        updateNotificationStatus(notification.id, 'failed', error.message);
      });

    return {
      success: true,
      notificationId: notification.id
    };

  } catch (error) {
    console.error('[Email Service] Error sending order confirmation email:', error);
    return {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send email'
    };
  }
}

/**
 * Send order status update email
 * @param {string} orderId - Order ID
 * @param {string} previousStatus - Previous status
 * @param {string} newStatus - New status
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendOrderStatusUpdateEmail(orderId, previousStatus, newStatus) {
  try {
    console.log(`[Email Service] Sending order status update email for order: ${orderId} - ${previousStatus} -> ${newStatus}`);

    // Get order details
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!order || !order.user) {
      return {
        success: false,
        error: 'Order or user not found'
      };
    }

    const customer = order.user;

    // Generate email content
    const subject = `Order Status Update - ${order.orderNumber}`;
    const htmlContent = generateOrderStatusUpdateEmail(order, previousStatus, newStatus);

    // Create notification record
    const notification = await prisma.orderNotification.create({
      data: {
        orderId,
        userId: order.userId,
        notificationType: 'tracking_update',
        channel: 'email',
        recipient: customer.email,
        subject,
        message: htmlContent,
        status: 'pending',
        metadata: {
          orderNumber: order.orderNumber,
          previousStatus,
          newStatus
        }
      }
    });

    console.log(`[Email Service] Order status update notification created: ${notification.id}`);

    // Send email (async - don't block)
    sendEmailAsync(notification.id, customer.email, subject, htmlContent)
      .then(() => {
        console.log(`[Email Service] Order status update email sent successfully to ${customer.email}`);
      })
      .catch((error) => {
        console.error(`[Email Service] Failed to send order status update email:`, error);
        updateNotificationStatus(notification.id, 'failed', error.message);
      });

    return {
      success: true,
      notificationId: notification.id
    };

  } catch (error) {
    console.error('[Email Service] Error sending order status update email:', error);
    return {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send email'
    };
  }
}

/**
 * Send shipment notification email with tracking info
 * @param {string} orderId - Order ID
 * @param {string} trackingNumber - Tracking number
 * @param {string} courier - Courier service name
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendShipmentNotificationEmail(orderId, trackingNumber, courier) {
  try {
    console.log(`[Email Service] Sending shipment notification email for order: ${orderId}`);

    // Get order details
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!order || !order.user) {
      return {
        success: false,
        error: 'Order or user not found'
      };
    }

    const customer = order.user;

    // Generate email content
    const subject = `Your Order Has Been Shipped - ${order.orderNumber}`;
    const htmlContent = generateShipmentNotificationEmail(order, trackingNumber, courier);

    // Create notification record
    const notification = await prisma.orderNotification.create({
      data: {
        orderId,
        userId: order.userId,
        notificationType: 'order_shipped',
        channel: 'email',
        recipient: customer.email,
        subject,
        message: htmlContent,
        status: 'pending',
        metadata: {
          orderNumber: order.orderNumber,
          trackingNumber,
          courier
        }
      }
    });

    console.log(`[Email Service] Shipment notification created: ${notification.id}`);

    // Send email (async - don't block)
    sendEmailAsync(notification.id, customer.email, subject, htmlContent)
      .then(() => {
        console.log(`[Email Service] Shipment notification email sent successfully to ${customer.email}`);
      })
      .catch((error) => {
        console.error(`[Email Service] Failed to send shipment notification email:`, error);
        updateNotificationStatus(notification.id, 'failed', error.message);
      });

    return {
      success: true,
      notificationId: notification.id
    };

  } catch (error) {
    console.error('[Email Service] Error sending shipment notification email:', error);
    return {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send email'
    };
  }
}

/**
 * Send delivery confirmation email
 * @param {string} orderId - Order ID
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendDeliveryConfirmationEmail(orderId) {
  try {
    console.log(`[Email Service] Sending delivery confirmation email for order: ${orderId}`);

    // Get order details
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!order || !order.user) {
      return {
        success: false,
        error: 'Order or user not found'
      };
    }

    const customer = order.user;

    // Generate email content
    const subject = `Order Delivered - ${order.orderNumber}`;
    const htmlContent = generateDeliveryConfirmationEmail(order);

    // Create notification record
    const notification = await prisma.orderNotification.create({
      data: {
        orderId,
        userId: order.userId,
        notificationType: 'order_delivered',
        channel: 'email',
        recipient: customer.email,
        subject,
        message: htmlContent,
        status: 'pending',
        metadata: {
          orderNumber: order.orderNumber,
          total: order.total.toString()
        }
      }
    });

    console.log(`[Email Service] Delivery confirmation notification created: ${notification.id}`);

    // Send email (async - don't block)
    sendEmailAsync(notification.id, customer.email, subject, htmlContent)
      .then(() => {
        console.log(`[Email Service] Delivery confirmation email sent successfully to ${customer.email}`);
      })
      .catch((error) => {
        console.error(`[Email Service] Failed to send delivery confirmation email:`, error);
        updateNotificationStatus(notification.id, 'failed', error.message);
      });

    return {
      success: true,
      notificationId: notification.id
    };

  } catch (error) {
    console.error('[Email Service] Error sending delivery confirmation email:', error);
    return {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send email'
    };
  }
}

/**
 * Send cancellation notification email
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendCancellationEmail(orderId, reason) {
  try {
    console.log(`[Email Service] Sending cancellation email for order: ${orderId}`);

    // Get order details
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!order || !order.user) {
      return {
        success: false,
        error: 'Order or user not found'
      };
    }

    const customer = order.user;

    // Generate email content
    const subject = `Order Cancelled - ${order.orderNumber}`;
    const htmlContent = generateCancellationEmail(order, reason);

    // Create notification record
    const notification = await prisma.orderNotification.create({
      data: {
        orderId,
        userId: order.userId,
        notificationType: 'order_cancelled',
        channel: 'email',
        recipient: customer.email,
        subject,
        message: htmlContent,
        status: 'pending',
        metadata: {
          orderNumber: order.orderNumber,
          reason
        }
      }
    });

    console.log(`[Email Service] Cancellation notification created: ${notification.id}`);

    // Send email (async - don't block)
    sendEmailAsync(notification.id, customer.email, subject, htmlContent)
      .then(() => {
        console.log(`[Email Service] Cancellation email sent successfully to ${customer.email}`);
      })
      .catch((error) => {
        console.error(`[Email Service] Failed to send cancellation email:`, error);
        updateNotificationStatus(notification.id, 'failed', error.message);
      });

    return {
      success: true,
      notificationId: notification.id
    };

  } catch (error) {
    console.error('[Email Service] Error sending cancellation email:', error);
    return {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send email'
    };
  }
}

/**
 * Send refund notification email
 * @param {string} orderId - Order ID
 * @param {number|string} refundAmount - Refund amount
 * @param {string} refundMethod - Refund method
 * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
 */
async function sendRefundNotificationEmail(orderId, refundAmount, refundMethod) {
  try {
    console.log(`[Email Service] Sending refund notification email for order: ${orderId}`);

    // Get order details
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!order || !order.user) {
      return {
        success: false,
        error: 'Order or user not found'
      };
    }

    const customer = order.user;

    // Generate email content
    const subject = `Refund Processed - ${order.orderNumber}`;
    const htmlContent = generateRefundNotificationEmail(order, refundAmount, refundMethod);

    // Create notification record
    const notification = await prisma.orderNotification.create({
      data: {
        orderId,
        userId: order.userId,
        notificationType: 'refund_completed',
        channel: 'email',
        recipient: customer.email,
        subject,
        message: htmlContent,
        status: 'pending',
        metadata: {
          orderNumber: order.orderNumber,
          refundAmount: refundAmount.toString(),
          refundMethod
        }
      }
    });

    console.log(`[Email Service] Refund notification created: ${notification.id}`);

    // Send email (async - don't block)
    sendEmailAsync(notification.id, customer.email, subject, htmlContent)
      .then(() => {
        console.log(`[Email Service] Refund notification email sent successfully to ${customer.email}`);
      })
      .catch((error) => {
        console.error(`[Email Service] Failed to send refund notification email:`, error);
        updateNotificationStatus(notification.id, 'failed', error.message);
      });

    return {
      success: true,
      notificationId: notification.id
    };

  } catch (error) {
    console.error('[Email Service] Error sending refund notification email:', error);
    return {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send email'
    };
  }
}

/**
 * Helper function to send email asynchronously
 * This should be replaced with actual email service integration
 */
async function sendEmailAsync(notificationId, to, subject, html) {
  try {
    // TODO: Integrate with actual email service (e.g., SendGrid, Mailgun, AWS SES)
    // For now, this is a placeholder that simulates email sending
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update notification status to sent
    await updateNotificationStatus(notificationId, 'sent');

    // Simulate delivery
    setTimeout(async () => {
      await updateNotificationStatus(notificationId, 'delivered');
    }, 2000);

    console.log(`[Email Service] Email sent to ${to} (notificationId: ${notificationId})`);
    
    return { success: true };
  } catch (error) {
    console.error(`[Email Service] Error sending email:`, error);
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

    console.log(`[Email Service] Notification ${notificationId} status updated to ${status}`);
  } catch (error) {
    console.error(`[Email Service] Error updating notification status:`, error);
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendShipmentNotificationEmail,
  sendDeliveryConfirmationEmail,
  sendCancellationEmail,
  sendRefundNotificationEmail
};
