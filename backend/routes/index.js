const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const brandRoutes = require('./brands');
const orderRoutes = require('./orders');
const cartRoutes = require('./cart');
const wishlistRoutes = require('./wishlistRoutes');
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
const adminCartRoutes = require('./admin/cart');
const adminInventoryRoutes = require('./admin/inventory');
const comparisonsRoutes = require('./comparisons');
const comparisonsGuestRoutes = require('./comparisons-guest');
const adminComparisonsRoutes = require('./admin/comparisons');
const adminDiscountRoutes = require('./admin/discount');
const adminWishlistRoutes = require('./adminWishlistRoutes');
const adminCheckoutRoutes = require('./admin/checkout');
const adminDashboardRoutes = require('./admin/dashboard');
const adminProductsRoutes = require('./admin/products');
const adminUsersRoutes = require('./admin/users');
// Cart-Wishlist Integration Routes (Phase 6 Milestone 3)
const cartWishlistIntegrationRoutes = require('./cartWishlist/cartWishlistIntegration.routes');
const cartWishlistSyncRoutes = require('./cartWishlist/cartWishlistSync.routes');
const cartWishlistAnalyticsRoutes = require('./cartWishlist/cartWishlistAnalytics.routes');
const adminCartWishlistRoutes = require('./cartWishlist/adminCartWishlist.routes');
const codRoutes = require('./cod');
const adminCodRoutes = require('./admin/cod');
const emiRoutes = require('./emi');
const checkoutRoutes = require('./checkout');
const guestCheckoutRoutes = require('./guestCheckout');
const { router: paymentRoutes } = require('./payments');
const localPaymentRoutes = require('./localPayment');
const adminLocalPaymentRoutes = require('./admin/localPayment');
const adminCourierRoutes = require('./admin/courierServices');
const adminTrackingRoutes = require('./admin/tracking');
const adminNotificationsRoutes = require('./admin/notifications');
const adminInvoicesRoutes = require('./admin/invoices');
const adminOrdersRoutes = require('./admin/orders');
const adminDeliveryRoutes = require('./admin/delivery');
const orderManagementRoutes = require('./orderManagement');
const orderConfirmationRoutes = require('./orderConfirmation');
const orderTrackingRoutes = require('./orderTracking');

// Cart Analytics Routes (Phase 6 Milestone 4)
const cartAnalyticsRoutes = require('./analytics/cart');

// Cart Recovery Routes (Phase 6 Milestone 4 - Task 3)
const cartRecoveryRoutes = require('./cart/recovery');

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

// COD validation routes
router.use('/v1/cod', codRoutes);

// EMI routes
router.use('/v1/emi', emiRoutes);

// Checkout routes
router.use('/v1/checkout', checkoutRoutes);

// Guest checkout routes
router.use('/v1/guest', guestCheckoutRoutes);

// Admin COD management routes
router.use('/v1/admin/cod', adminCodRoutes);

// Admin Elasticsearch management routes
router.use('/v1/admin/elasticsearch', adminElasticsearchRoutes);

// Admin cart management routes
router.use('/v1/admin/carts', adminCartRoutes);
// Admin inventory management routes (mounted under /v1/admin/carts for inventory-impact endpoints)
router.use('/v1/admin/carts', adminInventoryRoutes);

// Admin discount management routes
router.use('/v1/admin', adminDiscountRoutes);

// Admin wishlist management routes
router.use('/v1/admin/wishlists', adminWishlistRoutes);

// Admin checkout management routes
router.use('/v1/admin/checkout', adminCheckoutRoutes);

// Admin dashboard, products, and users routes
router.use('/v1/admin/dashboard', adminDashboardRoutes);
router.use('/v1/admin/products', adminProductsRoutes);
router.use('/v1/admin/users', adminUsersRoutes);

