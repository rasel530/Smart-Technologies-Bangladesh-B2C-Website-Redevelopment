/**
 * Test API Endpoints Script
 * 
 * This script tests the new-arrivals and best-sellers endpoints
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// Simulate the backend API endpoints
app.get('/api/v1/products/new-arrivals', async (req, res) => {
  try {
    console.log('[TEST] GET /api/v1/products/new-arrivals');
    
    const products = await prisma.product.findMany({
      where: {
        status: 'active',
        visibility: 'public',
        isNewArrival: true
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`[TEST] Found ${products.length} new arrivals`);
    products.forEach(p => console.log(`  - ${p.name}`));
    
    res.json({
      products,
      total: products.length
    });
  } catch (error) {
    console.error('[TEST] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/products/best-sellers', async (req, res) => {
  try {
    console.log('[TEST] GET /api/v1/products/best-sellers');
    
    const products = await prisma.product.findMany({
      where: {
        status: 'active',
        visibility: 'public',
        isBestSeller: true
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`[TEST] Found ${products.length} best sellers`);
    products.forEach(p => console.log(`  - ${p.name}`));
    
    res.json({
      products,
      total: products.length
    });
  } catch (error) {
    console.error('[TEST] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(3002, () => {
  console.log('[TEST] Test server running on port 3002');
  
  // Test the endpoints
  setTimeout(async () => {
    try {
      console.log('\n[TEST] Testing /api/v1/products/new-arrivals...');
      const newArrivals = await fetch('http://localhost:3002/api/v1/products/new-arrivals');
      const newArrivalsData = await newArrivals.json();
      console.log('[TEST] Response:', JSON.stringify(newArrivalsData, null, 2));
      
      console.log('\n[TEST] Testing /api/v1/products/best-sellers...');
      const bestSellers = await fetch('http://localhost:3002/api/v1/products/best-sellers');
      const bestSellersData = await bestSellers.json();
      console.log('[TEST] Response:', JSON.stringify(bestSellersData, null, 2));
      
      server.close();
      await prisma.$disconnect();
    } catch (error) {
      console.error('[TEST] Test failed:', error);
      server.close();
      await prisma.$disconnect();
      process.exit(1);
    }
  }, 1000);
});
