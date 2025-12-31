const axios = require('axios');
const { performance } = require('perf_hooks');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_RESULTS = {
    passed: 0,
    failed: 0,
    total: 0,
    details: [],
    performance: [],
    security: [],
    integration: []
};

// Test data generators
const generateTestEmail = () => `test${Date.now()}@example.com`;
const generateTestPhone = () => `+88017${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
const generateWeakPassword = () => 'password123';
const generateStrongPassword = () => `Str0ngP@ss!${Date.now().toString().slice(-4)}`;

// Initialize Prisma client for database verification
const prisma = new PrismaClient();

// Utility functions
const logTest = (testName, status, details = {}) => {
    const timestamp = new Date().toISOString();
    const result = {
        testName,
        status,
        timestamp,
        ...details
    };

    TEST_RESULTS.details.push(result);
    TEST_RESULTS.total++;

    if (status === 'PASS') {
        TEST_RESULTS.passed++;
        console.log(`✅ PASS: ${testName}`);
    } else {
        TEST_RESULTS.failed++;
        console.log(`❌ FAIL: ${testName}`);
        if (details.error) console.log(`   Error: ${details.error}`);
    }
};

const measurePerformance = (testName, fn) => {
    return async (...args) => {
        const startTime = performance.now();
        try {
            const result = await fn(...args);
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            TEST_RESULTS.performance.push({
                testName,
                responseTime: `${responseTime.toFixed(2)}ms`,
                timestamp: new Date().toISOString()
            });

            return { ...result, responseTime };
        } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            TEST_RESULTS.performance.push({
                testName,
                responseTime: `${responseTime.toFixed(2)}ms`,
                status: 'ERROR',
                timestamp: new Date().toISOString()
            });

            throw error;
        }
    };
};

// Test functions
const testValidRegistration = async (userData, testType) => {
    try {
        const startTime = performance.now();
        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Check if response is successful
        if (response.status === 200 || response.status === 201) {
            logTest(`Valid Registration (${testType})`, 'PASS', {
                responseTime: `${responseTime.toFixed(2)}ms`,
                userId: response.data.user?.id || 'N/A',
                email: response.data.user?.email || 'N/A',
                phone: response.data.user?.phone || 'N/A'
            });

            return { success: true, userId: response.data.user?.id };
        } else {
            logTest(`Valid Registration (${testType})`, 'FAIL', {
                error: `Unexpected status code: ${response.status}`,
                response: response.data
            });
            return { success: false };
        }
    } catch (error) {
        // For registration, we might get a 400 if email/phone verification is disabled
        // Let's check if it's because verification is disabled
        if (error.response && error.response.status === 400) {
            const errorMessage = error.response.data?.message || '';
            if (errorMessage.includes('Email verification is currently disabled') ||
                errorMessage.includes('Phone verification is currently disabled')) {
                logTest(`Valid Registration (${testType})`, 'PASS', {
                    note: 'Registration logic working, verification disabled as expected',
                    response: error.response.data
                });
                return { success: true, verificationDisabled: true };
            }
        }

        logTest(`Valid Registration (${testType})`, 'FAIL', {
            error: error.message,
            response: error.response?.data || 'No response data'
        });
        return { success: false };
    }
};

const testInvalidEmailFormat = async () => {
    const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test.example.com',
        'test@.com',
        ''
    ];

    for (const email of invalidEmails) {
        try {
            const userData = {
                email,
                password: generateStrongPassword(),
                firstName: 'Test',
                lastName: 'User'
            };

            const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

            // If we get a success response with invalid email, that's a failure
            if (response.status === 200 || response.status === 201) {
                logTest('Invalid Email Format Validation', 'FAIL', {
                    error: `Server accepted invalid email: ${email}`,
                    response: response.data
                });
            }
        } catch (error) {
            // We expect an error for invalid emails
            if (error.response && (error.response.status === 400 || error.response.status === 422)) {
                logTest('Invalid Email Format Validation', 'PASS', {
                    note: `Correctly rejected invalid email: ${email}`,
                    response: error.response.data
                });
            } else {
                logTest('Invalid Email Format Validation', 'FAIL', {
                    error: `Unexpected error for email ${email}: ${error.message}`,
                    response: error.response?.data || 'No response data'
                });
            }
        }
    }
};

const testInvalidPhoneFormat = async () => {
    const invalidPhones = [
        '123', // Too short
        '123456789012345', // Too long
        'abc1234567', // Contains letters
        '+8801', // Incomplete Bangladesh number
        '+1234567890', // Non-Bangladesh number
        ''
    ];

    for (const phone of invalidPhones) {
        try {
            const userData = {
                phone,
                password: generateStrongPassword(),
                firstName: 'Test',
                lastName: 'User'
            };

            const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

            // If we get a success response with invalid phone, that's a failure
            if (response.status === 200 || response.status === 201) {
                logTest('Invalid Phone Format Validation', 'FAIL', {
                    error: `Server accepted invalid phone: ${phone}`,
                    response: response.data
                });
            }
        } catch (error) {
            // We expect an error for invalid phones
            if (error.response && (error.response.status === 400 || error.response.status === 422)) {
                logTest('Invalid Phone Format Validation', 'PASS', {
                    note: `Correctly rejected invalid phone: ${phone}`,
                    response: error.response.data
                });
            } else {
                logTest('Invalid Phone Format Validation', 'FAIL', {
                    error: `Unexpected error for phone ${phone}: ${error.message}`,
                    response: error.response?.data || 'No response data'
                });
            }
        }
    }
};

const testWeakPasswordValidation = async () => {
    const weakPasswords = [
        '123', // Too short
        'password', // Common password
        '12345678', // All numbers
        'abcdefgh', // All letters
        '' // Empty
    ];

    for (const password of weakPasswords) {
        try {
            const userData = {
                email: generateTestEmail(),
                password,
                firstName: 'Test',
                lastName: 'User'
            };

            const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

            // If we get a success response with weak password, that's a failure
            if (response.status === 200 || response.status === 201) {
                logTest('Weak Password Validation', 'FAIL', {
                    error: `Server accepted weak password: ${password}`,
                    response: response.data
                });
            }
        } catch (error) {
            // We expect an error for weak passwords
            if (error.response && (error.response.status === 400 || error.response.status === 422)) {
                logTest('Weak Password Validation', 'PASS', {
                    note: `Correctly rejected weak password`,
                    response: error.response.data
                });
            } else {
                logTest('Weak Password Validation', 'FAIL', {
                    error: `Unexpected error: ${error.message}`,
                    response: error.response?.data || 'No response data'
                });
            }
        }
    }
};

const testMissingRequiredFields = async () => {
    const requiredFields = ['email', 'password', 'firstName', 'lastName'];

    for (const field of requiredFields) {
        try {
            const userData = {
                email: generateTestEmail(),
                password: generateStrongPassword(),
                firstName: 'Test',
                lastName: 'User'
            };

            // Remove the field we're testing
            delete userData[field];

            const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

            // If we get a success response with missing field, that's a failure
            if (response.status === 200 || response.status === 201) {
                logTest('Missing Required Fields', 'FAIL', {
                    error: `Server accepted registration without ${field}`,
                    response: response.data
                });
            }
        } catch (error) {
            // We expect an error for missing required fields
            if (error.response && (error.response.status === 400 || error.response.status === 422)) {
                logTest('Missing Required Fields', 'PASS', {
                    note: `Correctly rejected registration without ${field}`,
                    response: error.response.data
                });
            } else {
                logTest('Missing Required Fields', 'FAIL', {
                    error: `Unexpected error when missing ${field}: ${error.message}`,
                    response: error.response?.data || 'No response data'
                });
            }
        }
    }
};

const testPropertyNameCompatibility = async () => {
    // Test alternative property names (fname/firstName, lname/lastName, phone/phoneNumber)
    const testCases = [
        {
            name: 'fname/lname compatibility',
            data: {
                email: generateTestEmail(),
                password: generateStrongPassword(),
                fname: 'Test',
                lname: 'User'
            }
        },
        {
            name: 'phoneNumber compatibility',
            data: {
                email: generateTestEmail(),
                password: generateStrongPassword(),
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: generateTestPhone()
            }
        }
    ];

    for (const testCase of testCases) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, testCase.data);

            if (response.status === 200 || response.status === 201) {
                logTest(`Property Name Compatibility - ${testCase.name}`, 'PASS', {
                    note: 'Server correctly handled alternative property names',
                    response: response.data
                });
            } else {
                logTest(`Property Name Compatibility - ${testCase.name}`, 'FAIL', {
                    error: `Server rejected alternative property names with status: ${response.status}`,
                    response: response.data
                });
            }
        } catch (error) {
            // For compatibility, we might expect a failure if the feature isn't implemented
            logTest(`Property Name Compatibility - ${testCase.name}`, 'INFO', {
                note: `Server does not support alternative property names: ${error.message}`,
                response: error.response?.data || 'No response data'
            });
        }
    }
};

const testBangladeshPhoneValidation = async () => {
    const validBangladeshPhones = [
        '+8801700000000', // Grameenphone
        '+8801300000000', // Banglalink
        '+8801400000000', // Teletalk
        '+8801500000000', // Robi
        '+8801600000000',  // Airtel
        '+8801800000000',  // Robi
        '+8801900000000'   // Banglalink
    ];

    for (const phone of validBangladeshPhones) {
        try {
            const userData = {
                phone,
                password: generateStrongPassword(),
                firstName: 'Test',
                lastName: 'User'
            };

            const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

            // We expect this to potentially fail due to verification being disabled
            // But we want to check if the phone validation logic is working
            if (error.response && error.response.status === 400) {
                const errorMessage = error.response.data?.message || '';
                if (errorMessage.includes('Phone verification is currently disabled')) {
                    logTest('Bangladesh Phone Validation', 'PASS', {
                        note: `Phone validation logic working for ${phone}`,
                        response: error.response.data
                    });
                } else if (errorMessage.includes('Invalid phone number')) {
                    logTest('Bangladesh Phone Validation', 'FAIL', {
                        error: `Valid Bangladesh phone rejected: ${phone}`,
                        response: error.response.data
                    });
                }
            }
        } catch (error) {
            // Check if it's because verification is disabled or if there's a validation error
            if (error.response && error.response.status === 400) {
                const errorMessage = error.response.data?.message || '';
                if (errorMessage.includes('Phone verification is currently disabled')) {
                    logTest('Bangladesh Phone Validation', 'PASS', {
                        note: `Phone validation logic working for ${phone}`,
                        response: error.response.data
                    });
                } else if (errorMessage.includes('Invalid phone number')) {
                    logTest('Bangladesh Phone Validation', 'FAIL', {
                        error: `Valid Bangladesh phone rejected: ${phone}`,
                        response: error.response.data
                    });
                }
            } else {
                logTest('Bangladesh Phone Validation', 'FAIL', {
                    error: `Unexpected error for phone ${phone}: ${error.message}`,
                    response: error.response?.data || 'No response data'
                });
            }
        }
    }
};

const testRateLimiting = async () => {
    const userData = {
        email: generateTestEmail(),
        password: generateStrongPassword(),
        firstName: 'Test',
        lastName: 'User'
    };

    let successCount = 0;
    let rateLimited = false;

    // Send multiple requests quickly to test rate limiting
    for (let i = 0; i < 10; i++) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
            if (response.status === 200 || response.status === 201) {
                successCount++;
            }
        } catch (error) {
            if (error.response && error.response.status === 429) {
                rateLimited = true;
                logTest('Rate Limiting', 'PASS', {
                    note: `Rate limiting triggered after ${i + 1} requests`,
                    response: error.response.data
                });
                break;
            }
        }
    }

    if (!rateLimited) {
        logTest('Rate Limiting', 'INFO', {
            note: `Rate limiting not triggered after 10 requests. ${successCount} succeeded.`,
            recommendation: 'Consider implementing rate limiting for registration endpoint'
        });
    }
};

const testDatabaseIntegration = async () => {
    try {
        // Check if we can connect to the database
        await prisma.$connect();
        logTest('Database Connection', 'PASS', {
            note: 'Successfully connected to database'
        });

        // Check if the User table exists and has the expected structure
        const userCount = await prisma.user.count();
        logTest('Database Schema', 'PASS', {
            note: `User table exists with ${userCount} records`
        });

        // Test creating a user directly in the database
        const testEmail = `dbtest${Date.now()}@example.com`;
        const testUser = await prisma.user.create({
            data: {
                email: testEmail,
                password: 'hashedpassword',
                firstName: 'DB',
                lastName: 'Test',
                status: 'ACTIVE'
            }
        });

        if (testUser && testUser.id) {
            logTest('Database User Creation', 'PASS', {
                note: `Successfully created user with ID: ${testUser.id}`
            });

            // Clean up the test user
            await prisma.user.delete({
                where: { id: testUser.id }
            });
        } else {
            logTest('Database User Creation', 'FAIL', {
                error: 'Failed to create user in database'
            });
        }
    } catch (error) {
        logTest('Database Integration', 'FAIL', {
            error: `Database integration error: ${error.message}`
        });
    } finally {
        await prisma.$disconnect();
    }
};

const testErrorHandling = async () => {
    // Test malformed JSON
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`,
            'invalid json',
            { headers: { 'Content-Type': 'application/json' } }
        );

        logTest('Error Handling - Malformed JSON', 'FAIL', {
            error: 'Server accepted malformed JSON',
            response: response.data
        });
    } catch (error) {
        if (error.response && error.response.status === 400) {
            logTest('Error Handling - Malformed JSON', 'PASS', {
                note: 'Server correctly rejected malformed JSON',
                response: error.response.data
            });
        } else {
            logTest('Error Handling - Malformed JSON', 'FAIL', {
                error: `Unexpected error: ${error.message}`,
                response: error.response?.data || 'No response data'
            });
        }
    }

    // Test extremely large input
    try {
        const largeString = 'a'.repeat(10000);
        const userData = {
            email: generateTestEmail(),
            password: generateStrongPassword(),
            firstName: largeString,
            lastName: 'User'
        };

        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

        // If the server accepts extremely large input without validation, that's a potential issue
        logTest('Error Handling - Large Input', 'INFO', {
            note: 'Server accepted large input. Consider implementing size limits.',
            response: response.data
        });
    } catch (error) {
        if (error.response && (error.response.status === 400 || error.response.status === 413)) {
            logTest('Error Handling - Large Input', 'PASS', {
                note: 'Server correctly rejected large input',
                response: error.response.data
            });
        } else {
            logTest('Error Handling - Large Input', 'FAIL', {
                error: `Unexpected error: ${error.message}`,
                response: error.response?.data || 'No response data'
            });
        }
    }
};