// Cart-Wishlist Integration Routes (Phase 6 Milestone 3)
router.use('/v1', cartWishlistIntegrationRoutes);
router.use('/v1', cartWishlistSyncRoutes);
router.use('/v1', cartWishlistAnalyticsRoutes);
router.use('/v1', adminCartWishlistRoutes);

// Cart Analytics Routes (Phase 6 Milestone 4)
router.use('/v1/analytics/cart', cartAnalyticsRoutes);

// Cart Recovery Routes (Phase 6 Milestone 4 - Task 3)
router.use('/v1/cart', cartRecoveryRoutes);

// Payment Routes (Phase 7 Milestone 2 - Payment Gateway Integration)
router.use('/v1/payments', paymentRoutes);

// Local Payment Routes (Phase 7 Milestone 2 - Local Payment Methods)
router.use('/v1/local-payment', localPaymentRoutes);

// Admin Local Payment Routes (Phase 7 Milestone 2 - Admin Local Payment Management)
router.use('/v1/admin/local-payment', adminLocalPaymentRoutes);

// Admin Courier Service Routes
router.use('/v1/admin/courier-services', adminCourierRoutes);

// Admin Notifications Routes
router.use('/v1/admin/notifications', adminNotificationsRoutes);

// Admin Invoices Routes
router.use('/v1/admin/invoices', adminInvoicesRoutes);

// Admin Orders Routes
router.use('/v1/admin/orders', adminOrdersRoutes);

// Admin Delivery Routes
router.use('/v1/admin/delivery', adminDeliveryRoutes);

// Admin Tracking Routes
router.use('/v1/admin/tracking', adminTrackingRoutes);

