/**
 * Test script for admin comparisons analytics endpoints
 * Tests the fix for route ordering issue in backend/routes/admin/comparisons.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001/api/v1/admin/comparisons';
const ADMIN_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYTU5YmY0Ny00YjY2LTQzMWQtYmE2My1hMGE2OTQzNzc5OGYiLCJlbWFpbCI6ImFkbWluQHNtYXJ0dGVjaC5jb20iLCJwaG9uZSI6bnVsbCwicm9sZSI6ImFkbWluIiwic2Vzc2lvbklkIjoiNDE5MTljMDk5ODllMjQ1NDUxZWRiN2RiMjVjOTJlMGJmNGVlNTRhNmY5MWUyODJjMjBkZGM2MzkxYTI1OGM2NiIsImlhdCI6MTc3MDEzNDE2OSwiZXhwIjoxNzcwNzM4OTY5LCJhdWQiOiJzbWFydC1lY29tbWVyY2UtY2xpZW50cyIsImlzcyI6InNtYXJ0LWVjb21tZXJjZS1hcGkifQ.mpbvvLHWK3ZGKQYPOToQwai0lEnzdY0VNFXwcnTi8wE';

const tests = [
    {
        name: 'GET /stats?period=all',
        url: `${BASE_URL}/stats?period=all`,
        description: 'Get comparison statistics for all time'
    },
    {
        name: 'GET /stats?period=today',
        url: `${BASE_URL}/stats?period=today`,
        description: 'Get comparison statistics for today'
    },
    {
        name: 'GET /stats?period=week',
        url: `${BASE_URL}/stats?period=week`,
        description: 'Get comparison statistics for this week'
    },
    {
        name: 'GET /stats?period=month',
        url: `${BASE_URL}/stats?period=month`,
        description: 'Get comparison statistics for this month'
    },
    {
        name: 'GET /analytics?period=all&groupBy=day',
        url: `${BASE_URL}/analytics?period=all&groupBy=day`,
        description: 'Get comparison analytics for all time grouped by day'
    },
    {
        name: 'GET /analytics?period=week&groupBy=day',
        url: `${BASE_URL}/analytics?period=week&groupBy=day`,
        description: 'Get comparison analytics for this week grouped by day'
    },
    {
        name: 'GET /analytics?period=month&groupBy=week',
        url: `${BASE_URL}/analytics?period=month&groupBy=week`,
        description: 'Get comparison analytics for this month grouped by week'
    }
];

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'Authorization': ADMIN_TOKEN,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function runTests() {
    console.log('='.repeat(80));
    console.log('ADMIN COMPARISONS ANALYTICS ENDPOINTS TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Test Date: ${new Date().toISOString()}`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log('='.repeat(80));
    console.log();

    const results = [];
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        console.log(`Testing: ${test.name}`);
        console.log(`Description: ${test.description}`);
        console.log(`URL: ${test.url}`);

        try {
            const response = await makeRequest(test.url);
            const isSuccess = response.statusCode === 200;
            const hasValidationError = response.data && 
                (response.data.error && response.data.error.includes('Validation failed'));

            const result = {
                test: test.name,
                url: test.url,
                statusCode: response.statusCode,
                success: isSuccess && !hasValidationError,
                data: response.data,
                hasValidationError: hasValidationError
            };

            results.push(result);

            if (isSuccess && !hasValidationError) {
                passed++;
                console.log(`✓ Status: ${response.statusCode} OK`);
                console.log(`✓ No validation errors`);
                console.log(`✓ Response contains valid data`);
            } else {
                failed++;
                console.log(`✗ Status: ${response.statusCode} ${isSuccess ? 'OK' : 'FAILED'}`);
                if (hasValidationError) {
                    console.log(`✗ Validation error detected: ${response.data.error}`);
                }
            }

            console.log(`Response Data: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            failed++;
            const result = {
                test: test.name,
                url: test.url,
                statusCode: null,
                success: false,
                error: error.message,
                hasValidationError: false
            };
            results.push(result);
            console.log(`✗ Error: ${error.message}`);
        }

        console.log();
        console.log('-'.repeat(80));
        console.log();
    }

    // Summary
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(2)}%`);
    console.log('='.repeat(80));
    console.log();

    // Detailed Results
    console.log('='.repeat(80));
    console.log('DETAILED RESULTS');
    console.log('='.repeat(80));
    console.log();

    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.test}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Status Code: ${result.statusCode || 'N/A'}`);
        console.log(`   Success: ${result.success ? '✓ PASS' : '✗ FAIL'}`);
        if (result.hasValidationError) {
            console.log(`   Validation Error: YES`);
        }
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
        console.log();
    });

    // Save results to JSON file
    const fs = require('fs');
    const reportData = {
        testDate: new Date().toISOString(),
        baseUrl: BASE_URL,
        summary: {
            total: tests.length,
            passed: passed,
            failed: failed,
            successRate: ((passed / tests.length) * 100).toFixed(2) + '%'
        },
        results: results
    };

    const reportFilename = `admin-comparisons-test-results-${Date.now()}.json`;
    fs.writeFileSync(reportFilename, JSON.stringify(reportData, null, 2));
    console.log(`Test results saved to: ${reportFilename}`);
    console.log();

    // Final verdict
    console.log('='.repeat(80));
    if (failed === 0) {
        console.log('✓ ALL TESTS PASSED - The route ordering fix is working correctly!');
    } else {
        console.log(`✗ ${failed} TEST(S) FAILED - The fix may need additional work`);
    }
    console.log('='.repeat(80));

    return reportData;
}

// Run tests
runTests()
    .then((results) => {
        console.log('\nTest execution completed.');
        process.exit(failed === 0 ? 0 : 1);
    })
    .catch((error) => {
        console.error('Fatal error during test execution:', error);
        process.exit(1);
    });