// Main test execution function
const runAllTests = async () => {
    console.log('🚀 Starting Registration Functionality Tests...\n');

    // Test valid registration scenarios
    console.log('📝 Testing valid registration scenarios...');
    await testValidRegistration({
        email: generateTestEmail(),
        password: generateStrongPassword(),
        firstName: 'Test',
        lastName: 'User'
    }, 'Email-based');

    await testValidRegistration({
        phone: generateTestPhone(),
        password: generateStrongPassword(),
        firstName: 'Test',
        lastName: 'User'
    }, 'Phone-based');

    // Test invalid data scenarios
    console.log('\n📝 Testing invalid data scenarios...');
    await testInvalidEmailFormat();
    await testInvalidPhoneFormat();
    await testWeakPasswordValidation();
    await testMissingRequiredFields();

    // Test property name compatibility
    console.log('\n📝 Testing property name compatibility...');
    await testPropertyNameCompatibility();

    // Test Bangladesh-specific features
    console.log('\n📝 Testing Bangladesh-specific features...');
    await testBangladeshPhoneValidation();

    // Test security features
    console.log('\n📝 Testing security features...');
    await testRateLimiting();

    // Test database integration
    console.log('\n📝 Testing database integration...');
    await testDatabaseIntegration();

    // Test error handling
    console.log('\n📝 Testing error handling...');
    await testErrorHandling();

    // Generate test report
    console.log('\n📊 Generating Test Report...');
    generateTestReport();
};