// Order Management Routes (Phase 7 Milestone 3 - Order Processing)
router.use('/v1/orders', orderManagementRoutes);
router.use('/v1/orders', orderConfirmationRoutes);
router.use('/v1/orders', orderTrackingRoutes);

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
        corporate: '/api/v1/corporate',
        cod: '/api/v1/cod',
        emi: '/api/v1/emi',
        payments: '/api/v1/payments',
        localPayment: '/api/v1/local-payment',
        orderManagement: {
          modifications: '/api/v1/orders/:id/modifications',
          cancellations: '/api/v1/orders/:id/cancellations',
          fulfillments: '/api/v1/orders/:id/fulfillments',
          trackingEvents: '/api/v1/orders/:id/tracking-events',
          trackingTimeline: '/api/v1/orders/:id/tracking-timeline',
          notes: '/api/v1/orders/:id/notes',
          statusHistory: '/api/v1/orders/:id/status-history',
          history: '/api/v1/orders/history',
          courierServices: '/api/v1/admin/courier-services',
          reports: '/api/v1/admin/orders/reports',
          analytics: '/api/v1/admin/orders/analytics',
          bulkStatus: '/api/v1/admin/orders/bulk/status',
          bulkCancel: '/api/v1/admin/orders/bulk/cancel',
          bulkExport: '/api/v1/admin/orders/bulk/export'
        },
        orderConfirmation: {
          confirmation: '/api/v1/orders/:id/confirmation',
          confirmationView: '/api/v1/orders/:id/confirmation/view',
          sendNotification: '/api/v1/orders/:id/notifications/send',
          notifications: '/api/v1/orders/:id/notifications',
          adminNotifications: '/api/v1/admin/notifications',
          resendNotification: '/api/v1/admin/notifications/:id/resend',
          notificationStats: '/api/v1/admin/notifications/stats',
          generateInvoice: '/api/v1/orders/:id/invoices/generate',
          invoices: '/api/v1/orders/:id/invoices',
          downloadInvoice: '/api/v1/orders/:id/invoices/:invoiceId/download',
          adminInvoices: '/api/v1/admin/invoices',
          adminInvoicesStats: '/api/v1/admin/invoices/stats',
          resendInvoice: '/api/v1/admin/invoices/:invoiceId/resend',
          deleteInvoice: '/api/v1/admin/invoices/:invoiceId',
          bulkResendInvoices: '/api/v1/admin/invoices/bulk-resend',
          bulkDeleteInvoices: '/api/v1/admin/invoices/bulk-delete',
          bulkEmailInvoices: '/api/v1/admin/invoices/bulk-email',
          createShare: '/api/v1/orders/:id/share',
          accessShare: '/api/v1/orders/share/:token',
          shares: '/api/v1/orders/:id/shares',
          updateShare: '/api/v1/orders/:id/shares/:shareId',
          deleteShare: '/api/v1/orders/:id/shares/:shareId',
          updateTracking: '/api/v1/orders/:id/track',
          getTracking: '/api/v1/orders/:id/track',
          syncCourier: '/api/v1/admin/courier/:courierServiceId/sync'
        }
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
        comparisons: '/api/v1/admin/comparisons',
        cod: '/api/v1/admin/cod',
        payments: '/api/v1/admin/payments',
        gateways: '/api/v1/admin/gateways',
        localPayment: '/api/v1/admin/local-payment',
        notifications: '/api/v1/admin/notifications',
        notificationsStats: '/api/v1/admin/notifications/stats',
        resendNotification: '/api/v1/admin/notifications/:id/resend',
        bulkResendNotifications: '/api/v1/admin/notifications/bulk-resend',
        bulkDeleteNotifications: '/api/v1/admin/notifications/bulk-delete',
        invoices: '/api/v1/admin/invoices',
        invoicesStats: '/api/v1/admin/invoices/stats',
        resendInvoice: '/api/v1/admin/invoices/:invoiceId/resend',
        deleteInvoice: '/api/v1/admin/invoices/:invoiceId',
        bulkResendInvoices: '/api/v1/admin/invoices/bulk-resend',
        bulkDeleteInvoices: '/api/v1/admin/invoices/bulk-delete',
        bulkEmailInvoices: '/api/v1/admin/invoices/bulk-email',
        orders: '/api/v1/admin/orders',
        ordersSharing: '/api/v1/admin/orders/sharing',
        ordersSharingStats: '/api/v1/admin/orders/sharing/stats',
        ordersSharingDisable: '/api/v1/admin/orders/sharing/:shareId/disable',
        ordersSharingDelete: '/api/v1/admin/orders/sharing/:shareId',
        ordersSharingBulkDisable: '/api/v1/admin/orders/sharing/bulk-disable',
        ordersSharingBulkDelete: '/api/v1/admin/orders/sharing/bulk-delete',
        delivery: {
          performance: '/api/v1/admin/delivery/performance'
        }
      },
      comparisons: {
        comparisons: '/api/v1/comparisons',
        guest: '/api/v1/comparisons/guest'
      },
      cartWishlist: {
        integration: '/api/v1/cart',
        sync: '/api/v1/cart-wishlist',
        analytics: '/api/v1/cart-wishlist/analytics',
        reports: '/api/v1/cart-wishlist/reports',
        admin: '/api/v1/admin/cart-wishlist'
      },
      cartAnalytics: {
        base: '/api/v1/analytics/cart',
        events: '/api/v1/analytics/cart/events',
        dashboard: '/api/v1/analytics/cart/dashboard',
        realtime: '/api/v1/analytics/cart/realtime',
        trends: '/api/v1/analytics/cart/trends',
        recommendations: '/api/v1/analytics/cart/recommendations'
      },
      cartRecovery: {
        recover: '/api/v1/cart/recover/:token',
        abandon: '/api/v1/cart/abandon',
        stats: '/api/v1/cart/recovery/stats',
        schedule: '/api/v1/cart/recovery/schedule',
        cancel: '/api/v1/cart/recovery/cancel/:cartId',
        admin: {
          abandoned: '/api/v1/admin/carts/abandoned',
          stats: '/api/v1/admin/carts/recovery/stats',
          sendRecovery: '/api/v1/admin/carts/:cartId/send-recovery'
        }
      }
    },
    documentation: '/api-docs'
  });
});

module.exports = router;