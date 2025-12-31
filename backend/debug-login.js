const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Import auth routes
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

// Test data
const testEmail = 'test@example.com';
const testPassword = 'TestPassword123!';

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

async function testLogin() {
  console.log('Testing login...');
  
  try {
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
    console.log('Login response:', result);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed:', response.status, result);
    }
  } catch (error) {
    console.error('❌ Login test error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting debug login test...\n');
  
  // Create test user first
  await createTestUser();
  
  // Wait a bit for user to be created
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test login
  await testLogin();
  
  console.log('\n✅ Debug test completed!');
}

runTests().catch(console.error);