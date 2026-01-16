/**
 * RBAC Token Diagnostic Script
 * 
 * This script tests the token flow from login to API calls
 * to diagnose why RBAC endpoints are receiving "No token provided" errors.
 */

console.log('='.repeat(60));
console.log('RBAC TOKEN DIAGNOSTIC SCRIPT');
console.log('='.repeat(60));
console.log('');

// Test 1: Check localStorage for auth_token
console.log('[TEST 1] Checking localStorage for auth_token...');
const tokenInStorage = localStorage.getItem('auth_token');
if (tokenInStorage) {
  console.log('[TEST 1] ✓ Token found in localStorage:', tokenInStorage.substring(0, 30) + '...');
  console.log('[TEST 1]   Token length:', tokenInStorage.length);
} else {
  console.log('[TEST 1] ✗ No token found in localStorage');
}
console.log('');

// Test 2: Check if API client can retrieve token
console.log('[TEST 2] Testing API client token retrieval...');
const { getToken } = require('./frontend/src/lib/api/client');
const retrievedToken = getToken();
if (retrievedToken) {
  console.log('[TEST 2] ✓ API client retrieved token:', retrievedToken.substring(0, 30) + '...');
} else {
  console.log('[TEST 2] ✗ API client could not retrieve token');
}
console.log('');

// Test 3: Check if addAuthHeader adds Authorization header
console.log('[TEST 3] Testing addAuthHeader function...');
const { apiClient } = require('./frontend/src/lib/api/client');
const testHeaders = {};
const authHeaders = apiClient.addAuthHeader ? apiClient.addAuthHeader(testHeaders) : testHeaders;

if (authHeaders['Authorization']) {
  console.log('[TEST 3] ✓ Authorization header added:', authHeaders['Authorization'].substring(0, 20) + '...');
} else {
  console.log('[TEST 3] ✗ No Authorization header added');
  console.log('[TEST 3]   Available headers:', Object.keys(authHeaders));
}
console.log('');

// Test 4: Make actual API call to RBAC endpoint
console.log('[TEST 4] Making actual API call to RBAC endpoint...');
console.log('[TEST 4]   Endpoint: GET http://localhost:3001/api/v1/rbac/roles');

fetch('http://localhost:3001/api/v1/rbac/roles', {
  method: 'GET',
  headers: authHeaders,
})
  .then(response => {
    console.log('[TEST 4] API Response status:', response.status);
    console.log('[TEST 4] API Response headers:', Object.fromEntries(response.headers.entries()));
    return response.text();
  })
  .then(text => {
    console.log('[TEST 4] API Response body:', text.substring(0, 500));
  })
  .catch(error => {
    console.error('[TEST 4] API Request failed:', error);
  });
console.log('');

// Test 5: Check NextAuth session (if available)
console.log('[TEST 5] Checking NextAuth session...');
if (typeof window !== 'undefined') {
  // Try to get session from cookies
  const cookies = document.cookie.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('next-auth.session-token='));
  
  if (sessionCookie) {
    console.log('[TEST 5] ✓ NextAuth session cookie found');
  } else {
    console.log('[TEST 5] ✗ No NextAuth session cookie found');
  }
  
  console.log('[TEST 5] All cookies:', cookies);
}
console.log('');

// Test 6: Check for token storage issues
console.log('[TEST 6] Checking for token storage inconsistencies...');
console.log('[TEST 6]   Keys in localStorage:', Object.keys(localStorage));
console.log('[TEST 6]   Values:', JSON.stringify(localStorage, null, 2));
console.log('');

// Summary
console.log('='.repeat(60));
console.log('DIAGNOSTIC SUMMARY');
console.log('='.repeat(60));
console.log('');
console.log('Please review the test results above and identify:');
console.log('1. Is token stored in localStorage?');
console.log('2. Can API client retrieve the token?');
console.log('3. Does addAuthHeader add Authorization header?');
console.log('4. Do actual API calls include the header?');
console.log('5. Is there a NextAuth session cookie?');
console.log('6. Are there any inconsistencies in storage?');
console.log('');
console.log('Run this script in browser console after logging in to the admin panel.');
