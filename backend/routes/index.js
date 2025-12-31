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

// API versioning - Removed to fix route mounting issue
// router.use('/v1', (req, res, next) => {
//   req.apiVersion = 'v1';
//   next();
// });

// Route modules - prefixed with /v1
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/products', productRoutes);
router.use('/v1/categories', categoryRoutes);
router.use('/v1/brands', brandRoutes);
router.use('/v1/orders', orderRoutes);
router.use('/v1/cart', cartRoutes);
router.use('/v1/wishlist', wishlistRoutes);
router.use('/v1/reviews', reviewRoutes);
router.use('/v1/coupons', couponRoutes);

// API documentation endpoint
router.get('/', (req, res) => {
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
        coupons: '/api/v1/coupons',
        sessions: '/api/v1/sessions',
        health: '/api/v1/health'
      }
    },
    documentation: '/api-docs'
  });
});

module.exports = router;