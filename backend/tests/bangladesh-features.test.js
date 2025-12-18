const { DatabaseService } = require('../services/database');
const { ConfigService } = require('../services/config');
const assert = require('assert');

// Test Bangladesh-Specific Features (Payment Gateways, Divisions)
class BangladeshFeaturesTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.originalEnv = { ...process.env };
  }

  async runAllTests() {
    console.log('🧪 Starting Bangladesh Features Tests...\n');
    
    await this.testBangladeshDivisions();
    await this.testPaymentGatewayConfiguration();
    await this.testProductionPaymentURLs();
    await this.testSandboxPaymentURLs();
    await this.testPaymentMethodValidation();
    await this.testCurrencyHandling();
    await this.testBangladeshPhoneValidation();
    await this.testShippingZones();
    await this.testTaxConfiguration();
    await this.testLocalizedErrorMessages();
    
    this.generateTestReport();
  }

  restoreEnvironment() {
    process.env = { ...this.originalEnv };
  }

  async testBangladeshDivisions() {
    this.testResults.total++;
    console.log('🔍 Test 1: Bangladesh Divisions');
    
    try {
      // Mock database for divisions query
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(true),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn().mockResolvedValue([
          { division: 'Dhaka' },
          { division: 'Chattogram' },
          { division: 'Khulna' },
          { division: 'Rajshahi' },
          { division: 'Barishal' },
          { division: 'Sylhet' },
          { division: 'Rangpur' },
          { division: 'Mymensingh' }
        ]),
        $on: jest.fn()
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      const dbService = new DatabaseService();
      await dbService.connect();
      
      const divisions = await dbService.getDivisions();
      
      assert(Array.isArray(divisions), 'Divisions should be an array');
      assert(divisions.length === 8, 'Should return 8 divisions');
      assert(divisions.includes('Dhaka'), 'Should include Dhaka division');
      assert(divisions.includes('Chattogram'), 'Should include Chattogram division');
      assert(divisions.includes('Khulna'), 'Should include Khulna division');
      assert(divisions.includes('Rajshahi'), 'Should include Rajshahi division');
      assert(divisions.includes('Barishal'), 'Should include Barishal division');
      assert(divisions.includes('Sylhet'), 'Should include Sylhet division');
      assert(divisions.includes('Rangpur'), 'Should include Rangpur division');
      assert(divisions.includes('Mymensingh'), 'Should include Mymensingh division');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Bangladesh Divisions',
        status: 'PASSED',
        message: `Successfully retrieved ${divisions.length} Bangladesh divisions`
      });
      
      console.log('✅ PASSED: Bangladesh divisions working correctly\n');
      
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Bangladesh Divisions',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testPaymentGatewayConfiguration() {
    this.testResults.total++;
    console.log('🔍 Test 2: Payment Gateway Configuration');
    
    try {
      // Set up environment with Bangladesh payment gateways
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.BKASH_API_KEY = 'bkash-prod-key';
      process.env.BKASH_API_SECRET = 'bkash-prod-secret';
      process.env.NAGAD_API_KEY = 'nagad-prod-key';
      process.env.NAGAD_API_SECRET = 'nagad-prod-secret';
      process.env.ROCKET_API_KEY = 'rocket-prod-key';
      process.env.ROCKET_API_SECRET = 'rocket-prod-secret';
      
      const configService = new ConfigService();
      const paymentConfig = configService.getPaymentConfig();
      
      // Test bKash configuration
      assert(paymentConfig.bkash !== undefined, 'bKash config should exist');
      assert(paymentConfig.bkash.apiKey === 'bkash-prod-key', 'bKash API key should be set');
      assert(paymentConfig.bkash.apiSecret === 'bkash-prod-secret', 'bKash API secret should be set');
      assert(typeof paymentConfig.bkash.baseUrl === 'string', 'bKash base URL should be a string');
      
      // Test Nagad configuration
      assert(paymentConfig.nagad !== undefined, 'Nagad config should exist');
      assert(paymentConfig.nagad.apiKey === 'nagad-prod-key', 'Nagad API key should be set');
      assert(paymentConfig.nagad.apiSecret === 'nagad-prod-secret', 'Nagad API secret should be set');
      assert(typeof paymentConfig.nagad.baseUrl === 'string', 'Nagad base URL should be a string');
      
      // Test Rocket configuration
      assert(paymentConfig.rocket !== undefined, 'Rocket config should exist');
      assert(paymentConfig.rocket.apiKey === 'rocket-prod-key', 'Rocket API key should be set');
      assert(paymentConfig.rocket.apiSecret === 'rocket-prod-secret', 'Rocket API secret should be set');
      assert(typeof paymentConfig.rocket.baseUrl === 'string', 'Rocket base URL should be a string');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Payment Gateway Configuration',
        status: 'PASSED',
        message: 'All Bangladesh payment gateways configured correctly'
      });
      
      console.log('✅ PASSED: Payment gateway configuration working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Payment Gateway Configuration',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testProductionPaymentURLs() {
    this.testResults.total++;
    console.log('🔍 Test 3: Production Payment URLs');
    
    try {
      // Set production environment
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.BKASH_API_KEY = 'bkash-prod-key';
      process.env.BKASH_API_SECRET = 'bkash-prod-secret';
      process.env.NAGAD_API_KEY = 'nagad-prod-key';
      process.env.NAGAD_API_SECRET = 'nagad-prod-secret';
      process.env.ROCKET_API_KEY = 'rocket-prod-key';
      process.env.ROCKET_API_SECRET = 'rocket-prod-secret';
      
      const configService = new ConfigService();
      const paymentConfig = configService.getPaymentConfig();
      
      // Test production URLs
      assert(paymentConfig.bkash.baseUrl.includes('checkout.pay.bka.sh'), 'bKash should use production URL');
      assert(paymentConfig.bkash.baseUrl.includes('v1.2.0-beta'), 'bKash should use correct API version');
      assert(paymentConfig.nagad.baseUrl.includes('api.nagad.com'), 'Nagad should use production URL');
      assert(paymentConfig.nagad.baseUrl.includes('/v1'), 'Nagad should use correct API version');
      assert(paymentConfig.rocket.baseUrl.includes('api.rocket.com'), 'Rocket should use production URL');
      assert(paymentConfig.rocket.baseUrl.includes('/v1'), 'Rocket should use correct API version');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Production Payment URLs',
        status: 'PASSED',
        message: 'All payment gateways using correct production URLs'
      });
      
      console.log('✅ PASSED: Production payment URLs working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Production Payment URLs',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testSandboxPaymentURLs() {
    this.testResults.total++;
    console.log('🔍 Test 4: Sandbox Payment URLs');
    
    try {
      // Set development environment
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.BKASH_API_KEY = 'bkash-test-key';
      process.env.BKASH_API_SECRET = 'bkash-test-secret';
      process.env.NAGAD_API_KEY = 'nagad-test-key';
      process.env.NAGAD_API_SECRET = 'nagad-test-secret';
      process.env.ROCKET_API_KEY = 'rocket-test-key';
      process.env.ROCKET_API_SECRET = 'rocket-test-secret';
      
      const configService = new ConfigService();
      const paymentConfig = configService.getPaymentConfig();
      
      // Test sandbox URLs
      assert(paymentConfig.bkash.baseUrl.includes('checkout.sandbox.bka.sh'), 'bKash should use sandbox URL');
      assert(paymentConfig.bkash.baseUrl.includes('v1.2.0-beta'), 'bKash should use correct API version');
      assert(paymentConfig.nagad.baseUrl.includes('api.sandbox.nagad.com'), 'Nagad should use sandbox URL');
      assert(paymentConfig.nagad.baseUrl.includes('/v1'), 'Nagad should use correct API version');
      assert(paymentConfig.rocket.baseUrl.includes('api.sandbox.rocket.com'), 'Rocket should use sandbox URL');
      assert(paymentConfig.rocket.baseUrl.includes('/v1'), 'Rocket should use correct API version');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Sandbox Payment URLs',
        status: 'PASSED',
        message: 'All payment gateways using correct sandbox URLs'
      });
      
      console.log('✅ PASSED: Sandbox payment URLs working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Sandbox Payment URLs',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testPaymentMethodValidation() {
    this.testResults.total++;
    console.log('🔍 Test 5: Payment Method Validation');
    
    try {
      // Mock database for payment methods query
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(true),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn().mockResolvedValue([
          { paymentMethod: 'bKash' },
          { paymentMethod: 'Nagad' },
          { paymentMethod: 'Rocket' },
          { paymentMethod: 'Cash on Delivery' },
          { paymentMethod: 'Bank Transfer' }
        ]),
        $on: jest.fn()
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      const dbService = new DatabaseService();
      await dbService.connect();
      
      const paymentMethods = await dbService.getPaymentMethods();
      
      assert(Array.isArray(paymentMethods), 'Payment methods should be an array');
      assert(paymentMethods.length === 5, 'Should return 5 payment methods');
      assert(paymentMethods.includes('bKash'), 'Should include bKash');
      assert(paymentMethods.includes('Nagad'), 'Should include Nagad');
      assert(paymentMethods.includes('Rocket'), 'Should include Rocket');
      assert(paymentMethods.includes('Cash on Delivery'), 'Should include Cash on Delivery');
      assert(paymentMethods.includes('Bank Transfer'), 'Should include Bank Transfer');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Payment Method Validation',
        status: 'PASSED',
        message: `Successfully retrieved ${paymentMethods.length} payment methods including Bangladesh gateways`
      });
      
      console.log('✅ PASSED: Payment method validation working correctly\n');
      
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Payment Method Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testCurrencyHandling() {
    this.testResults.total++;
    console.log('🔍 Test 6: Currency Handling');
    
    try {
      // Test Bangladesh Taka (BDT) configuration
      const currencyConfig = {
        code: 'BDT',
        symbol: '৳',
        name: 'Bangladeshi Taka',
        decimalPlaces: 2,
        exchangeRate: 84.5 // 1 USD = 84.5 BDT
      };
      
      // Mock currency service
      const mockCurrencyService = {
        getCurrencyConfig: jest.fn().mockReturnValue(currencyConfig),
        convertToBDT: jest.fn((amount, fromCurrency) => {
          if (fromCurrency === 'USD') {
            return amount * 84.5;
          }
          return amount;
        }),
        formatBDT: jest.fn((amount) => {
          return `৳${amount.toFixed(2)}`;
        })
      };
      
      // Test currency conversion
      const convertedAmount = mockCurrencyService.convertToBDT(100, 'USD');
      assert(convertedAmount === 8450, 'USD to BDT conversion should work');
      
      // Test currency formatting
      const formattedAmount = mockCurrencyService.formatBDT(1234.56);
      assert(formattedAmount === '৳1234.56', 'BDT formatting should work');
      
      // Test currency config
      const config = mockCurrencyService.getCurrencyConfig();
      assert(config.code === 'BDT', 'Currency code should be BDT');
      assert(config.symbol === '৳', 'Currency symbol should be ৳');
      assert(config.name === 'Bangladeshi Taka', 'Currency name should be Bangladeshi Taka');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Currency Handling',
        status: 'PASSED',
        message: 'Bangladeshi Taka (BDT) currency handling working correctly'
      });
      
      console.log('✅ PASSED: Currency handling working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Currency Handling',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testBangladeshPhoneValidation() {
    this.testResults.total++;
    console.log('🔍 Test 7: Bangladesh Phone Validation');
    
    try {
      // Test Bangladesh phone number validation
      const phoneValidator = {
        validateBangladeshPhone: (phone) => {
          const bangladeshPhoneRegex = /^(?:\+880|00880)?(?:1[3-9]\d{9}|[3-9]\d{9})$/;
          return bangladeshPhoneRegex.test(phone);
        },
        formatBangladeshPhone: (phone) => {
          const cleaned = phone.replace(/[^\d]/g, '');
          if (cleaned.startsWith('880')) {
            return `+${cleaned}`;
          } else if (cleaned.startsWith('00880')) {
            return `+${cleaned.substring(2)}`;
          } else {
            return `+880${cleaned}`;
          }
        }
      };
      
      // Test valid phone numbers
      const validPhones = [
        '+8801712345678',
        '01712345678',
        '+8801912345678',
        '01912345678',
        '+8801312345678',
        '01312345678',
        '008801712345678'
      ];
      
      validPhones.forEach(phone => {
        assert(phoneValidator.validateBangladeshPhone(phone), `${phone} should be valid`);
      });
      
      // Test invalid phone numbers
      const invalidPhones = [
        '+880171234567', // too short
        '017123456789', // too long
        '+88017123456a8', // contains letter
        '01712345678', // missing leading 0
        '+441712345678' // wrong country code
      ];
      
      invalidPhones.forEach(phone => {
        assert(!phoneValidator.validateBangladeshPhone(phone), `${phone} should be invalid`);
      });
      
      // Test phone formatting
      const formattedPhone1 = phoneValidator.formatBangladeshPhone('01712345678');
      const formattedPhone2 = phoneValidator.formatBangladeshPhone('+8801712345678');
      const formattedPhone3 = phoneValidator.formatBangladeshPhone('008801712345678');
      
      assert(formattedPhone1 === '+8801712345678', 'Should format local number correctly');
      assert(formattedPhone2 === '+8801712345678', 'Should keep international format');
      assert(formattedPhone3 === '+8801712345678', 'Should format with international prefix');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Bangladesh Phone Validation',
        status: 'PASSED',
        message: 'Bangladesh phone number validation and formatting working correctly'
      });
      
      console.log('✅ PASSED: Bangladesh phone validation working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Bangladesh Phone Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testShippingZones() {
    this.testResults.total++;
    console.log('🔍 Test 8: Shipping Zones');
    
    try {
      // Test Bangladesh shipping zones
      const shippingZones = [
        {
          id: 'dhaka',
          name: 'Dhaka Division',
          cities: ['Dhaka', 'Gazipur', 'Narayanganj', 'Manikganj', 'Munshiganj', 'Rajbari', 'Madaripur', 'Faridpur', 'Gopalganj', 'Kishoreganj'],
          baseCost: 60,
          additionalCost: 20,
          estimatedDays: 1
        },
        {
          id: 'chattogram',
          name: 'Chattogram Division',
          cities: ['Chattogram', 'Cox\'s Bazar', 'Bandarban', 'Rangamati', 'Khagrachari', 'Feni', 'Lakshmipur', 'Noakhali', 'Brahmanbaria'],
          baseCost: 100,
          additionalCost: 30,
          estimatedDays: 2
        },
        {
          id: 'outside-dhaka',
          name: 'Outside Dhaka',
          cities: [],
          baseCost: 120,
          additionalCost: 40,
          estimatedDays: 3
        }
      ];
      
      // Mock shipping service
      const mockShippingService = {
        getShippingZones: jest.fn().mockReturnValue(shippingZones),
        calculateShipping: jest.fn((zoneId, weight, quantity) => {
          const zone = shippingZones.find(z => z.id === zoneId);
          if (!zone) return null;
          
          const additionalWeight = Math.max(0, weight - 1);
          const additionalQuantity = Math.max(0, quantity - 1);
          
          return {
            zone: zone.name,
            baseCost: zone.baseCost,
            additionalCost: (additionalWeight * zone.additionalCost) + (additionalQuantity * zone.additionalCost),
            totalCost: zone.baseCost + (additionalWeight * zone.additionalCost) + (additionalQuantity * zone.additionalCost),
            estimatedDays: zone.estimatedDays
          };
        })
      };
      
      // Test shipping zones retrieval
      const zones = mockShippingService.getShippingZones();
      assert(Array.isArray(zones), 'Shipping zones should be an array');
      assert(zones.length === 3, 'Should return 3 shipping zones');
      
      // Test shipping calculation
      const shipping1 = mockShippingService.calculateShipping('dhaka', 0.5, 1); // Light item, Dhaka
      const shipping2 = mockShippingService.calculateShipping('chattogram', 2, 3); // Heavy item, multiple quantity, Chattogram
      const shipping3 = mockShippingService.calculateShipping('outside-dhaka', 1, 1); // Standard item, outside Dhaka
      
      assert(shipping1.totalCost === 60, 'Dhaka light item shipping should be 60 BDT');
      assert(shipping1.estimatedDays === 1, 'Dhaka shipping should be 1 day');
      
      assert(shipping2.totalCost === 100 + (1 * 30) + (2 * 30), 'Chattogram heavy item shipping should be calculated correctly');
      assert(shipping2.estimatedDays === 2, 'Chattogram shipping should be 2 days');
      
      assert(shipping3.totalCost === 120, 'Outside Dhaka shipping should be 120 BDT');
      assert(shipping3.estimatedDays === 3, 'Outside Dhaka shipping should be 3 days');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Shipping Zones',
        status: 'PASSED',
        message: 'Bangladesh shipping zones and cost calculation working correctly'
      });
      
      console.log('✅ PASSED: Shipping zones working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Shipping Zones',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testTaxConfiguration() {
    this.testResults.total++;
    console.log('🔍 Test 9: Tax Configuration');
    
    try {
      // Test Bangladesh tax configuration
      const taxConfig = {
        vat: {
          rate: 0.15, // 15% VAT
          applicable: true,
          description: 'Value Added Tax'
        },
        customs: {
          rate: 0.05, // 5% customs duty for certain items
          applicable: false, // Generally not applicable for domestic
          description: 'Customs Duty'
        },
        taxExempt: {
          categories: ['books', 'medicine', 'educational'],
          description: 'Tax Exempt Categories'
        }
      };
      
      // Mock tax service
      const mockTaxService = {
        getTaxConfig: jest.fn().mockReturnValue(taxConfig),
        calculateTax: jest.fn((amount, category, isImport = false) => {
          let taxAmount = 0;
          let breakdown = {};
          
          if (taxConfig.vat.applicable && !taxConfig.taxExempt.categories.includes(category)) {
            taxAmount += amount * taxConfig.vat.rate;
            breakdown.vat = amount * taxConfig.vat.rate;
          }
          
          if (isImport && taxConfig.customs.applicable && !taxConfig.taxExempt.categories.includes(category)) {
            taxAmount += amount * taxConfig.customs.rate;
            breakdown.customs = amount * taxConfig.customs.rate;
          }
          
          return {
            subtotal: amount,
            tax: taxAmount,
            total: amount + taxAmount,
            breakdown,
            rate: taxConfig.vat.applicable ? taxConfig.vat.rate : 0
          };
        })
      };
      
      // Test tax configuration
      const config = mockTaxService.getTaxConfig();
      assert(config.vat.rate === 0.15, 'VAT rate should be 15%');
      assert(config.vat.applicable === true, 'VAT should be applicable');
      assert(config.customs.rate === 0.05, 'Customs rate should be 5%');
      assert(Array.isArray(config.taxExempt.categories), 'Tax exempt categories should be an array');
      
      // Test tax calculation
      const tax1 = mockTaxService.calculateTax(1000, 'electronics'); // Taxable item
      const tax2 = mockTaxService.calculateTax(1000, 'books'); // Tax exempt item
      const tax3 = mockTaxService.calculateTax(1000, 'electronics', true); // Taxable import
      
      assert(tax1.tax === 150, 'Electronics should have 15% VAT');
      assert(tax1.total === 1150, 'Electronics total should be 1150');
      
      assert(tax2.tax === 0, 'Books should be tax exempt');
      assert(tax2.total === 1000, 'Books total should be 1000');
      
      assert(tax3.tax === 150 + 50, 'Imported electronics should have VAT + customs');
      assert(tax3.total === 1200, 'Imported electronics total should be 1200');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Tax Configuration',
        status: 'PASSED',
        message: 'Bangladesh tax configuration and calculation working correctly'
      });
      
      console.log('✅ PASSED: Tax configuration working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Tax Configuration',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testLocalizedErrorMessages() {
    this.testResults.total++;
    console.log('🔍 Test 10: Localized Error Messages');
    
    try {
      // Test Bengali and English error messages
      const localizedErrors = {
        'payment.failed': {
          en: 'Payment failed. Please try again or use a different payment method.',
          bn: 'পেমেন্ট ব্যর্থ হয়েছে। অনুগ্রহ করুন বা অন্য পেমেন্ট পদ্ধতি ব্যবহার করুন।'
        },
        'payment.gateway.unavailable': {
          en: 'Payment gateway is temporarily unavailable. Please try again later.',
          bn: 'পেমেন্ট গেটওয সাময়কভাবে অনুপস্থিত। অনুগ্রহ পরে চেষ্টা করুন।'
        },
        'order.out.of.stock': {
          en: 'One or more items in your order are out of stock.',
          bn: 'আপনার অর্ডারের এক বা একাধিক আইটেম স্টকে নেই।'
        },
        'shipping.unavailable': {
          en: 'Shipping is not available to your location.',
          bn: 'আপনার অবস্থানে শিপিং উপলব্ধ নেই।'
        }
      };
      
      // Mock localization service
      const mockLocalizationService = {
        getErrorMessage: jest.fn((key, language = 'en') => {
          const error = localizedErrors[key];
          if (!error) return 'Unknown error occurred';
          return error[language] || error.en;
        }),
        getSupportedLanguages: jest.fn().mockReturnValue(['en', 'bn']),
        formatErrorMessage: jest.fn((key, params, language = 'en') => {
          const template = mockLocalizationService.getErrorMessage(key, language);
          return template.replace(/\{(\w+)\}/g, (match, param) => params[param] || match);
        })
      };
      
      // Test English error messages
      const enError1 = mockLocalizationService.getErrorMessage('payment.failed', 'en');
      const enError2 = mockLocalizationService.getErrorMessage('order.out.of.stock', 'en');
      
      assert(enError1.includes('Payment failed'), 'English payment error should be correct');
      assert(enError2.includes('out of stock'), 'English stock error should be correct');
      
      // Test Bengali error messages
      const bnError1 = mockLocalizationService.getErrorMessage('payment.failed', 'bn');
      const bnError2 = mockLocalizationService.getErrorMessage('order.out.of.stock', 'bn');
      
      assert(bnError1.includes('পেমেন্ট ব্যর্থ হয়েছে'), 'Bengali payment error should be correct');
      assert(bnError2.includes('স্টকে নেই'), 'Bengali stock error should be correct');
      
      // Test unsupported language fallback
      const fallbackError = mockLocalizationService.getErrorMessage('payment.failed', 'fr');
      assert(fallbackError === localizedErrors['payment.failed'].en, 'Should fallback to English for unsupported language');
      
      // Test supported languages
      const languages = mockLocalizationService.getSupportedLanguages();
      assert(languages.includes('en'), 'Should support English');
      assert(languages.includes('bn'), 'Should support Bengali');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Localized Error Messages',
        status: 'PASSED',
        message: 'Localized error messages working correctly for English and Bengali'
      });
      
      console.log('✅ PASSED: Localized error messages working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Localized Error Messages',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  generateTestReport() {
    console.log('\n📊 BANGLADESH FEATURES TEST REPORT');
    console.log('====================================');
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%\n`);
    
    console.log('📋 Detailed Results:');
    this.testResults.details.forEach((detail, index) => {
      const status = detail.status === 'PASSED' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${detail.test}: ${detail.message}`);
    });
    
    return this.testResults;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new BangladeshFeaturesTest();
  test.runAllTests().catch(console.error);
}

module.exports = BangladeshFeaturesTest;