/**
 * Fix test user phone number for phone login testing
 * This script updates or creates a test user with the correct phone number format
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixTestUserPhone() {
  try {
    console.log('=== Fixing Test User Phone Number ===\n');
    
    // Test credentials
    const testEmail = 'test@example.com';
    const testPhone = '+8801700000000';
    const testPassword = 'TestPassword123!';
    
    console.log('Test credentials:');
    console.log('  Email:', testEmail);
    console.log('  Phone:', testPhone);
    console.log('  Password:', testPassword);
    console.log('');
    
    // Check if user exists
    console.log('Checking if user exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        status: true
      }
    });
    
    // Hash password using the same method as registration
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    if (existingUser) {
      console.log('✓ User found:', existingUser.email);
      console.log('  Current phone:', existingUser.phone || 'NOT SET');
      console.log('  Current status:', existingUser.status);
      console.log('');
      
      // Update user with phone number
      console.log('Updating user with phone number...');
      const updatedUser = await prisma.user.update({
        where: { email: testEmail },
        data: {
          phone: testPhone,
          password: hashedPassword,
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });
      
      console.log('✓ User updated successfully!');
      console.log('  Email:', updatedUser.email);
      console.log('  Phone:', updatedUser.phone);
      console.log('  Name:', updatedUser.firstName, updatedUser.lastName);
      console.log('  Status:', updatedUser.status);
      console.log('  Email Verified:', updatedUser.emailVerified);
      
    } else {
      console.log('✗ User not found. Creating new user...');
      console.log('');
      
      // Create new user with phone number
      console.log('Creating new user with phone number...');
      const newUser = await prisma.user.create({
        data: {
          email: testEmail,
          phone: testPhone,
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });
      
      console.log('✓ User created successfully!');
      console.log('  Email:', newUser.email);
      console.log('  Phone:', newUser.phone);
      console.log('  Name:', newUser.firstName, newUser.lastName);
      console.log('  Role:', newUser.role);
      console.log('  Status:', newUser.status);
      console.log('  Email Verified:', newUser.emailVerified);
    }
    
    console.log('\n=== Test User Ready ===');
    console.log('You can now login with:');
    console.log('  Email: test@example.com');
    console.log('  Phone: +8801700000000');
    console.log('  Password: TestPassword123!');
    console.log('\nPhone number login should now work correctly!');
    
  } catch (error) {
    console.error('\n✗ Failed to fix test user phone number:');
    console.error(error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixTestUserPhone();
