/**
 * Simple test for data export download endpoint
 * Tests the endpoint without authentication for debugging
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';
const EXPORT_ID = 'dc33ac56-67bf-4443-aea1-42ca227321ec';

console.log('='.repeat(70));
console.log('DATA EXPORT DOWNLOAD SIMPLE TEST');
console.log('='.repeat(70));
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Export ID: ${EXPORT_ID}`);
console.log(`Test Time: ${new Date().toISOString()}`);
console.log('='.repeat(70));

async function testDownload() {
  console.log('\n[TEST] Testing download endpoint...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/profile/data/export/${EXPORT_ID}`, {
      responseType: 'arraybuffer',
      validateStatus: () => true
    });

    console.log(`\n[RESULT] Response Status: ${response.status}`);
    console.log(`\n[HEADERS] Response Headers:`);
    console.log(JSON.stringify(response.headers, null, 2));

    if (response.status === 200) {
      console.log('\n[SUCCESS] Download request successful!');
      
      const contentType = response.headers['content-type'];
      const contentDisposition = response.headers['content-disposition'];
      const contentLength = response.headers['content-length'];
      
      console.log(`\n[INFO] Content-Type: ${contentType}`);
      console.log(`[INFO] Content-Disposition: ${contentDisposition}`);
      console.log(`[INFO] Content-Length: ${contentLength} bytes`);
      
      // Parse filename from Content-Disposition
      let filename = `export_${EXPORT_ID}.json`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      console.log(`[INFO] Filename: ${filename}`);
      
      // Verify content
      const content = response.data;
      const contentString = Buffer.from(content).toString('utf8');
      
      try {
        const jsonData = JSON.parse(contentString);
        console.log('\n[SUCCESS] Content is valid JSON!');
        console.log(`[INFO] Data keys: ${Object.keys(jsonData).join(', ')}`);
        console.log(`[INFO] Data preview: ${JSON.stringify(jsonData).substring(0, 200)}...`);
      } catch (e) {
        console.log('\n[ERROR] Content is not valid JSON!');
        console.log(`[INFO] Content preview: ${contentString.substring(0, 200)}...`);
      }
      
      console.log('\n' + '='.repeat(70));
      console.log('TEST PASSED ✓');
      console.log('='.repeat(70));
      return true;
    } else {
      console.log('\n[ERROR] Download request failed!');
      const errorText = Buffer.from(response.data).toString('utf8');
      console.log(`[ERROR] Status: ${response.status}`);
      console.log(`[ERROR] Response: ${errorText}`);
      
      console.log('\n' + '='.repeat(70));
      console.log('TEST FAILED ✗');
      console.log('='.repeat(70));
      return false;
    }
  } catch (error) {
    console.log('\n[ERROR] Download error!');
    console.log(`[ERROR] Message: ${error.message}`);
    if (error.response) {
      console.log(`[ERROR] Status: ${error.response.status}`);
      console.log(`[ERROR] Data: ${error.response.data}`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('TEST FAILED ✗');
    console.log('='.repeat(70));
    return false;
  }
}

async function testCors() {
  console.log('\n[TEST] Testing CORS headers with OPTIONS request...');
  
  try {
    const response = await axios.options(`${API_BASE_URL}/profile/data/export/${EXPORT_ID}`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type'
      },
      validateStatus: () => true
    });

    console.log(`\n[RESULT] OPTIONS Response Status: ${response.status}`);
    console.log(`\n[HEADERS] CORS Headers:`);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers'],
      'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials'],
      'Access-Control-Expose-Headers': response.headers['access-control-expose-headers']
    };

    Object.entries(corsHeaders).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    if (corsHeaders['Access-Control-Allow-Origin']) {
      console.log('\n[SUCCESS] CORS headers present!');
      return true;
    } else {
      console.log('\n[ERROR] CORS headers missing!');
      return false;
    }
  } catch (error) {
    console.log('\n[ERROR] CORS test error!');
    console.log(`[ERROR] Message: ${error.message}`);
    return false;
  }
}

// Run tests
(async () => {
  const corsResult = await testCors();
  const downloadResult = await testDownload();
  
  console.log('\n' + '='.repeat(70));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`CORS Test: ${corsResult ? 'PASSED ✓' : 'FAILED ✗'}`);
  console.log(`Download Test: ${downloadResult ? 'PASSED ✓' : 'FAILED ✗'}`);
  console.log('='.repeat(70) + '\n');
  
  process.exit(corsResult && downloadResult ? 0 : 1);
})();
