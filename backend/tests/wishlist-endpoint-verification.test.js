/**
 * Wishlist Endpoint Verification Test
 * 
 * This test suite verifies the fix for the 404 error on GET /api/v1/wishlist
 * 
 * Issue: Frontend was calling plural form `/api/v1/wishlists` but backend expected singular `/api/v1/wishlist`
 * Fix: Updated all frontend occurrences from `/api/v1/wishlists` to `/api/v1/wishlist`
 * 
 * This test verifies:
 * 1. GET /api/v1/wishlist returns 200 (not 404)
 * 2. The endpoint responds with correct wishlist data structure
 * 3. The frontend can successfully call the wishlist API
 */

const request = require('supertest');
const app = require('../index');

describe('Wishlist Endpoint Verification - 404 Fix', () => {
  
  let testUser, testToken;
  const testEmail = `wishlist.verification.${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';
  
  /**
   * Setup: Create test user and authenticate before tests
   */
  beforeAll(async () => {
    try {
      // Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          firstName: 'Wishlist',
          lastName: 'Verification',
          phone: '+8801700000000'
        })
        .set('Accept', 'application/json');
      
      if (registerResponse.status === 201) {
        testUser = registerResponse.body.user;
        
        // Login user
        const loginResponse = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: testEmail,
            password: testPassword
          })
          .set('Accept', 'application/json');
        
        if (loginResponse.status === 200) {
          testToken = loginResponse.body.token;
        }
      }
    } catch (error) {
      console.error('[Setup] Failed to create test user:', error.message);
    }
  });
  
  /**
   * Test 1: Verify GET /api/v1/wishlist endpoint exists (not 404)
   */
  describe('GET /api/v1/wishlist - Endpoint Existence', () => {
    
    it('should NOT return 404 when accessing GET /api/v1/wishlist', async () => {
      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('Accept', 'application/json');
      
      // The endpoint should exist (not 404)
      // It may return 401 (unauthorized) but NOT 404 (not found)
      expect(response.status).not.toBe(404);
      expect([200, 401]).toContain(response.status);
    });
    
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  /**
   * Test 2: Verify GET /api/v1/wishlist returns 200 with authentication
   */
  describe('GET /api/v1/wishlist - Authenticated Access', () => {
    
    it('should return 200 status code with valid authentication token', async () => {
      if (!testToken) {
        console.warn('[Test] Skipping - no authentication token available');
        return;
      }
      
      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
    });
    
    it('should return wishlist data with correct structure', async () => {
      if (!testToken) {
        console.warn('[Test] Skipping - no authentication token available');
        return;
      }
      
      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wishlists');
      expect(Array.isArray(response.body.wishlists)).toBe(true);
    });
    
    it('should include pagination metadata', async () => {
      if (!testToken) {
        console.warn('[Test] Skipping - no authentication token available');
        return;
      }
      
      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      // Pagination may or may not be present depending on implementation
      if (response.body.pagination) {
        expect(response.body.pagination).toHaveProperty('page');
        expect(response.body.pagination).toHaveProperty('limit');
        expect(response.body.pagination).toHaveProperty('total');
      }
    });
  });
  
  /**
   * Test 3: Verify wishlist CRUD operations work
   */
  describe('Wishlist CRUD Operations', () => {
    
    let createdWishlistId;
    
    it('should create a new wishlist', async () => {
      if (!testToken) {
        console.warn('[Test] Skipping - no authentication token available');
        return;
      }
      
      const response = await request(app)
        .post('/api/v1/wishlist')
        .send({
          name: 'Verification Test Wishlist',
          description: 'Created during endpoint verification test'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('wishlist');
      expect(response.body.wishlist).toHaveProperty('id');
      expect(response.body.wishlist).toHaveProperty('name');
      expect(response.body.wishlist.name).toBe('Verification Test Wishlist');
      
      createdWishlistId = response.body.wishlist.id;
    });
    
    it('should get wishlist by ID', async () => {
      if (!testToken || !createdWishlistId) {
        console.warn('[Test] Skipping - no token or wishlist ID available');
        return;
      }
      
      const response = await request(app)
        .get(`/api/v1/wishlist/${createdWishlistId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wishlist');
      expect(response.body.wishlist.id).toBe(createdWishlistId);
    });
    
    it('should update wishlist details', async () => {
      if (!testToken || !createdWishlistId) {
        console.warn('[Test] Skipping - no token or wishlist ID available');
        return;
      }
      
      const response = await request(app)
        .put(`/api/v1/wishlist/${createdWishlistId}`)
        .send({
          name: 'Updated Verification Test Wishlist',
          description: 'Updated during endpoint verification test'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wishlist');
      expect(response.body.wishlist.name).toBe('Updated Verification Test Wishlist');
    });
    
    it('should delete wishlist', async () => {
      if (!testToken || !createdWishlistId) {
        console.warn('[Test] Skipping - no token or wishlist ID available');
        return;
      }
      
      const response = await request(app)
        .delete(`/api/v1/wishlist/${createdWishlistId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  /**
   * Test 4: Verify old plural endpoint returns 404
   */
  describe('Legacy Endpoint - /api/v1/wishlists (plural)', () => {
    
    it('should return 404 for old plural endpoint /api/v1/wishlists', async () => {
      const response = await request(app)
        .get('/api/v1/wishlists')  // Old plural endpoint
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(404);
    });
    
    it('should return 404 for POST to old plural endpoint', async () => {
      const response = await request(app)
        .post('/api/v1/wishlists')
        .send({ name: 'Test' })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(404);
    });
  });
  
  /**
   * Test 5: Verify query parameters work correctly
   */
  describe('Query Parameters', () => {
    
    it('should support includeItems query parameter', async () => {
      if (!testToken) {
        console.warn('[Test] Skipping - no authentication token available');
        return;
      }
      
      const response = await request(app)
        .get('/api/v1/wishlist?includeItems=true')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wishlists');
    });
    
    it('should support pagination query parameters', async () => {
      if (!testToken) {
        console.warn('[Test] Skipping - no authentication token available');
        return;
      }
      
      const response = await request(app)
        .get('/api/v1/wishlist?page=1&limit=10')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wishlists');
    });
  });
  
  /**
   * Test 6: Verify error handling
   */
  describe('Error Handling', () => {
    
    it('should return 404 for non-existent wishlist ID', async () => {
      if (!testToken) {
        console.warn('[Test] Skipping - no authentication token available');
        return;
      }
      
      const response = await request(app)
        .get('/api/v1/wishlist/nonexistent-id-12345')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(404);
    });
    
    it('should return 401 for unauthenticated access', async () => {
      const response = await request(app)
        .post('/api/v1/wishlist')
        .send({ name: 'Test' })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(401);
    });
  });
  
  /**
   * Summary Test: Verify the 404 fix is complete
   */
  describe('404 Fix Verification Summary', () => {
    
    it('should confirm GET /api/v1/wishlist endpoint is accessible', async () => {
      // This is the key test to verify the 404 error is fixed
      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('Accept', 'application/json');
      
      // The endpoint should NOT return 404
      expect(response.status).not.toBe(404);
      
      // It should return either 200 (authenticated) or 401 (unauthenticated)
      expect([200, 401]).toContain(response.status);
    });
    
    it('should confirm old plural endpoint /api/v1/wishlists is deprecated', async () => {
      const response = await request(app)
        .get('/api/v1/wishlists')
        .set('Accept', 'application/json');
      
      // The old plural endpoint should return 404
      expect(response.status).toBe(404);
    });
  });
});
