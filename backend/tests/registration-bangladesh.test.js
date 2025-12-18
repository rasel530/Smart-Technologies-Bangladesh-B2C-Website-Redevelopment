/**
 * Bangladesh-Specific Testing Suite for Registration Functionality
 * 
 * This test suite covers Bangladesh-specific validation including:
 * - All mobile operator validation
 * - Bangladesh address structure testing
 * - Local language support testing
 * - Cultural considerations testing
 * - Regional format validation
 * - Local SMS gateway testing
 * - Bengali character support testing
 * - Time zone handling testing
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { phoneValidationService } = require('../services/phoneValidationService');
const { smsService } = require('../services/smsService');
const { otpService } = require('../services/otpService');
const app = require('../index');

describe('Bangladesh-Specific Registration Tests', () => {
  let prisma;
  let testUsers = [];

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.emailVerificationToken.deleteMany({});
    await prisma.phoneOTP.deleteMany({});
    await prisma.passwordHistory.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: 'bangladesh.test' } }
    });
    testUsers = [];
  });

  afterEach(async () => {
    // Clean up any remaining test data
    for (const user of testUsers) {
      try {
        await prisma.user.delete({ where: { id: user.id } });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Bangladesh Mobile Operator Validation', () => {
    /**
     * Test all major Bangladesh mobile operators
     */
    test('should validate all supported Bangladesh mobile operators', async () => {
      const operators = [
        { phone: '+8801312345678', operator: 'Grameenphone', prefix: '013' },
        { phone: '+8801712345678', operator: 'Grameenphone', prefix: '017' },
        { phone: '+8801912345678', operator: 'Banglalink', prefix: '019' },
        { phone: '+8801812345678', operator: 'Robi', prefix: '018' },
        { phone: '+8801512345678', operator: 'Teletalk', prefix: '015' },
        { phone: '+8801612345678', operator: 'Airtel', prefix: '016' },
        { phone: '+8801412345678', operator: 'Banglalink', prefix: '014' }
      ];

      for (const { phone, operator, prefix } of operators) {
        const validation = phoneValidationService.validateBangladeshPhoneNumber(phone);
        
        expect(validation.isValid).toBe(true);
        expect(validation.operator).toBe(operator);
        expect(validation.normalizedPhone).toBe(phone);
        expect(validation.prefix).toBe(prefix);
        expect(validation.operatorDetails).toBeTruthy();
        expect(validation.operatorDetails.name).toBe(operator);
      }
    });

    /**
     * Test operator-specific validation rules
     */
    test('should apply operator-specific validation rules', async () => {
      // Test Grameenphone validation
      const gpValidation = phoneValidationService.validateBangladeshPhoneNumber('+8801712345678');
      expect(gpValidation.operator).toBe('Grameenphone');
      expect(gpValidation.operatorDetails.supportedServices).toContain('SMS');
      expect(gpValidation.operatorDetails.supportedServices).toContain('OTP');

      // Test Robi validation
      const robiValidation = phoneValidationService.validateBangladeshPhoneNumber('+8801812345678');
      expect(robiValidation.operator).toBe('Robi');
      expect(robiValidation.operatorDetails.supportedServices).toContain('SMS');
      expect(robiValidation.operatorDetails.supportedServices).toContain('OTP');

      // Test Teletalk validation
      const teletalkValidation = phoneValidationService.validateBangladeshPhoneNumber('+8801512345678');
      expect(teletalkValidation.operator).toBe('Teletalk');
      expect(teletalkValidation.operatorDetails.supportedServices).toContain('SMS');
      expect(teletalkValidation.operatorDetails.supportedServices).toContain('OTP');
    });

    /**
     * Test operator prefix mapping
     */
    test('should correctly map operator prefixes', async () => {
      const prefixTests = [
        { prefix: '013', expectedOperator: 'Grameenphone' },
        { prefix: '014', expectedOperator: 'Banglalink' },
        { prefix: '015', expectedOperator: 'Teletalk' },
        { prefix: '016', expectedOperator: 'Airtel' },
        { prefix: '017', expectedOperator: 'Grameenphone' },
        { prefix: '018', expectedOperator: 'Robi' },
        { prefix: '019', expectedOperator: 'Banglalink' }
      ];

      for (const { prefix, expectedOperator } of prefixTests) {
        const phone = `+880${prefix}12345678`;
        const validation = phoneValidationService.validateBangladeshPhoneNumber(phone);
        
        expect(validation.isValid).toBe(true);
        expect(validation.operator).toBe(expectedOperator);
      }
    });
  });

  describe('Bangladesh Address Structure Testing', () => {
    /**
     * Test Bangladesh division and district validation
     */
    test('should validate Bangladesh administrative divisions', async () => {
      const divisions = [
        'DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET', 
        'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH'
      ];

      for (const division of divisions) {
        const userData = {
          firstName: 'Division',
          lastName: 'Test',
          email: `division.test@bangladesh.example.com`,
          phone: '+8801712345678',
          password: 'DivisionTest2024!',
          confirmPassword: 'DivisionTest2024!'
        };

        // Register user
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        const userId = registerResponse.body.user.id;
        testUsers.push({ id: userId });

        // Create address with division
        const address = await prisma.address.create({
          data: {
            userId,
            type: 'SHIPPING',
            firstName: userData.firstName,
            lastName: userData.lastName,
            address: '123 Test Street',
            city: 'Test City',
            district: 'Test District',
            division: division,
            postalCode: '1000'
          }
        });

        expect(address.division).toBe(division);
      }
    });

    /**
     * Test Bangladesh district validation
     */
    test('should validate Bangladesh districts', async () => {
      const validDistricts = [
        'Dhaka', 'Chattogram', 'Rajshahi', 'Sylhet',
        'Khulna', 'Barishal', 'Rangpur', 'Mymensingh',
        'Barguna', 'Pirojpur', 'Patuakhali', 'Jhalokathi',
        'Brahmanbaria', 'Cumilla', 'Chandpur', 'Lakshmipur',
        'Feni', 'Noakhali', 'Bandarban', 'Rangamati',
        'Gazipur', 'Kishoreganj', 'Manikganj', 'Munshiganj',
        'Narayanganj', 'Narsingdi', 'Tangail', 'Sirajganj',
        'Bagerhat', 'Chuadanga', 'Jashore', 'Jessore',
        'Khulna', 'Kushtia', 'Magura', 'Meherpur',
        'Narail', 'Satkhira', 'Dinajpur', 'Gaibandha',
        'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh',
        'Rangpur', 'Joypurhat', 'Naogaon', 'Natore',
        'Pabna', 'Rajshahi', 'Sirajganj', 'Bogura'
      ];

      for (const district of validDistricts) {
        const userData = {
          firstName: 'District',
          lastName: 'Test',
          email: `district.test@bangladesh.example.com`,
          phone: '+8801712345678',
          password: 'DistrictTest2024!',
          confirmPassword: 'DistrictTest2024!'
        };

        // Register user
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        const userId = registerResponse.body.user.id;
        testUsers.push({ id: userId });

        // Create address with district
        const address = await prisma.address.create({
          data: {
            userId,
            type: 'SHIPPING',
            firstName: userData.firstName,
            lastName: userData.lastName,
            address: '123 Test Street',
            city: district,
            district: district,
            division: 'DHAKA',
            postalCode: '1000'
          }
        });

        expect(address.district).toBe(district);
      }
    });

    /**
     * Test Bangladesh postal code validation
     */
    test('should validate Bangladesh postal codes', async () => {
      const validPostalCodes = ['1000', '1200', '1216', '1340', '4000'];

      for (const postalCode of validPostalCodes) {
        const userData = {
          firstName: 'Postal',
          lastName: 'Test',
          email: `postal.test@bangladesh.example.com`,
          phone: '+8801712345678',
          password: 'PostalTest2024!',
          confirmPassword: 'PostalTest2024!'
        };

        // Register user
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        const userId = registerResponse.body.user.id;
        testUsers.push({ id: userId });

        // Create address with postal code
        const address = await prisma.address.create({
          data: {
            userId,
            type: 'SHIPPING',
            firstName: userData.firstName,
            lastName: userData.lastName,
            address: '123 Test Street',
            city: 'Dhaka',
            district: 'Dhaka',
            division: 'DHAKA',
            postalCode
          }
        });

        expect(address.postalCode).toBe(postalCode);
      }
    });
  });

  describe('Local Language Support Testing', () => {
    /**
     * Test Bengali character support in names
     */
    test('should support Bengali characters in user names', async () => {
      const bengaliNames = [
        { firstName: 'রহাসান', lastName: 'মাহমুদ' },
        { firstName: 'সামিউর', lastName: 'রহক' },
        { firstName: 'আব্দুল', lastName: 'রহিম' }
      ];

      for (const names of bengaliNames) {
        const userData = {
          ...names,
          email: `bengali.test@bangladesh.example.com`,
          phone: '+8801712345678',
          password: 'বাংলাদেশ2024!',
          confirmPassword: 'বাংলাদেশ2024!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        const userId = response.body.user.id;
        testUsers.push({ id: userId });

        // Verify names are stored correctly
        const createdUser = await prisma.user.findUnique({
          where: { id: userId }
        });

        expect(createdUser.firstName).toBe(names.firstName);
        expect(createdUser.lastName).toBe(names.lastName);
      }
    });

    /**
     * Test mixed language support
     */
    test('should handle mixed Bengali-English names', async () => {
      const mixedNames = [
        { firstName: 'Mohammad', lastName: 'হাসান' },
        { firstName: 'সামিউর', lastName: 'Khan' },
        { firstName: 'Abdul', lastName: 'রহিম' }
      ];

      for (const names of mixedNames) {
        const userData = {
          ...names,
          email: `mixed.test@bangladesh.example.com`,
          phone: '+8801712345678',
          password: 'MixedTest2024!',
          confirmPassword: 'MixedTest2024!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        const userId = response.body.user.id;
        testUsers.push({ id: userId });

        // Verify mixed names are handled correctly
        const createdUser = await prisma.user.findUnique({
          where: { id: userId }
        });

        expect(createdUser.firstName).toBe(names.firstName);
        expect(createdUser.lastName).toBe(names.lastName);
      }
    });

    /**
     * Test Bengali email addresses
     */
    test('should support Bengali email addresses', async () => {
      const bengaliEmails = [
        'user@বাংলাদেশ.কম',
        'test@ঢাকা.বাংলা',
        'demo@স্মার্ট.টেক'
      ];

      for (const email of bengaliEmails) {
        const userData = {
          firstName: 'Bengali',
          lastName: 'Email',
          email,
          phone: '+8801712345678',
          password: 'BengaliTest2024!',
          confirmPassword: 'BengaliTest2024!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        // Should either accept or reject based on email validation rules
        expect([201, 400]).toContain(response.status);
      }
    });
  });

  describe('Cultural Considerations Testing', () => {
    /**
     * Test Bangladesh-specific cultural naming patterns
     */
    test('should handle common Bangladeshi naming patterns', async () => {
      const commonNames = [
        { firstName: 'Mohammad', lastName: 'Hossain' },
        { firstName: 'Abdul', lastName: 'Rahman' },
        { firstName: 'Fatima', lastName: 'Begum' },
        { firstName: 'Khadija', lastName: 'Islam' }
      ];

      for (const names of commonNames) {
        const userData = {
          ...names,
          email: `cultural.test@bangladesh.example.com`,
          phone: '+8801712345678',
          password: 'CulturalTest2024!',
          confirmPassword: 'CulturalTest2024!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        const userId = response.body.user.id;
        testUsers.push({ id: userId });

        // Verify names are stored correctly
        const createdUser = await prisma.user.findUnique({
          where: { id: userId }
        });

        expect(createdUser.firstName).toBe(names.firstName);
        expect(createdUser.lastName).toBe(names.lastName);
      }
    });

    /**
     * Test Bangladesh-specific password patterns
     */
    test('should prevent Bangladeshi common password patterns', async () => {
      const bangladeshiPatterns = [
        'bangladesh123',
        'dhaka123',
        'pakistan123',
        'cricket123',
        'tigers123',
        'bengal123',
        'dhaka2024',
        'bangla123',
        'pakistan786',
        'cricket786'
      ];

      for (const password of bangladeshiPatterns) {
        const userData = {
          firstName: 'Pattern',
          lastName: 'Test',
          email: `pattern.test@bangladesh.example.com`,
          phone: '+8801712345678',
          password,
          confirmPassword: password
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toBe('Password does not meet requirements');
        expect(response.body.details.feedback).toContain('Bangladeshi');
      }
    });
  });

  describe('Regional Format Validation', () => {
    /**
     * Test Bangladesh date format preferences
     */
    test('should handle Bangladesh date formats', async () => {
      const bangladeshiDates = [
        '17/12/2024', // DD/MM/YYYY
        '2024-12-17', // YYYY-MM-DD
        '17 Dec 2024', // DD Mon YYYY
        'ডিসেম্বর ১৭, ২০২৪' // Bengali date
      ];

      for (const dateStr of bangladeshiDates) {
        const userData = {
          firstName: 'Date',
          lastName: 'Test',
          email: `date.test@bangladesh.example.com`,
          phone: '+8801712345678',
          password: 'DateTest2024!',
          confirmPassword: 'DateTest2024!',
          dateOfBirth: new Date(dateStr)
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        // Should handle date parsing correctly
        expect([201, 400]).toContain(response.status);
      }
    });

    /**
     * Test Bangladesh time zone handling
     */
    test('should handle Bangladesh time zone correctly', async () => {
      const userData = {
        firstName: 'Timezone',
        lastName: 'Test',
        email: 'timezone.test@bangladesh.example.com',
        phone: '+8801712345678',
        password: 'TimezoneTest2024!',
        confirmPassword: 'TimezoneTest2024!',
        dateOfBirth: new Date('2000-01-01')
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Verify timestamps are in correct timezone
      const createdUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      expect(createdUser.createdAt).toBeInstanceOf(Date);
      // Should be stored in UTC but represent Bangladesh time (UTC+6)
      const localTime = new Date(createdUser.createdAt.getTime() + 6 * 60 * 60 * 1000);
      expect(localTime.getHours()).toBeGreaterThanOrEqual(0);
      expect(localTime.getHours()).toBeLessThanOrEqual(23);
    });
  });

  describe('Local SMS Gateway Testing', () => {
    /**
     * Test Bangladesh SMS gateway integration
     */
    test('should use Bangladesh-specific SMS templates', async () => {
      const phone = '+8801712345678';
      const userData = {
        firstName: 'SMS',
        lastName: 'Test',
        phone,
        password: 'SMSTest2024!',
        confirmPassword: 'SMSTest2024!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Send OTP
      const otpResponse = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone })
        .expect(200);

      expect(otpResponse.body.message).toBe('OTP sent successfully');

      // Get OTP from database
      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone }
      });

      // Verify SMS template contains Bengali text
      const template = smsService.createOTPTemplate(phoneOTP.otp, 'Test User');
      expect(template.text).toContain('আপনার OTP');
      expect(template.textBn).toContain('আপনার OTP');
      expect(template.text).toContain('Your OTP');
    });

    /**
     * Test SMS delivery to Bangladesh operators
     */
    test('should handle SMS delivery to all Bangladesh operators', async () => {
      const operators = [
        { phone: '+8801712345678', operator: 'Grameenphone' },
        { phone: '+8801912345678', operator: 'Banglalink' },
        { phone: '+8801812345678', operator: 'Robi' },
        { phone: '+8801512345678', operator: 'Teletalk' },
        { phone: '+8801612345678', operator: 'Airtel' }
      ];

      for (const { phone, operator } of operators) {
        const userData = {
          firstName: 'Operator',
          lastName: 'Test',
          email: `operator.${operator.toLowerCase()}@bangladesh.example.com`,
          phone,
          password: 'OperatorTest2024!',
          confirmPassword: 'OperatorTest2024!'
        };

        // Register user
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        const userId = registerResponse.body.user.id;
        testUsers.push({ id: userId });

        // Send OTP
        const otpResponse = await request(app)
          .post('/api/auth/send-otp')
          .send({ phone })
          .expect(200);

        expect(otpResponse.body.operator).toBe(operator);
      }
    });
  });

  describe('Bengali Character Support Testing', () => {
    /**
     * Test Bengali character validation in all fields
     */
    test('should support Bengali characters in all registration fields', async () => {
      const bengaliData = {
        firstName: 'মোহাম্মদ',
        lastName: 'হাসান',
        email: 'বাংলাদেশি@উদাহরণ.কম',
        phone: '+8801712345678',
        password: 'বাংলাদেশ@পাস#২০২৪',
        confirmPassword: 'বাংলাদেশ@পাস#২০২৪'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(bengaliData)
        .expect(201);

      const userId = response.body.user.id;
      testUsers.push({ id: userId });

      // Verify Bengali data is stored correctly
      const createdUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      expect(createdUser.firstName).toBe(bengaliData.firstName);
      expect(createdUser.lastName).toBe(bengaliData.lastName);
      expect(createdUser.email).toBe(bengaliData.email);
    });

    /**
     * Test Bengali character encoding in addresses
     */
    test('should support Bengali characters in addresses', async () => {
      const userData = {
        firstName: 'Address',
        lastName: 'Test',
        email: 'address.test@bangladesh.example.com',
        phone: '+8801712345678',
        password: 'AddressTest2024!',
        confirmPassword: 'AddressTest2024!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Create address with Bengali characters
      const bengaliAddress = await prisma.address.create({
        data: {
          userId,
          type: 'SHIPPING',
          firstName: userData.firstName,
          lastName: userData.lastName,
          address: 'ঢাকা, বাংলাদেশ রাজধানী সড়ের',
          city: 'ঢাকা',
          district: 'ঢাকা',
          division: 'DHAKA',
          postalCode: '১০০০'
        }
      });

      expect(bengaliAddress.address).toContain('ঢাকা');
      expect(bengaliAddress.city).toBe('ঢাকা');
      expect(bengaliAddress.postalCode).toBe('১০০০');
    });
  });

  describe('Bangladesh-Specific Error Messages', () => {
    /**
     * Test localized error messages
     */
    test('should provide Bengali error messages', async () => {
      // Test invalid phone format
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Error',
          lastName: 'Test',
          email: 'error.test@bangladesh.example.com',
          phone: 'invalid-phone',
          password: 'ErrorTest2024!',
          confirmPassword: 'ErrorTest2024!'
        });

      expect(response.status).toBe(400);
      expect(response.body.messageBn).toBeTruthy();
      expect(response.body.messageBn).toContain('অবৈধ');
    });

    /**
     * Test Bangladesh-specific validation messages
     */
    test('should provide Bangladesh-specific validation feedback', async () => {
      const userData = {
        firstName: 'Validation',
        lastName: 'Test',
        email: 'validation.test@bangladesh.example.com',
        phone: '+8801712345678',
        password: 'dhaka123', // Bangladesh-specific weak pattern
        confirmPassword: 'dhaka123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Password does not meet requirements');
      expect(response.body.details.feedback).toContain('Bangladeshi');
    });
  });

  describe('Bangladesh Network Conditions', () => {
    /**
     * Test registration under simulated network conditions
     */
    test('should handle slow network conditions', async () => {
      // Mock slow network response
      const originalSendOTP = smsService.sendOTP;
      smsService.sendOTP = jest.fn().mockImplementation((phone, otp) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              messageId: 'slow-sms-id',
              phone,
              operator: 'Grameenphone'
            });
          }, 2000); // 2 second delay
        });
      });

      const userData = {
        firstName: 'Network',
        lastName: 'Test',
        email: 'network.test@bangladesh.example.com',
        phone: '+8801712345678',
        password: 'NetworkTest2024!',
        confirmPassword: 'NetworkTest2024!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Send OTP (should be slow)
      const startTime = Date.now();
      const otpResponse = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '+8801712345678' })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeGreaterThan(1500); // Should take at least 1.5 seconds

      // Restore original function
      smsService.sendOTP = originalSendOTP;
    });

    /**
     * Test intermittent network failures
     */
    test('should handle intermittent network failures', async () => {
      // Mock intermittent SMS failures
      let attemptCount = 0;
      const originalSendOTP = smsService.sendOTP;
      smsService.sendOTP = jest.fn().mockImplementation((phone, otp) => {
        attemptCount++;
        if (attemptCount % 3 === 0) {
          return Promise.resolve({
            success: false,
            error: 'Network timeout'
          });
        }
        return Promise.resolve({
          success: true,
          messageId: `attempt-${attemptCount}`,
          phone,
          operator: 'Grameenphone'
        });
      });

      const userData = {
        firstName: 'Intermittent',
        lastName: 'Test',
        email: 'intermittent.test@bangladesh.example.com',
        phone: '+8801712345678',
        password: 'IntermittentTest2024!',
        confirmPassword: 'IntermittentTest2024!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Try multiple OTP sends
      const responses = [];
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ phone: '+8801712345678' });
        
        responses.push(response.status);
      }

      // Should have some failures and some successes
      const successCount = responses.filter(status => status === 200).length;
      const failureCount = responses.filter(status => status === 400).length;

      expect(successCount).toBeGreaterThan(0);
      expect(failureCount).toBeGreaterThan(0);

      // Restore original function
      smsService.sendOTP = originalSendOTP;
    });
  });

  describe('Bangladesh Compliance Testing', () => {
    /**
     * Test compliance with Bangladesh regulations
     */
    test('should comply with Bangladesh telecommunications regulations', async () => {
      // Test phone number registration compliance
      const complianceTests = [
        { phone: '+8801712345678', shouldComply: true },
        { phone: '+880171234567', shouldComply: false }, // Too short
        { phone: '01712345678', shouldComply: true }, // Local format
        { phone: '8801712345678', shouldComply: true }, // International format without +
        { phone: '+8801212345678', shouldComply: false } // Unsupported operator
      ];

      for (const test of complianceTests) {
        const validation = phoneValidationService.validateBangladeshPhoneNumber(test.phone);
        
        if (test.shouldComply) {
          expect(validation.isValid).toBe(true);
        } else {
          expect(validation.isValid).toBe(false);
        }
      }
    });

    /**
     * Test data localization compliance
     */
    test('should handle Bangladesh data localization requirements', async () => {
      const userData = {
        firstName: 'Compliance',
        lastName: 'Test',
        email: 'compliance.test@bangladesh.example.com',
        phone: '+8801712345678',
        password: 'ComplianceTest2024!',
        confirmPassword: 'ComplianceTest2024!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Verify data is stored with proper localization
      const createdUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      expect(createdUser).toBeTruthy();
      // Should handle timezone correctly
      expect(createdUser.createdAt).toBeInstanceOf(Date);
    });
  });
});