const express = require('express');
const { authMiddleware } = require('./middleware/auth');
const { configService } = require('./services/config');
const { loggerService } = require('./services/logger');

// Create a test app to diagnose routing issues
const app = express();

// Middleware setup (same as main app)
app.use(express.json({
  limit: '10mb',
  strict: true
}));

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'The request body contains invalid JSON',
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Test route mounting
console.log('=== ROUTING DIAGNOSIS ===');
console.log('1. Main app routes:');

// Check how routes are mounted in main index.js
console.log('   - Line 109: app.use("/api", routeIndex)');
console.log('   - This means all routes from routeIndex will be prefixed with /api');

console.log('\n2. Route index mounting (routes/index.js):');
console.log('   - Line 22: router.use("/v1/auth", authRoutes)');
console.log('   - This means auth routes will be prefixed with /v1/auth');

console.log('\n3. Final path calculation:');
console.log('   - Base path: /api');
console.log('   - Route index adds: /v1/auth');
console.log('   - Expected final path: /api/v1/auth');
console.log('   - BUT if client requests /api/v1/auth, it becomes /api/api/v1/auth');

console.log('\n4. JSON Parsing Analysis:');
console.log('   - Lines 76-79 in index.js: express.json() middleware');
console.log('   - Lines 82-92: JSON error handling middleware');
console.log('   - Potential issue: strict: true might reject valid JSON');

// Test the routing structure
const routeIndex = require('./routes/index');

// Test a sample request
const mockReq = {
  method: 'POST',
  url: '/api/v1/auth/register',
  headers: {
    'content-type': 'application/json'
  },
  body: {
    email: 'test@example.com',
    password: 'test123456',
    confirmPassword: 'test123456'
  }
};

console.log('\n5. Testing route resolution:');
console.log('   - Request URL:', mockReq.url);
console.log('   - Expected route: /api/v1/auth/register');
console.log('   - Actual route resolution needs testing...');

// Create a test router to simulate the main app
const testApp = express();
testApp.use('/api', routeIndex);

// Add a middleware to log all requests
testApp.use((req, res, next) => {
  console.log('   - Request received:', req.method, req.originalUrl);
  console.log('   - Base URL:', req.baseUrl);
  console.log('   - Path:', req.path);
  next();
});

// Export for testing
module.exports = { app, testApp };

console.log('\n6. Diagnosis Summary:');
console.log('   ISSUE 1: Double API prefix');
console.log('   - Root cause: app.use("/api", routeIndex) + client requesting /api/v1/auth');
console.log('   - Result: /api/api/v1/auth (double prefix)');
console.log('   - Fix: Change client to request /v1/auth OR change server mount point');

console.log('\n   ISSUE 2: JSON parsing failures');
console.log('   - Root cause: strict: true in express.json() middleware');
console.log('   - Effect: Rejects valid JSON with trailing commas or comments');
console.log('   - Fix: Set strict: false or improve error handling');

console.log('\n7. Recommended fixes:');
console.log('   1. Change app.use("/api", routeIndex) to app.use("/", routeIndex)');
console.log('   2. OR keep server as-is and update client to use /v1/auth endpoints');
console.log('   3. Set strict: false in express.json() middleware');
console.log('   4. Add better JSON error handling with detailed messages');

console.log('\n=== END DIAGNOSIS ===');