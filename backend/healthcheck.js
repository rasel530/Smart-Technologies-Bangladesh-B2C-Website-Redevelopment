#!/usr/bin/env node

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Health check passed');
      process.exit(0);
    } else {
      console.log('Health check failed with status:', res.statusCode);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.log('Health check failed with error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Health check timed out');
  req.destroy();
  process.exit(1);
});

req.end();