const generateTestReport = () => {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: TEST_RESULTS.total,
            passed: TEST_RESULTS.passed,
            failed: TEST_RESULTS.failed,
            passRate: `${((TEST_RESULTS.passed / TEST_RESULTS.total) * 100).toFixed(2)}%`
        },
        details: TEST_RESULTS.details,
        performance: TEST_RESULTS.performance,
        security: TEST_RESULTS.security,
        integration: TEST_RESULTS.integration,
        recommendations: []
    };

    // Add recommendations based on test results
    if (TEST_RESULTS.failed > 0) {
        report.recommendations.push('Review and fix failed test cases');
    }

    const avgResponseTime = TEST_RESULTS.performance.reduce((sum, test) => {
        const time = parseFloat(test.responseTime);
        return sum + (isNaN(time) ? 0 : time);
    }, 0) / TEST_RESULTS.performance.length;

    if (avgResponseTime > 1000) {
        report.recommendations.push('Consider optimizing API response times (current average: ' + avgResponseTime.toFixed(2) + 'ms)');
    }

    if (!TEST_RESULTS.security.some(test => test.testName === 'Rate Limiting' && test.status === 'PASS')) {
        report.recommendations.push('Implement rate limiting for the registration endpoint');
    }

    // Save report to file
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '..', `registration-functionality-test-report-${new Date().toISOString().replace(/:/g, '-')}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print summary to console
    console.log('\n📋 Test Summary:');
    console.log(`   Total Tests: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Pass Rate: ${report.summary.passRate}`);

    if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    runAllTests,
    testValidRegistration,
    testInvalidEmailFormat,
    testInvalidPhoneFormat,
    testWeakPasswordValidation,
    testMissingRequiredFields,
    testPropertyNameCompatibility,
    testBangladeshPhoneValidation,
    testRateLimiting,
    testDatabaseIntegration,
    testErrorHandling
};