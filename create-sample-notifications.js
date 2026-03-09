/**
 * Sample Notification Data Generator
 * 
 * This script creates sample OrderNotification records for testing the admin notifications page.
 * It is idempotent - running it multiple times won't create duplicates.
 */

const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

// Sample data configurations
const NOTIFICATION_TYPES = [
  'order_confirmed',
  'order_shipped',
  'order_delivered',
  'payment_failed',
  'payment_received',
  'invoice_generated',
  'tracking_update'
];

const CHANNELS = ['email', 'sms'];

const STATUSES = ['pending', 'sent', 'delivered', 'failed'];

const FAILURE_REASONS = [
  'Insufficient funds',
  'Invalid email address',
  'SMS delivery failed',
  'Network timeout',
  'Rate limit exceeded'
];

// Sample email addresses and phone numbers
const EMAILS = [
  'customer1@example.com',
  'customer2@example.com',
  'customer3@example.com',
  'customer4@example.com',
  'customer5@example.com',
  'rahim.ahmed@example.com',
  'karim.hossain@example.com',
  'fatima.begum@example.com'
];

const PHONES = [
  '+8801712345678',
  '+8801812345678',
  '+8801912345678',
  '+8801612345678',
  '+8801512345678'
];

// Sample order IDs
const ORDER_IDS = [
  'ORD-001',
  'ORD-002',
  'ORD-003',
  'ORD-004',
  'ORD-005',
  'ORD-006',
  'ORD-007',
  'ORD-008',
  'ORD-009',
  'ORD-010'
];

// Sample user IDs (optional, can be null)
const USER_IDS = [
  null,
  null,
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  null
];

/**
 * Generate a random date within the last N days
 */
