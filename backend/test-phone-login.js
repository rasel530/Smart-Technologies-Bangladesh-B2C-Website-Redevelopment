const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Import the modified auth routes
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

// Test data
const testEmail = 'test@example.com';
const testPhone = '01712345678';
const testPassword = 'TestPassword123!';

async function testPhoneLogin() {
  console.log('Testing phone login functionality...');
  
  try {
    // Test with phone number
    const response = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: testPhone,
        password: testPassword
      })
    });

    const result = await response.json();
    console.log('Phone login response:', result);
    
    if (response.ok) {
      console.log('✅ Phone login successful');
      console.log('Login type:', result.loginType);
      console.log('User info:', result.user);
    } else {
      console.log('❌ Phone login failed:', response.status, result);
    }
  } catch (error) {
    console.error('❌ Phone login test error:', error.message);
  }
}

async function testEmailLogin() {
  console.log('Testing email login functionality...');
  
  try {
    // Test with email
    const response = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: testEmail,
        password: testPassword
      })
    });

    const result = await response.json();
    console.log('Email login response:', result);
    
    if (response.ok) {
      console.log('✅ Email login successful');
      console.log('Login type:', result.loginType);
      console.log('User info:', result.user);
    } else {
      console.log('❌ Email login failed:', response.status, result);
    }
  } catch (error) {
    console.error('❌ Email login test error:', error.message);
  }
}

async function createTestUser() {
  console.log('Creating test user...');
  
  const prisma = new PrismaClient();
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: testEmail },
          { phone: '+8801712345678' }
        ]
      }
    });

    if (existingUser) {
      console.log('✅ Test user already exists');
      await prisma.$disconnect();
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        phone: '+8801712345678',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      }
    });

    console.log('✅ Test user created with ID:', user.id);
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    await prisma.$disconnect();
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting phone login tests...\n');
  
  // Create test user first
  await createTestUser();
  
  // Wait a bit for user to be created
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test both login methods
  await testEmailLogin();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testPhoneLogin();
  
  console.log('\n✅ Tests completed!');
}

runTests().catch(console.error);