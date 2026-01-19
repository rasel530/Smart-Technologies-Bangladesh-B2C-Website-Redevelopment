const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugNotificationPreferences() {
  const userId = '252a92b9-25be-4f07-9c32-db217727c16f';

  console.log('=== DEBUGGING NOTIFICATION PREFERENCES ===\n');
  console.log('User ID:', userId);

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });
    console.log('\nUser found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('User email:', user.email);
    }

    // Check notification preferences
    console.log('\n--- Checking notification preferences ---');
    const notificationPrefs = await prisma.userNotificationPreferences.findUnique({
      where: { userId }
    });

    console.log('Notification preferences found:', notificationPrefs ? 'YES' : 'NO');

    if (notificationPrefs) {
      console.log('\nNotification preferences data:');
      console.log(JSON.stringify(notificationPrefs, null, 2));

      // Test accessing fields like the service does
      console.log('\n--- Testing field access (like service does) ---');
      console.log('emailNotifications:', notificationPrefs.emailNotifications);
      console.log('smsNotifications:', notificationPrefs.smsNotifications);
      console.log('whatsappNotifications:', notificationPrefs.whatsappNotifications);
      console.log('promotionalEmails:', notificationPrefs.promotionalEmails);
      console.log('newsletterSubscription:', notificationPrefs.newsletterSubscription);
      console.log('pushNotifications:', notificationPrefs.pushNotifications);
      console.log('orderUpdates:', notificationPrefs.orderUpdates);
      console.log('securityAlerts:', notificationPrefs.securityAlerts);

      // Try to access the wrong field name
      console.log('\n--- Testing WRONG field name (newsletter instead of newsletterSubscription) ---');
      try {
        console.log('newsletter:', notificationPrefs.newsletter);
      } catch (error) {
        console.log('ERROR accessing newsletter field:', error.message);
      }
    } else {
      console.log('No notification preferences found for user');
      console.log('This would cause the service to try to access properties on null');
    }

    // Check communication preferences
    console.log('\n--- Checking communication preferences ---');
    const communicationPrefs = await prisma.userCommunicationPreferences.findUnique({
      where: { userId }
    });
    console.log('Communication preferences found:', communicationPrefs ? 'YES' : 'NO');

    // Check privacy settings
    console.log('\n--- Checking privacy settings ---');
    const privacyPrefs = await prisma.userPrivacySettings.findUnique({
      where: { userId }
    });
    console.log('Privacy settings found:', privacyPrefs ? 'YES' : 'NO');

  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugNotificationPreferences();
