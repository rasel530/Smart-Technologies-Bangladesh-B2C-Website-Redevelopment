const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpWVCJ9.eyJ1c2VySWQiOiJlYTU5YmY0Ny00YjY2LTQzMWQtYmE2My1hMGE2OTQzNzc5OGYiLCJlbWFpbCI6ImFkbWluQHNtYXJ0dGVjaC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzA1NTAzODMsImV4cCI6MTc3MTE1NTE4M30.R3gViJ11Tj2ap3_bn8V8P4xR4DUL7aZJ8Hn_xynkZfg';

console.log('Decoded (no verify):', JSON.stringify(jwt.decode(token), null, 2));
