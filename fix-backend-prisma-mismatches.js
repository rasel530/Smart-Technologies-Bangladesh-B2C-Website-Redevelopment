#!/usr/bin/env node

/**
 * Comprehensive Backend Fix Script for Prisma Schema Mismatches
 * 
 * This script fixes all backend-side issues identified in the schema mismatch analysis:
 * 1. Model name mismatches in admin orders routes
 * 2. Missing search parameter handling in orders route
 * 3. Missing date filter parameter handling in orders route
 * 4. Missing sort parameter handling in orders route
 * 5. Payment method enum validation (uppercase to lowercase)
 * 6. Missing admin endpoints for modifications and cancellations
 * 7. Missing paymentStatus in response transformation
 * 8. Variant relation name fix
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FILES_TO_FIX = [
  {
    path: 'backend/routes/admin/orders.js',
    backupPath: 'backend/routes/admin/orders.js.backup',
    fixes: [
      {
        type: 'model_name',
        description: 'Fix prisma.order to prisma.orders (line 53)',
        search: 'const matchingOrders = await prisma.order.findMany({',
        replace: 'const matchingOrders = await prisma.orders.findMany({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 95)',
        search: 'prisma.orderSharing.findMany({',
        replace: 'prisma.order_sharing.findMany({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 101)',
        search: 'prisma.orderSharing.count({ where })',
        replace: 'prisma.order_sharing.count({ where })'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.order to prisma.orders (line 106)',
        search: 'const orders = await prisma.order.findMany({',
        replace: 'const orders = await prisma.orders.findMany({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 170)',
        search: 'prisma.orderSharing.count({ where: dateFilter }),',
        replace: 'prisma.order_sharing.count({ where: dateFilter }),'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 171)',
        search: 'prisma.orderSharing.count({ \n        where: { \n          ...dateFilter,\n          isActive: true \n        } \n      }),',
        replace: 'prisma.order_sharing.count({ \n        where: { \n          ...dateFilter,\n          isActive: true \n        } \n      }),'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 177)',
        search: 'prisma.orderSharing.aggregate({',
        replace: 'prisma.order_sharing.aggregate({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 186)',
        search: 'const byType = await prisma.orderSharing.groupBy({',
        replace: 'const byType = await prisma.order_sharing.groupBy({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 211)',
        search: 'const dayShares = await prisma.orderSharing.findMany({',
        replace: 'const dayShares = await prisma.order_sharing.findMany({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 259)',
        search: 'const share = await prisma.orderSharing.findUnique({',
        replace: 'const share = await prisma.order_sharing.findUnique({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 271)',
        search: 'const updatedShare = await prisma.orderSharing.update({',
        replace: 'const updatedShare = await prisma.order_sharing.update({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 308)',
        search: 'const share = await prisma.orderSharing.findUnique({',
        replace: 'const share = await prisma.order_sharing.findUnique({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 320)',
        search: 'await prisma.orderSharing.delete({',
        replace: 'await prisma.order_sharing.delete({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 350)',
        search: 'const shares = await prisma.orderSharing.findMany({',
        replace: 'const shares = await prisma.order_sharing.findMany({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 367)',
        search: 'await prisma.orderSharing.updateMany({',
        replace: 'await prisma.order_sharing.updateMany({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 404)',
        search: 'const shares = await prisma.orderSharing.findMany({',
        replace: 'const shares = await prisma.order_sharing.findMany({'
      },
      {
        type: 'model_name',
        description: 'Fix prisma.orderSharing to prisma.order_sharing (line 421)',
        search: 'await prisma.orderSharing.deleteMany({',
        replace: 'await prisma.order_sharing.deleteMany({'
      }
    ]
  },
  {
    path: 'backend/routes/orders.js',
    backupPath: 'backend/routes/orders.js.backup',
    fixes: [
      {
        type: 'parameter_handling',
        description: 'Add search, date filter, and sort parameter handling to orders route',
        search: `router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('userId').optional().isUUID(),
  query('status').optional().isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'processing', 'refunded'])
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  // If user is not admin, only allow access to their own orders
  if (req.user.role?.toUpperCase() !== 'ADMIN') {
    req.query.userId = req.user.id;
  }
  try {
    const { page = 1, limit = 20, userId, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;`,
        replace: `router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('userId').optional().isUUID(),
  query('status').optional().isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'processing', 'refunded']),
  query('search').optional().isString(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'total', 'status', 'orderNumber']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  // If user is not admin, only allow access to their own orders
  if (req.user.role?.toUpperCase() !== 'ADMIN') {
    req.query.userId = req.user.id;
  }
  try {
    const { 
      page = 1, 
      limit = 20, 
      userId, 
      status, 
      search, 
      dateFrom, 
      dateTo, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    // Search functionality (case-insensitive)
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { users: { email: { contains: search, mode: 'insensitive' } } },
        { users: { firstName: { contains: search, mode: 'insensitive' } } },
        { users: { lastName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Dynamic sorting
    const orderBy = { [sortBy]: sortOrder };`
      },
      {
        type: 'query_update',
        description: 'Update orders query to use orderBy variable',
        search: `const [orders, total] = await Promise.all([
        prisma.orders.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            users: {
              select: { id: true, firstName: true, lastName: true, email: true }
            },
            addresses: true,
          order_items: {
            include: {
              products: {
                select: { id: true, name: true, sku: true }
              }
            }
          },
          transactions: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.orders.count({ where })
    ]);`,
        replace: `const [orders, total] = await Promise.all([
        prisma.orders.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            users: {
              select: { id: true, firstName: true, lastName: true, email: true }
            },
            addresses: true,
            order_items: {
              include: {
                products: {
                  select: { id: true, name: true, sku: true }
                }
              }
            },
            transactions: true
          },
          orderBy
        }),
        prisma.orders.count({ where })
    ]);`
      },
      {
        type: 'enum_validation',
        description: 'Fix payment method enum validation (uppercase to lowercase)',
        search: `body('paymentMethod').isIn(['CREDIT_CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'EMI', 'MCASH', 'BKASH', 'NAGAD', 'ROCKET']),`,
        replace: `body('paymentMethod').isIn(['credit_card', 'bank_transfer', 'cash_on_delivery', 'emi', 'mcash', 'bkash', 'nagad', 'rocket']),`
      },
      {
        type: 'response_transformation',
        description: 'Add paymentStatus to response transformation',
        search: `    // Transform to convert Decimal fields to numbers and include paymentDetails
    const orderWithPaymentDetails = {
      ...orderDetails,
      subtotal: parseFloat(orderDetails.subtotal?.toString() || '0'),
      tax: parseFloat(orderDetails.tax?.toString() || '0'),
      shippingCost: parseFloat(orderDetails.shippingCost?.toString() || '0'),
      discount: parseFloat(orderDetails.discount?.toString() || '0'),
      total: parseFloat(orderDetails.total?.toString() || '0'),
      items: orderDetails.items?.map(item => ({
        ...item,
        unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
        totalPrice: parseFloat(item.totalPrice?.toString() || '0'),
        price: parseFloat(item.unitPrice?.toString() || '0'), // Add 'price' for backward compatibility
        total: parseFloat(item.totalPrice?.toString() || '0') // Add 'total' for backward compatibility
      })) || [],
      paymentDetails: orderDetails.paymentDetails
    };`,
        replace: `    // Transform to convert Decimal fields to numbers and include paymentDetails
    const orderWithPaymentDetails = {
      ...orderDetails,
      subtotal: parseFloat(orderDetails.subtotal?.toString() || '0'),
      tax: parseFloat(orderDetails.tax?.toString() || '0'),
      shippingCost: parseFloat(orderDetails.shippingCost?.toString() || '0'),
      discount: parseFloat(orderDetails.discount?.toString() || '0'),
      total: parseFloat(orderDetails.total?.toString() || '0'),
      paymentStatus: orderDetails.paymentStatus || 'pending',
      items: orderDetails.items?.map(item => ({
        ...item,
        unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
        totalPrice: parseFloat(item.totalPrice?.toString() || '0'),
        price: parseFloat(item.unitPrice?.toString() || '0'), // Add 'price' for backward compatibility
        total: parseFloat(item.totalPrice?.toString() || '0') // Add 'total' for backward compatibility
      })) || [],
      paymentDetails: orderDetails.paymentDetails
    };`
      },
      {
        type: 'variant_relation',
        description: 'Fix variant relation name in include statement',
        search: `            variant: true  // FIXED: Moved to correct level (OrderItem has variant relation)`,
        replace: `            product_variants: true  // FIXED: Moved to correct level (OrderItem has product_variants relation)`
      },
      {
        type: 'admin_endpoint',
        description: 'Add admin modifications endpoint',
        search: `module.exports = router;`,
        replace: `// ============================================================================
// Admin Endpoints for Order Modifications and Cancellations
// ============================================================================

// GET /api/v1/orders/admin/modifications - Get all order modifications with filters and pagination
router.get('/admin/modifications', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('orderId').optional().isUUID(),
  query('userId').optional().isUUID(),
  query('modificationType').optional().isIn(['status_change', 'address_change', 'item_change', 'cancellation']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      orderId, 
      userId, 
      modificationType, 
      startDate, 
      endDate, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (orderId) where.orderId = orderId;
    if (userId) where.userId = userId;
    if (modificationType) where.modificationType = modificationType;

    // Date range filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orderBy = { [sortBy]: sortOrder };

    // Get order modifications (using order_history or similar table)
    const [modifications, total] = await Promise.all([
      prisma.order_history.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          orders: {
            select: { 
              id: true, 
              orderNumber: true, 
              status: true, 
              total: true 
            }
          },
          users: {
            select: { 
              id: true, 
              firstName: true, 
              lastName: true, 
              email: true 
            }
          }
        },
        orderBy
      }),
      prisma.order_history.count({ where })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: modifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('[Admin Orders] Get modifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order modifications',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/admin/cancellations - Get all order cancellations with filters and pagination
router.get('/admin/cancellations', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('orderId').optional().isUUID(),
  query('userId').optional().isUUID(),
  query('cancellationReason').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      orderId, 
      userId, 
      cancellationReason, 
      startDate, 
      endDate, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    const skip = (page - 1) * limit;

    const where = { status: 'cancelled' };
    if (orderId) where.id = orderId;
    if (userId) where.userId = userId;

    // Date range filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orderBy = { [sortBy]: sortOrder };

    // Get cancelled orders
    const [cancellations, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          users: {
            select: { 
              id: true, 
              firstName: true, 
              lastName: true, 
              email: true 
            }
          },
          addresses: true,
          order_items: {
            include: {
              products: {
                select: { id: true, name: true, sku: true }
              }
            }
          }
        },
        orderBy
      }),
      prisma.orders.count({ where })
    ]);

    // Filter by cancellation reason if provided
    let filteredCancellations = cancellations;
    if (cancellationReason) {
      filteredCancellations = cancellations.filter(order => {
        const paymentDetails = order.paymentDetails || {};
        return paymentDetails.cancellationReason?.toLowerCase().includes(cancellationReason.toLowerCase());
      });
    }

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: filteredCancellations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('[Admin Orders] Get cancellations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order cancellations',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;`
      }
    ]
  }
];

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function createBackup(filePath, backupPath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
      log(`Created backup: ${backupPath}`, 'success');
      return true;
    }
    log(`File not found for backup: ${filePath}`, 'error');
    return false;
  } catch (error) {
    log(`Failed to create backup for ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

function applyFixes(filePath, fixes) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log(`Failed to read file ${filePath}: ${error.message}`, 'error');
    return { success: false, applied: 0, failed: 0 };
  }

  let applied = 0;
  let failed = 0;
  let modifiedContent = content;

  for (const fix of fixes) {
    try {
      if (modifiedContent.includes(fix.search)) {
        modifiedContent = modifiedContent.replace(fix.search, fix.replace);
        applied++;
        log(`✓ Applied: ${fix.description}`, 'success');
      } else {
        failed++;
        log(`✗ Skipped: ${fix.description} (pattern not found)`, 'warning');
      }
    } catch (error) {
      failed++;
      log(`✗ Failed: ${fix.description} - ${error.message}`, 'error');
    }
  }

  // Write modified content back to file
  if (applied > 0) {
    try {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      log(`Updated file: ${filePath} (${applied} fixes applied)`, 'success');
    } catch (error) {
      log(`Failed to write file ${filePath}: ${error.message}`, 'error');
      return { success: false, applied, failed };
    }
  }

  return { success: true, applied, failed };
}

function verifyFixes(filePath, fixes) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let verified = 0;
    let notFound = 0;

    for (const fix of fixes) {
      if (content.includes(fix.replace)) {
        verified++;
      } else {
        notFound++;
        log(`⚠ Verification failed: ${fix.description}`, 'warning');
      }
    }

    return { verified, notFound };
  } catch (error) {
    log(`Failed to verify fixes in ${filePath}: ${error.message}`, 'error');
    return { verified: 0, notFound: fixes.length };
  }
}

// Main execution
async function main() {
  log('='.repeat(80), 'info');
  log('COMPREHENSIVE BACKEND PRISMA MISMATCH FIX SCRIPT', 'info');
  log('='.repeat(80), 'info');
  log('', 'info');

  let totalApplied = 0;
  let totalFailed = 0;
  let totalVerified = 0;
  let totalNotFound = 0;

  for (const fileConfig of FILES_TO_FIX) {
    log(`\nProcessing: ${fileConfig.path}`, 'info');
    log('-'.repeat(80), 'info');

    // Create backup
    const backupCreated = createBackup(fileConfig.path, fileConfig.backupPath);
    if (!backupCreated) {
      log(`Skipping ${fileConfig.path} due to backup failure`, 'error');
      continue;
    }

    // Apply fixes
    const result = applyFixes(fileConfig.path, fileConfig.fixes);
    totalApplied += result.applied;
    totalFailed += result.failed;

    // Verify fixes
    if (result.success && result.applied > 0) {
      log('\nVerifying fixes...', 'info');
      const verification = verifyFixes(fileConfig.path, fileConfig.fixes);
      totalVerified += verification.verified;
      totalNotFound += verification.notFound;
    }

    log('', 'info');
  }

  // Summary
  log('='.repeat(80), 'info');
  log('SUMMARY', 'info');
  log('='.repeat(80), 'info');
  log(`Total fixes applied: ${totalApplied}`, totalApplied > 0 ? 'success' : 'warning');
  log(`Total fixes failed: ${totalFailed}`, totalFailed > 0 ? 'error' : 'info');
  log(`Total fixes verified: ${totalVerified}`, 'info');
  log(`Total fixes not found: ${totalNotFound}`, totalNotFound > 0 ? 'warning' : 'info');
  log('', 'info');

  if (totalApplied > 0) {
    log('✓ Backend fixes completed successfully!', 'success');
    log('', 'info');
    log('Next steps:', 'info');
    log('1. Review the changes in the modified files', 'info');
    log('2. Test the application to ensure everything works correctly', 'info');
    log('3. If issues occur, restore from backups:', 'info');
    log('   - backend/routes/admin/orders.js.backup', 'info');
    log('   - backend/routes/orders.js.backup', 'info');
    log('', 'info');
    log('To restore from backup:', 'info');
    log('  cp backend/routes/admin/orders.js.backup backend/routes/admin/orders.js', 'info');
    log('  cp backend/routes/orders.js.backup backend/routes/orders.js', 'info');
  } else {
    log('⚠ No fixes were applied. Please check if the files exist and contain the expected patterns.', 'warning');
  }

  log('='.repeat(80), 'info');
}

// Run the script
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
