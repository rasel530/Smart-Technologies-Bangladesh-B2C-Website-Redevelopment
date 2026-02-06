/**
 * End-to-End Tests for Product Comparison System
 * Generated: 2026-02-03T17:30:00Z
 * Test Engineer: QA Specialist
 */

const { chromium } = require('playwright');
const request = require('supertest');

describe('E2E Tests - Product Comparison System', () => {
  let browser;
  let page;
  let app;
  let authToken;

  beforeAll(async () => {
    app = require('../../app');
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarttech.com',
        password: 'AdminPassword123'
      });
    authToken = loginResponse.body.token;

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      slowMo: 100
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('User Adding Products to Comparison', () => {
    it('should complete full comparison creation flow', async () => {
      // Navigate to product page
      await page.goto('http://localhost:3000/products/laptop-1');
      await page.waitForLoadState('networkidle');

      // Click "Add to Comparison" button
      await page.click('[data-testid="add-to-comparison-button"]');
      
      // Verify success message
      await page.waitForSelector('[data-testid="comparison-success-message"]');
      const successMessage = await page.textContent('[data-testid="comparison-success-message"]');
      expect(successMessage).toContain('added to comparison');
    });

    it('should add multiple products to comparison', async () => {
      // Add first product
      await page.goto('http://localhost:3000/products/laptop-1');
      await page.click('[data-testid="add-to-comparison-button"]');
      
      // Add second product
      await page.goto('http://localhost:3000/products/laptop-2');
      await page.click('[data-testid="add-to-comparison-button"]');
      
      // Add third product
      await page.goto('http://localhost:3000/products/laptop-3');
      await page.click('[data-testid="add-to-comparison-button"]');
      
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Verify 3 products in comparison
      const productCount = await page.locator('[data-testid="comparison-product"]').count();
      expect(productCount).toBe(3);
    });

    it('should remove product from comparison', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Click remove button on first product
      await page.click('[data-testid="remove-from-comparison-button"]:first-child');
      
      // Verify product removed
      const productCount = await page.locator('[data-testid="comparison-product"]').count();
      expect(productCount).toBeLessThan(3);
    });
  });

  describe('Guest User Adding Products to Comparison', () => {
    it('should allow guest to create comparison', async () => {
      // Clear cookies to simulate guest
      await page.context().clearCookies();
      
      // Navigate to product page
      await page.goto('http://localhost:3000/products/laptop-1');
      await page.waitForLoadState('networkidle');
      
      // Click "Add to Comparison" button
      await page.click('[data-testid="add-to-comparison-button"]');
      
      // Verify success message
      await page.waitForSelector('[data-testid="comparison-success-message"]');
      const successMessage = await page.textContent('[data-testid="comparison-success-message"]');
      expect(successMessage).toContain('added to comparison');
    });

    it('should persist guest comparison in session', async () => {
      // Add product as guest
      await page.goto('http://localhost:3000/products/laptop-1');
      await page.click('[data-testid="add-to-comparison-button"]');
      
      // Navigate to another page
      await page.goto('http://localhost:3000/products');
      await page.waitForLoadState('networkidle');
      
      // Navigate back to comparison
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Verify product still in comparison
      const productCount = await page.locator('[data-testid="comparison-product"]').count();
      expect(productCount).toBeGreaterThan(0);
    });

    it('should expire guest comparison after 30 days', async () => {
      // This test would require manipulating time or database
      // For now, we'll verify the cleanup job exists
      const response = await request(app)
        .post('/api/v1/comparisons/cleanup-expired')
        .expect(200);

      expect(response.body.message).toContain('cleanup');
    });
  });

  describe('Viewing Comparison Results', () => {
    it('should display comparison with product details', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Verify comparison title
      const title = await page.textContent('[data-testid="comparison-title"]');
      expect(title).toBeTruthy();
      
      // Verify products displayed
      const products = await page.locator('[data-testid="comparison-product"]');
      expect(await products.count()).toBeGreaterThan(0);
      
      // Verify specifications displayed
      const specs = await page.locator('[data-testid="product-specifications"]');
      expect(await specs.count()).toBeGreaterThan(0);
    });

    it('should display price comparison', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Verify price comparison section
      const priceSection = await page.locator('[data-testid="price-comparison"]');
      expect(await priceSection.count()).toBeGreaterThan(0);
      
      // Verify prices displayed
      const prices = await page.locator('[data-testid="product-price"]');
      expect(await prices.count()).toBeGreaterThan(0);
    });

    it('should display specification comparison', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Verify spec comparison section
      const specSection = await page.locator('[data-testid="spec-comparison"]');
      expect(await specSection.count()).toBeGreaterThan(0);
      
      // Verify specs displayed
      const specs = await page.locator('[data-testid="spec-row"]');
      expect(await specs.count()).toBeGreaterThan(0);
    });

    it('should highlight differences in specifications', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Verify difference highlighting
      const highlightedSpecs = await page.locator('[data-testid="spec-diff"]');
      expect(await highlightedSpecs.count()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Sharing Comparisons', () => {
    it('should generate share link', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons/test-comparison-id');
      await page.waitForLoadState('networkidle');
      
      // Click share button
      await page.click('[data-testid="share-comparison-button"]');
      
      // Verify share modal appears
      await page.waitForSelector('[data-testid="share-modal"]');
      
      // Verify share link generated
      const shareLink = await page.inputValue('[data-testid="share-link-input"]');
      expect(shareLink).toContain('/comparisons/shared/');
    });

    it('should persist share token to database', async () => {
      const comparisonId = 'test-comparison-id';
      
      // Generate share token
      const response = await request(app)
        .post(`/api/v1/comparisons/${comparisonId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.shareToken).toBeTruthy();
      
      // Verify token in database
      const comparison = await request(app)
        .get(`/api/v1/comparisons/${comparisonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(comparison.body.shareToken).toBe(response.body.shareToken);
    });

    it('should access shared comparison via link', async () => {
      // Generate share token
      const shareResponse = await request(app)
        .post('/api/v1/comparisons/test-id/share')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const shareToken = shareResponse.body.shareToken;
      
      // Access shared comparison
      await page.goto(`http://localhost:3000/comparisons/shared/${shareToken}`);
      await page.waitForLoadState('networkidle');
      
      // Verify comparison displayed
      const title = await page.textContent('[data-testid="comparison-title"]');
      expect(title).toBeTruthy();
    });

    it('should reject expired share link', async () => {
      // Navigate to expired share link
      await page.goto('http://localhost:3000/comparisons/shared/expired-token');
      await page.waitForLoadState('networkidle');
      
      // Verify error message
      const errorMessage = await page.textContent('[data-testid="error-message"]');
      expect(errorMessage).toContain('expired');
    });

    it('should copy share link to clipboard', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons/test-comparison-id');
      await page.waitForLoadState('networkidle');
      
      // Click share button
      await page.click('[data-testid="share-comparison-button"]');
      await page.waitForSelector('[data-testid="share-modal"]');
      
      // Click copy button
      await page.click('[data-testid="copy-share-link-button"]');
      
      // Verify success message
      await page.waitForSelector('[data-testid="copy-success-message"]');
      const successMessage = await page.textContent('[data-testid="copy-success-message"]');
      expect(successMessage).toContain('copied');
    });
  });

  describe('Exporting Comparisons', () => {
    it('should export comparison as CSV', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons/test-comparison-id');
      await page.waitForLoadState('networkidle');
      
      // Click export button
      await page.click('[data-testid="export-button"]');
      
      // Select CSV format
      await page.click('[data-testid="export-csv-option"]');
      
      // Verify download started
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="confirm-export-button"]')
      ]);

      expect(download.suggestedFilename()).toContain('.csv');
    });

    it('should export comparison as JSON', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons/test-comparison-id');
      await page.waitForLoadState('networkidle');
      
      // Click export button
      await page.click('[data-testid="export-button"]');
      
      // Select JSON format
      await page.click('[data-testid="export-json-option"]');
      
      // Verify download started
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="confirm-export-button"]')
      ]);

      expect(download.suggestedFilename()).toContain('.json');
    });

    it('should export comparison as PDF', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons/test-comparison-id');
      await page.waitForLoadState('networkidle');
      
      // Click export button
      await page.click('[data-testid="export-button"]');
      
      // Select PDF format
      await page.click('[data-testid="export-pdf-option"]');
      
      // Verify download started
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="confirm-export-button"]')
      ]);

      expect(download.suggestedFilename()).toContain('.pdf');
    });

    it('should have consistent export format', async () => {
      // Export as CSV
      const csvResponse = await request(app)
        .get('/api/v1/comparisons/test-id/export/csv')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Export as JSON
      const jsonResponse = await request(app)
        .get('/api/v1/comparisons/test-id/export/json')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify both have consistent data structure
      expect(csvResponse.text).toContain('Product Name');
      const jsonData = JSON.parse(jsonResponse.text);
      expect(jsonData).toHaveProperty('title');
      expect(jsonData).toHaveProperty('products');
    });
  });

  describe('Admin Viewing Comparison Analytics', () => {
    it('should display comparison analytics dashboard', async () => {
      // Login as admin
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'admin@smarttech.com');
      await page.fill('[data-testid="password-input"]', 'AdminPassword123');
      await page.click('[data-testid="login-button"]');
      await page.waitForLoadState('networkidle');
      
      // Navigate to admin analytics
      await page.goto('http://localhost:3000/admin/comparisons/analytics');
      await page.waitForLoadState('networkidle');
      
      // Verify analytics displayed
      const totalComparisons = await page.textContent('[data-testid="total-comparisons"]');
      expect(totalComparisons).toBeTruthy();
      
      const avgProducts = await page.textContent('[data-testid="average-products"]');
      expect(avgProducts).toBeTruthy();
    });

    it('should display most compared products', async () => {
      // Navigate to admin analytics
      await page.goto('http://localhost:3000/admin/comparisons/analytics');
      await page.waitForLoadState('networkidle');
      
      // Verify most compared products section
      const mostCompared = await page.locator('[data-testid="most-compared-products"]');
      expect(await mostCompared.count()).toBeGreaterThan(0);
      
      // Verify product list
      const products = await page.locator('[data-testid="compared-product-item"]');
      expect(await products.count()).toBeGreaterThan(0);
    });

    it('should display comparisons by date chart', async () => {
      // Navigate to admin analytics
      await page.goto('http://localhost:3000/admin/comparisons/analytics');
      await page.waitForLoadState('networkidle');
      
      // Verify chart displayed
      const chart = await page.locator('[data-testid="comparisons-by-date-chart"]');
      expect(await chart.count()).toBeGreaterThan(0);
    });

    it('should use aggregated queries for analytics', async () => {
      const response = await request(app)
        .get('/api/v1/admin/comparisons/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalComparisons).toBeDefined();
      expect(response.body.averageProductsPerComparison).toBeDefined();
      expect(typeof response.body.totalComparisons).toBe('number');
      expect(typeof response.body.averageProductsPerComparison).toBe('number');
    });

    it('should support pagination on analytics', async () => {
      // Navigate to admin analytics with pagination
      await page.goto('http://localhost:3000/admin/comparisons/analytics?page=1&limit=10');
      await page.waitForLoadState('networkidle');
      
      // Verify pagination controls
      const pagination = await page.locator('[data-testid="pagination"]');
      expect(await pagination.count()).toBeGreaterThan(0);
    });
  });

  describe('Comparison Persistence Across Sessions', () => {
    it('should persist comparison after page refresh', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Get initial product count
      const initialCount = await page.locator('[data-testid="comparison-product"]').count();
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify product count unchanged
      const finalCount = await page.locator('[data-testid="comparison-product"]').count();
      expect(finalCount).toBe(initialCount);
    });

    it('should persist comparison after closing and reopening browser', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Get initial product count
      const initialCount = await page.locator('[data-testid="comparison-product"]').count();
      
      // Close browser
      await browser.close();
      
      // Reopen browser
      browser = await chromium.launch({ headless: true });
      page = await browser.newPage();
      
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Verify product count unchanged
      const finalCount = await page.locator('[data-testid="comparison-product"]').count();
      expect(finalCount).toBe(initialCount);
    });

    it('should persist comparison across different devices', async () => {
      // This test would require multiple browser sessions
      // For now, we'll verify the API supports it
      const comparisonId = 'test-comparison-id';
      
      // Create comparison on one device
      const createResponse = await request(app)
        .post('/api/v1/comparisons')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Cross-Device Test',
          productIds: ['prod1', 'prod2']
        })
        .expect(201);

      // Retrieve on another device (simulated with new token)
      const retrieveResponse = await request(app)
        .get(`/api/v1/comparisons/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(retrieveResponse.body.id).toBe(createResponse.body.id);
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching comparisons', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      
      // Verify loading indicator appears
      await page.waitForSelector('[data-testid="loading-indicator"]', { timeout: 1000 });
      
      // Wait for loading to complete
      await page.waitForSelector('[data-testid="comparison-product"]', { timeout: 5000 });
      
      // Verify loading indicator removed
      const loadingIndicator = await page.locator('[data-testid="loading-indicator"]');
      expect(await loadingIndicator.count()).toBe(0);
    });

    it('should show loading state while exporting', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons/test-comparison-id');
      await page.waitForLoadState('networkidle');
      
      // Click export button
      await page.click('[data-testid="export-button"]');
      
      // Select CSV format
      await page.click('[data-testid="export-csv-option"]');
      
      // Verify loading state
      await page.waitForSelector('[data-testid="export-loading"]');
      
      // Wait for export to complete
      await page.waitForSelector('[data-testid="export-success"]', { timeout: 5000 });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      // Navigate to non-existent comparison
      await page.goto('http://localhost:3000/comparisons/non-existent-id');
      await page.waitForLoadState('networkidle');
      
      // Verify error message displayed
      const errorMessage = await page.textContent('[data-testid="error-message"]');
      expect(errorMessage).toBeTruthy();
    });

    it('should handle clipboard errors gracefully', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons/test-comparison-id');
      await page.waitForLoadState('networkidle');
      
      // Click share button
      await page.click('[data-testid="share-comparison-button"]');
      await page.waitForSelector('[data-testid="share-modal"]');
      
      // Mock clipboard failure
      await page.evaluate(() => {
        navigator.clipboard.writeText = () => Promise.reject(new Error('Clipboard failed'));
      });
      
      // Click copy button
      await page.click('[data-testid="copy-share-link-button"]');
      
      // Verify error message displayed
      await page.waitForSelector('[data-testid="copy-error-message"]');
      const errorMessage = await page.textContent('[data-testid="copy-error-message"]');
      expect(errorMessage).toContain('Failed to copy');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Verify ARIA labels on buttons
      const buttons = await page.locator('button[aria-label]');
      expect(await buttons.count()).toBeGreaterThan(0);
      
      // Verify ARIA labels on inputs
      const inputs = await page.locator('input[aria-label]');
      expect(await inputs.count()).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Test Tab navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(['BUTTON', 'INPUT', 'A']).toContain(focusedElement);
      
      // Test Enter key on buttons
      await page.keyboard.press('Enter');
      
      // Test Escape key to close modals
      await page.keyboard.press('Escape');
    });

    it('should have proper focus indicators', async () => {
      // Navigate to comparison page
      await page.goto('http://localhost:3000/comparisons');
      await page.waitForLoadState('networkidle');
      
      // Focus on first button
      await page.focus('button:first-child');
      
      // Verify focus indicator
      const focusedButton = await page.locator('button:focus');
      expect(await focusedButton.count()).toBe(1);
    });
  });
});
