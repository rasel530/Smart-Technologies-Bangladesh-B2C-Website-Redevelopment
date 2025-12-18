const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const brandRoutes = require('./brands');
const orderRoutes = require('./orders');
const cartRoutes = require('./cart');
const wishlistRoutes = require('./wishlist');
const reviewRoutes = require('./reviews');
const couponRoutes = require('./coupons');

const router = express.Router();

// API versioning
router.use('/api/v1', (req, res, next) => {
  req.apiVersion = 'v1';
  next();
});

// Route modules
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/users', userRoutes);
router.use('/api/v1/products', productRoutes);
router.use('/api/v1/categories', categoryRoutes);
router.use('/api/v1/brands', brandRoutes);
router.use('/api/v1/orders', orderRoutes);
router.use('/api/v1/cart', cartRoutes);
router.use('/api/v1/wishlist', wishlistRoutes);
router.use('/api/v1/reviews', reviewRoutes);
router.use('/api/v1/coupons', couponRoutes);

// API documentation endpoint
router.get('/api', (req, res) => {
  res.json({
    name: 'Smart Technologies Bangladesh B2C API',
    version: '1.0.0',
    description: 'E-commerce API for Smart Technologies Bangladesh',
    endpoints: {
      v1: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        products: '/api/v1/products',
        categories: '/api/v1/categories',
        brands: '/api/v1/brands',
        orders: '/api/v1/orders',
        cart: '/api/v1/cart',
        wishlist: '/api/v1/wishlist',
        reviews: '/api/v1/reviews',
        coupons: '/api/v1/coupons'
      }
    },
    documentation: '/api-docs'
  });
});

module.exports = router;