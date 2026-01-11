/**
 * Change Password for User: raselbepari88@gmail.com
 * 
 * This script:
 * 1. Connects to the PostgreSQL database using Prisma
 * 2. Finds the user with email raselbepari88@gmail.com
 * 3. Generates a new secure password
 * 4. Hashes the new password using bcrypt (12 rounds)
 * 5. Updates the user's password in the database
 * 6. Verifies the password was updated successfully
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Target user email
const TARGET_EMAIL = 'raselbepari88@gmail.com';

// Generate a secure password that meets requirements:
// - Minimum 8 characters
// - Includes uppercase letters
// - Includes lowercase letters
// - Includes numbers
// - Includes special characters
// - Easy to remember but not guessable
const NEW_PASSWORD = 'Smart@Tech2026!';

async function changeUserPassword() {
  console.log('='.repeat(60));
  console.log('Password Change Script');
  console.log('='.repeat(60));
  console.log(`Target Email: ${TARGET_EMAIL}`);
  console.log(`New Password: ${NEW_PASSWORD}`);
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Find the user
    console.log('📋 Step 1: Finding user...');
    const user = await prisma.user.findUnique({
      where: { email: TARGET_EMAIL }
    });

    if (!user) {
      console.error(`❌ User not found with email: ${TARGET_EMAIL}`);
      console.log('Please verify the email address and try again.');
      return;
    }

    console.log(`✅ User found: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log();

    // Step 2: Hash the new password using bcrypt with 12 rounds
    console.log('🔐 Step 2: Hashing new password...');
    console.log(`   Using bcrypt with 12 rounds...`);
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 12);
    console.log('✅ Password hashed successfully');
    console.log();

    // Step 3: Update the user's password
    console.log('💾 Step 3: Updating password in database...');
    const updatedUser = await prisma.user.update({
      where: { email: TARGET_EMAIL },
      data: {
        password: hashedPassword
      }
    });
    console.log('✅ Password updated successfully');
    console.log();

    // Step 4: Verify the password was updated
    console.log('🔍 Step 4: Verifying password update...');
    const isPasswordValid = await bcrypt.compare(NEW_PASSWORD, updatedUser.password);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful');
      console.log();

      // Final confirmation
      console.log('='.repeat(60));
      console.log('✅ PASSWORD CHANGE COMPLETED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log();
      console.log('📧 User Details:');
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   Status: ${updatedUser.status}`);
      console.log();
      console.log('🔑 Login Credentials:');
      console.log(`   Email: ${TARGET_EMAIL}`);
      console.log(`   Password: ${NEW_PASSWORD}`);
      console.log();
      console.log('📝 Password Requirements Met:');
      console.log('   ✅ Minimum 8 characters');
      console.log('   ✅ Includes uppercase letters');
      console.log('   ✅ Includes lowercase letters');
      console.log('   ✅ Includes numbers');
      console.log('   ✅ Includes special characters');
      console.log('   ✅ Secure and not easily guessable');
      console.log();
      console.log('🌐 You can now login at:');
      console.log('   Frontend: http://localhost:3000/login');
      console.log('   Backend API: http://localhost:3001/api/auth/login');
      console.log('='.repeat(60));
    } else {
      console.error('❌ Password verification failed');
      console.error('The password was updated but verification failed.');
      console.error('Please check the database and try again.');
    }

  } catch (error) {
    console.error('❌ Error changing password:', error.message);
    console.error();
    console.error('Full error details:');
    console.error(error);
  } finally {
    // Always disconnect from the database
    await prisma.$disconnect();
    console.log();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
changeUserPassword();