function getRandomDate(daysAgo) {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

/**
 * Get a random item from an array
 */
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate sample notification data
 */
function generateSampleNotifications() {
  const notifications = [];

  // Recent notifications (last 7 days) - 15 notifications
  for (let i = 0; i < 15; i++) {
    const type = getRandomItem(NOTIFICATION_TYPES);
    const channel = getRandomItem(CHANNELS);
    const status = getRandomItem(STATUSES);
    const recipient = channel === 'email' ? getRandomItem(EMAILS) : getRandomItem(PHONES);
    const orderId = getRandomItem(ORDER_IDS);
    const userId = getRandomItem(USER_IDS);
    const createdAt = getRandomDate(7);

    let notification = {
      orderId,
      userId,
      notificationType: type,
      channel,
      recipient,
      subject: generateSubject(type, channel, orderId),
      message: generateMessage(type, channel, orderId),
      status,
      createdAt
    };

    // Add timestamps based on status
    if (status === 'sent' || status === 'delivered') {
      notification.sentAt = getRandomDate(6);
    }
    if (status === 'delivered') {
      notification.deliveredAt = getRandomDate(5);
    }
    if (status === 'failed') {
      notification.failedAt = getRandomDate(6);
      notification.failureReason = getRandomItem(FAILURE_REASONS);
    }

    // Add metadata for some notifications
    if (Math.random() > 0.5) {
      notification.metadata = {
        priority: Math.random() > 0.7 ? 'high' : 'normal',
        attempts: Math.floor(Math.random() * 3) + 1,
        template: `${type}_${channel}`
      };
    }

    notifications.push(notification);
  }

  // Older notifications (last 30 days) - 15 notifications
  for (let i = 0; i < 15; i++) {
    const type = getRandomItem(NOTIFICATION_TYPES);
    const channel = getRandomItem(CHANNELS);
    const status = getRandomItem(STATUSES);
    const recipient = channel === 'email' ? getRandomItem(EMAILS) : getRandomItem(PHONES);
    const orderId = getRandomItem(ORDER_IDS);
    const userId = getRandomItem(USER_IDS);
    const createdAt = getRandomDate(30);

    let notification = {
      orderId,
      userId,
      notificationType: type,
      channel,
      recipient,
      subject: generateSubject(type, channel, orderId),
      message: generateMessage(type, channel, orderId),
      status,
      createdAt
    };

    // Add timestamps based on status
    if (status === 'sent' || status === 'delivered') {
      notification.sentAt = getRandomDate(29);
    }
    if (status === 'delivered') {
      notification.deliveredAt = getRandomDate(28);
    }
    if (status === 'failed') {
      notification.failedAt = getRandomDate(29);
      notification.failureReason = getRandomItem(FAILURE_REASONS);
    }

    notifications.push(notification);
  }

  // Ensure at least 5 failed notifications with different reasons
  const failedNotifications = notifications.filter(n => n.status === 'failed');
  if (failedNotifications.length < 5) {
    // Add more failed notifications if needed
    const additionalFailedNeeded = 5 - failedNotifications.length;
    for (let i = 0; i < additionalFailedNeeded; i++) {
      const type = getRandomItem(NOTIFICATION_TYPES);
      const channel = getRandomItem(CHANNELS);
      const recipient = channel === 'email' ? getRandomItem(EMAILS) : getRandomItem(PHONES);
      const orderId = getRandomItem(ORDER_IDS);
      const userId = getRandomItem(USER_IDS);
      const createdAt = getRandomDate(20);

      notifications.push({
        orderId,
        userId,
        notificationType: type,
        channel,
        recipient,
        subject: generateSubject(type, channel, orderId),
        message: generateMessage(type, channel, orderId),
        status: 'failed',
        sentAt: getRandomDate(19),
        failedAt: getRandomDate(19),
        failureReason: FAILURE_REASONS[i],
        createdAt
      });
    }
  }

  return notifications;
}

/**
 * Generate subject line based on notification type
 */
function generateSubject(type, channel, orderId) {
  const subjects = {
    order_confirmed: `Order Confirmation - ${orderId}`,
    order_shipped: `Your Order ${orderId} Has Been Shipped`,
    order_delivered: `Order Delivered - ${orderId}`,
    payment_failed: `Payment Failed for Order ${orderId}`,
    payment_received: `Payment Successful - ${orderId}`,
    invoice_generated: `Invoice Generated for Order ${orderId}`,
    tracking_update: `Tracking Update for Order ${orderId}`
  };
  
  return subjects[type] || `Notification for Order ${orderId}`;
}

/**
 * Generate message content based on notification type
 */
function generateMessage(type, channel, orderId) {
  const messages = {
    order_confirmed: `Thank you for your order! Your order ${orderId} has been confirmed and is being processed.`,
    order_shipped: `Great news! Your order ${orderId} has been shipped and is on its way to you.`,
    order_delivered: `Your order ${orderId} has been delivered successfully. We hope you enjoy your purchase!`,
    payment_failed: `We were unable to process payment for order ${orderId}. Please update your payment information.`,
    payment_received: `Payment for order ${orderId} has been successfully processed. Thank you!`,
    invoice_generated: `Your invoice for order ${orderId} has been generated and is attached.`,
    tracking_update: `There's an update on your order ${orderId}. Please check the tracking details.`
  };
  
  return messages[type] || `This is a notification regarding your order ${orderId}.`;
}

/**
 * Check if a notification already exists (to avoid duplicates)
 */
async function notificationExists(notification) {
  const existing = await prisma.orderNotification.findFirst({
    where: {
      orderId: notification.orderId,
      notificationType: notification.notificationType,
      channel: notification.channel,
      recipient: notification.recipient,
      createdAt: notification.createdAt
    }
  });
  return existing !== null;
}

/**
 * Main function to create sample notifications
 */
async function createSampleNotifications() {
  console.log('='.repeat(60));
  console.log('Sample Notification Data Generator');
  console.log('='.repeat(60));
  console.log();

  try {
    // Check existing notifications
    const existingCount = await prisma.orderNotification.count();
    console.log(`Current notification count in database: ${existingCount}`);
    console.log();

    // Generate sample notifications
    const sampleNotifications = generateSampleNotifications();
    console.log(`Generated ${sampleNotifications.length} sample notifications`);
    console.log();

    // Create notifications that don't already exist
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sampleNotifications.length; i++) {
      const notification = sampleNotifications[i];
      
      try {
        // Check if notification already exists
        const exists = await notificationExists(notification);
        
        if (exists) {
          skippedCount++;
          console.log(`[${i + 1}/${sampleNotifications.length}] Skipped (already exists): ${notification.notificationType} - ${notification.recipient}`);
          continue;
        }

        // Create the notification
        await prisma.orderNotification.create({
          data: notification
        });

        createdCount++;
        console.log(`[${i + 1}/${sampleNotifications.length}] Created: ${notification.notificationType} (${notification.channel}) - ${notification.status}`);
      } catch (error) {
        errorCount++;
        console.error(`[${i + 1}/${sampleNotifications.length}] Error creating notification:`, error.message);
      }
    }

    console.log();
    console.log('='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
    console.log(`Total notifications processed: ${sampleNotifications.length}`);
    console.log(`Successfully created: ${createdCount}`);
    console.log(`Skipped (already exists): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);

    // Get final count
    const finalCount = await prisma.orderNotification.count();
    console.log(`Total notifications in database: ${finalCount}`);
    console.log();

    // Display statistics by status
    const statusCounts = await prisma.orderNotification.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    console.log('Notifications by status:');
    statusCounts.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.status}`);
    });
    console.log();

    // Display statistics by type
    const typeCounts = await prisma.orderNotification.groupBy({
      by: ['notificationType'],
      _count: {
        notificationType: true
      }
    });
    console.log('Notifications by type:');
    typeCounts.forEach(stat => {
      console.log(`  ${stat.notificationType}: ${stat._count.notificationType}`);
    });
    console.log();

    // Display statistics by channel
    const channelCounts = await prisma.orderNotification.groupBy({
      by: ['channel'],
      _count: {
        channel: true
      }
    });
    console.log('Notifications by channel:');
    channelCounts.forEach(stat => {
      console.log(`  ${stat.channel}: ${stat._count.channel}`);
    });
    console.log();

    console.log('='.repeat(60));
    console.log('Script completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  } finally {
    // Clean up database connection
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

// Run the script
createSampleNotifications()
  .then(() => {
    console.log('Script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
