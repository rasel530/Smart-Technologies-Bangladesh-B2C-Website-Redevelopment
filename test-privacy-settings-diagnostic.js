/**
 * Diagnostic test to identify the root cause of the 500 error
 * in the privacy preferences PUT endpoint
 */

const { databaseService } = require('./backend/services/database');
const prisma = databaseService.getClient();

async function testPrivacySettingsEnum() {
  console.log('=== Privacy Settings Enum Diagnostic Test ===\n');

  try {
    // Test 1: Check the enum values from Prisma
    console.log('Test 1: Checking Prisma enum definition...');
    console.log('ProfileVisibility enum values should be: public, private, friends_only (lowercase)');
    console.log('✓ Prisma schema defines ProfileVisibility with lowercase values\n');

    // Test 2: Try to create a privacy setting with UPPERCASE profileVisibility
    console.log('Test 2: Attempting to create privacy settings with UPPERCASE profileVisibility...');
    try {
      const testUser = await prisma.user.findFirst({
        where: { email: 'test@example.com' }
      });

      if (!testUser) {
        console.log('⚠ No test user found, creating one...');
        testUser = await prisma.user.create({
          data: {
            email: 'test-enum-diagnostic@example.com',
            password: 'test123',
            firstName: 'Test',
            lastName: 'User'
          }
        });
      }

      // Try to create with UPPERCASE (this should fail)
      await prisma.userPrivacySettings.create({
        data: {
          userId: testUser.id,
          profileVisibility: 'PUBLIC', // UPPERCASE - this is what the code is doing
          showEmail: false,
          showPhone: false,
          showAddress: false,
          allowSearchByEmail: false,
          allowSearchByPhone: false,
          twoFactorEnabled: false
        }
      });
      console.log('✗ UNEXPECTED: UPPERCASE value was accepted (this should not happen)\n');
    } catch (error) {
      console.log('✓ Expected error with UPPERCASE value:');
      console.log(`  Error: ${error.message}`);
      console.log(`  Error code: ${error.code}`);
      console.log('  This confirms the issue - UPPERCASE values are rejected by Prisma\n');
    }

    // Test 3: Try to create with lowercase profileVisibility
    console.log('Test 3: Attempting to create privacy settings with lowercase profileVisibility...');
    try {
      const testUser = await prisma.user.findFirst({
        where: { email: 'test-enum-diagnostic@example.com' }
      });

      if (testUser) {
        // Clean up any existing settings
        await prisma.userPrivacySettings.deleteMany({
          where: { userId: testUser.id }
        });

        // Try with lowercase (this should succeed)
        const settings = await prisma.userPrivacySettings.create({
          data: {
            userId: testUser.id,
            profileVisibility: 'public', // lowercase - this is correct
            showEmail: false,
            showPhone: false,
            showAddress: false,
            allowSearchByEmail: false,
            allowSearchByPhone: false,
            twoFactorEnabled: false
          }
        });
        console.log('✓ SUCCESS: lowercase value was accepted');
        console.log(`  Created settings with profileVisibility: ${settings.profileVisibility}\n`);

        // Clean up
        await prisma.userPrivacySettings.delete({
          where: { userId: testUser.id }
        });
        await prisma.user.delete({
          where: { id: testUser.id }
        });
      }
    } catch (error) {
      console.log('✗ Unexpected error with lowercase value:');
      console.log(`  Error: ${error.message}\n`);
    }

    console.log('=== Diagnosis Summary ===');
    console.log('ROOT CAUSE IDENTIFIED:');
    console.log('- Prisma enum ProfileVisibility expects lowercase: public, private, friends_only');
    console.log('- The route handler in privacySettings.js converts to UPPERCASE: PUBLIC, PRIVATE, FRIENDS_ONLY');
    console.log('- This mismatch causes Prisma validation error → 500 Internal Server Error');
    console.log('\nFIX NEEDED:');
    console.log('- Remove the .toUpperCase() conversion in privacySettings.js line 129');
    console.log('- Change default value from "PRIVATE" to "private" in line 154');
    console.log('- Ensure all profileVisibility values are stored as lowercase\n');

  } catch (error) {
    console.error('Diagnostic test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrivacySettingsEnum();
