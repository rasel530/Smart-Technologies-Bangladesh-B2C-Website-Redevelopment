const http = require('http');

const BASE_URL = 'http://localhost:3001/api/v1/admin/comparisons/analytics';
const ADMIN_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYTU5YmY0Ny00YjY2LTQzMWQtYmE2My1hMGE2OTQzNzc5OGYiLCJlbWFpbCI6ImFkbWluQHNtYXJ0dGVjaC5jb20iLCJwaG9uZSI6bnVsbCwicm9sZSI6ImFkbWluIiwic2Vzc2lvbklkIjoiNDE5MTljMDk5ODllMjQ1NDUxZWRiN2RiMjVjOTJlMGJmNGVlNTRhNmY5MWUyODJjMjBkZGM2MzkxYTI1OGM2NiIsImlhdCI6MTc3MDEzNDE2OSwiZXhwIjoxNzcwNzM4OTY5LCJhdWQiOiJzbWFydC1lY29tbWVyY2UtY2xpZW50cyIsImlzcyI6InNtYXJ0LWVjb21tZXJjZS1hcGkifQ.mpbvvLHWK3ZGKQYPOToQwai0lEnzdY0VNFXwcnTi8wE';

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
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
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

async function testAnalytics() {
    console.log('Testing /analytics endpoint...');
    console.log('URL:', `${BASE_URL}?period=all&groupBy=day`);
    console.log();

    try {
        const response = await makeRequest(`${BASE_URL}?period=all&groupBy=day`);
        console.log('Status Code:', response.statusCode);
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAnalytics();
