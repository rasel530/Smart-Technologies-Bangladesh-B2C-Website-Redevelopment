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
const notificationPreferencesRoutes = require('./notificationPreferences');
const privacySettingsRoutes = require('./privacySettings');
const accountDeletionRoutes = require('./accountDeletion');
const userPreferencesRoutes = require('./userPreferences');
const accountManagementRoutes = require('./accountManagement');
const profileRoutes = require('./profile');
const dataExportRoutes = require('./dataExport');
const roleRoutes = require('./roles');
const rbacRolesRoutes = require('./rbacRoles');
const rbacPermissionsRoutes = require('./rbacPermissions');
const rbacRolePermissionsRoutes = require('./rbacRolePermissions');
const rbacUserRolesRoutes = require('./rbacUserRoles');
const rbacEscalationRoutes = require('./rbacEscalation');
const rbacAuthCheckRoutes = require('./rbacAuthCheck');
const corporateRoutes = require('./corporate');
const adminElasticsearchRoutes = require('./admin/elasticsearch');
const comparisonsRoutes = require('./comparisons');
const comparisonsGuestRoutes = require('./comparisons-guest');
const adminComparisonsRoutes = require('./admin/comparisons');

const router = express.Router();

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
// Mount preference routes under /api/v1/profile (REST best practice - use plural resources)
router.use('/v1/profile', profileRoutes);
router.use('/v1/profile/preferences', notificationPreferencesRoutes);
router.use('/v1/profile/preferences', privacySettingsRoutes);
router.use('/v1/profile/account', accountManagementRoutes);
router.use('/v1/profile', dataExportRoutes);
router.use('/v1/roles', roleRoutes);

// RBAC routes - prefixed with /api/rbac
router.use('/rbac/roles', rbacRolesRoutes);
router.use('/rbac/permissions', rbacPermissionsRoutes);
router.use('/rbac/role-permissions', rbacRolePermissionsRoutes);
router.use('/rbac/user-roles', rbacUserRolesRoutes);
router.use('/rbac/role-escalation-requests', rbacEscalationRoutes);
router.use('/rbac/auth', rbacAuthCheckRoutes);

// Corporate account management routes
router.use('/v1/corporate', corporateRoutes);

// Admin Elasticsearch management routes
router.use('/v1/admin/elasticsearch', adminElasticsearchRoutes);

// Product comparison routes
router.use('/v1/comparisons', comparisonsRoutes);
router.use('/v1/comparisons', comparisonsGuestRoutes);
router.use('/v1/admin/comparisons', adminComparisonsRoutes);

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
        profile: '/api/v1/profile',
        products: '/api/v1/products',
        categories: '/api/v1/categories',
        brands: '/api/v1/brands',
        orders: '/api/v1/orders',
        cart: '/api/v1/cart',
        wishlist: '/api/v1/wishlist',
        reviews: '/api/v1/reviews',
        coupons: '/api/v1/coupons',
        sessions: '/api/v1/sessions',
        health: '/api/v1/health',
        notifications: '/api/v1/profile/preferences/notifications',
        communication: '/api/v1/profile/preferences/communication',
        privacy: '/api/v1/profile/preferences/privacy',
        accountManagement: '/api/v1/profile/account',
        roles: '/api/v1/roles',
        corporate: '/api/v1/corporate'
      },
      rbac: {
        roles: '/api/rbac/roles',
        permissions: '/api/rbac/permissions',
        rolePermissions: '/api/rbac/role-permissions',
        userRoles: '/api/rbac/user-roles',
        escalationRequests: '/api/rbac/role-escalation-requests',
        auth: '/api/rbac/auth'
      },
      admin: {
        elasticsearch: '/api/v1/admin/elasticsearch',
        comparisons: '/api/v1/admin/comparisons'
      },
      comparisons: {
        comparisons: '/api/v1/comparisons',
        guest: '/api/v1/comparisons/guest'
      }
    },
    documentation: '/api-docs'
  });
});

module.exports = router;