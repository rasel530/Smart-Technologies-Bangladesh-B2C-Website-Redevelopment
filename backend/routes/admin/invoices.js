const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { databaseService } = require('../../services/database');
const { authMiddleware } = require('../../middleware/auth');

const router = express.Router();

// Get Prisma client - will auto-connect if needed
let prisma;
try {
  prisma = databaseService.getClient();
} catch (error) {
  console.error('[Admin Invoices] Failed to get Prisma client:', error);
  throw new Error('Database initialization failed');
}

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// GET /api/v1/admin/invoices - Get paginated list of invoices with filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('orderId').optional().isString(),
  query('status').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      orderId, 
      status, 
      startDate, 
      endDate 
    } = req.query;

    const where = {};

    // Filter by order ID or order number
    if (orderId) {
      // Try to match as UUID first
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(orderId)) {
        where.order_id = orderId;
      } else {
        // Search by order number instead
        where.order = {
          orderNumber: {
            contains: orderId,
            mode: 'insensitive'
          }
        };
      }
    }

    // Filter by date range
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.created_at.lte = new Date(endDate);
      }
    }

    // Filter by status
    if (status) {
      if (status === 'draft') {
        where.sent_at = null;
      } else if (status === 'sent') {
        where.sent_at = { not: null };
      }
    }

    // Get total count
    const total = await prisma.order_invoices.count({ where });

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Fetch invoices
    const invoices = await prisma.order_invoices.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' }
    });

    // Fetch related orders
    const orderIds = invoices.map(inv => inv.order_id);
    const orders = await prisma.orders.findMany({
      where: { id: { in: orderIds } },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    // Create a map for quick lookup
    const orderMap = new Map(orders.map(o => [o.id, o]));

    const totalPages = Math.ceil(total / parseInt(limit));

    // Map backend data to frontend expectations
    const mappedInvoices = invoices.map(invoice => {
      const order = orderMap.get(invoice.order_id);
      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        order_id: invoice.order_id,
        orderNumber: order?.orderNumber,
        invoiceDate: invoice.generated_at.toISOString(),
        dueDate: invoice.generated_at.toISOString(), // Use generated_at as dueDate
        subtotal: parseFloat(order?.subtotal) || 0,
        tax: parseFloat(order?.tax) || 0,
        discount: parseFloat(order?.discount) || 0,
        total: parseFloat(order?.total) || 0,
        currency: 'BDT',
        status: invoice.sent_at ? 'sent' : 'draft',
        pdfUrl: invoice.invoice_url,
        downloadUrl: invoice.invoice_url,
        sent_at: invoice.sent_at?.toISOString(),
        paidAt: order?.paidAt?.toISOString(),
        customer: order?.users ? {
          id: order.users.id,
          firstName: order.users.firstName,
          lastName: order.users.lastName,
          email: order.users.email,
          phone: order.users.phone
        } : null,
        createdAt: invoice.created_at.toISOString(),
        updatedAt: invoice.updated_at.toISOString()
      };
    });

    res.json({
      success: true,
      invoices: mappedInvoices,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages
    });

  } catch (error) {
    console.error('[Admin Invoices] Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/invoices/stats - Get invoice statistics
router.get('/stats', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.created_at = {};
      if (startDate) {
        dateFilter.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.created_at.lte = new Date(endDate);
      }
    }

    // Get total counts
    const [totalInvoices, sentInvoices, unsentInvoices] = await Promise.all([
      prisma.order_invoices.count({ where: dateFilter }),
      prisma.order_invoices.count({ 
        where: { 
          ...dateFilter,
          sent_at: { not: null } 
        } 
      }),
      prisma.order_invoices.count({ 
        where: { 
          ...dateFilter,
          sent_at: null 
        } 
      })
    ]);

    // Fetch invoices with order totals
    const invoices = await prisma.order_invoices.findMany({
      where: dateFilter
    });

    // Fetch orders for total calculation
    const orderIds = invoices.map(inv => inv.order_id);
    const orders = await prisma.orders.findMany({
      where: { id: { in: orderIds } },
      select: { total: true }
    });

    const orderMap = new Map(orders.map(o => [o.id, o.total]));

    // Calculate total amount
    const totalAmount = invoices.reduce((sum, invoice) => {
      const orderTotal = orderMap.get(invoice.order_id);
      return sum + (orderTotal ? parseFloat(orderTotal) : 0);
    }, 0);

    // Generate overTime array with daily statistics for last 7 days
    const overTime = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Get invoices for this day
      const dayInvoices = await prisma.order_invoices.findMany({
        where: {
          created_at: {
            gte: new Date(dateStr + 'T00:00:00.000Z'),
            lt: new Date(dateStr + 'T23:59:59.999Z')
          }
        }
      });

      // Fetch orders for this day
      const dayorderIds = dayInvoices.map(inv => inv.order_id);
      const dayOrders = await prisma.orders.findMany({
        where: { id: { in: dayorderIds } },
        select: { total: true }
      });

      const dayOrderMap = new Map(dayOrders.map(o => [o.id, o.total]));

      const dayGenerated = dayInvoices.length;
      const dayAmount = dayInvoices.reduce((sum, invoice) => {
        const orderTotal = dayOrderMap.get(invoice.order_id);
        return sum + (orderTotal ? parseFloat(orderTotal) : 0);
      }, 0);

      overTime.push({
        date: dateStr,
        generated: dayGenerated,
        amount: dayAmount
      });
    }

    // Get byStatus counts
    const byStatus = {
      draft: unsentInvoices,
      sent: sentInvoices
    };

    res.json({
      success: true,
      data: {
        totalGenerated: totalInvoices,
        totalAmount,
        byStatus,
        overTime
      }
    });

  } catch (error) {
    console.error('[Admin Invoices] Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/invoices/:invoiceId/resend - Resend an invoice
router.post('/:invoiceId/resend', [
  param('invoiceId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Check if invoice exists
    const invoice = await prisma.order_invoices.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Fetch related order
    const order = await prisma.orders.findUnique({
      where: { id: invoice.order_id },
      include: {
        users: true
      }
    });

    // Update invoice with resend information
    const updatedInvoice = await prisma.order_invoices.update({
      where: { id: invoiceId },
      data: {
        sent_at: new Date(),
        metadata: {
          ...invoice.metadata,
          resent_at: new Date().toISOString(),
          resentBy: req.user.id,
          resentByEmail: req.user.email
        }
      }
    });

    // Create a notification record for resend
    if (order?.user?.email) {
      await prisma.order_notifications.create({
        data: {
          order_id: invoice.order_id,
          user_id: order.userId,
          notification_type: 'invoice_generated',
          channel: 'email',
          recipient: order.users.email,
          subject: `Invoice ${invoice.invoice_number} - Resent`,
          message: `Your invoice ${invoice.invoice_number} has been resent.`,
          status: 'sent',
          sent_at: new Date(),
          metadata: {
            invoiceId: invoice.id,
            invoice_number: invoice.invoice_number,
            resent: true
          }
        }
      });
    }

    console.log(`[Admin Invoices] Invoice resent: ${invoiceId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Invoice resent successfully',
      invoiceId
    });

  } catch (error) {
    console.error('[Admin Invoices] Resend invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend invoice',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/invoices/:invoiceId/email - Email a single invoice
router.post('/:invoiceId/email', [
  param('invoiceId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Check if invoice exists
    const invoice = await prisma.order_invoices.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Fetch related order
    const order = await prisma.orders.findUnique({
      where: { id: invoice.order_id },
      include: {
        users: true
      }
    });

    // Update invoice sent timestamp
    await prisma.order_invoices.update({
      where: { id: invoiceId },
      data: {
        sent_at: new Date(),
        metadata: {
          ...invoice.metadata,
          emailedAt: new Date().toISOString(),
          emailedBy: req.user.id,
          emailedByEmail: req.user.email
        }
      }
    });

    // Create notification record
    if (order?.user?.email) {
      await prisma.order_notifications.create({
        data: {
          order_id: invoice.order_id,
          user_id: order.userId,
          notification_type: 'invoice_generated',
          channel: 'email',
          recipient: order.users.email,
          subject: `Invoice ${invoice.invoice_number}`,
          message: `Please find attached your invoice ${invoice.invoice_number}.`,
          status: 'sent',
          sent_at: new Date(),
          metadata: {
            invoiceId: invoice.id,
            invoice_number: invoice.invoice_number
          }
        }
      });
    }

    console.log(`[Admin Invoices] Invoice emailed: ${invoiceId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Invoice emailed successfully',
      invoiceId
    });

  } catch (error) {
    console.error('[Admin Invoices] Email invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to email invoice',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/admin/invoices/:invoiceId - Delete an invoice (soft delete)
router.delete('/:invoiceId', [
  param('invoiceId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Check if invoice exists
    const invoice = await prisma.order_invoices.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Soft delete by updating metadata
    await prisma.order_invoices.update({
      where: { id: invoiceId },
      data: {
        metadata: {
          ...invoice.metadata,
          deletedAt: new Date().toISOString(),
          deletedBy: req.user.id,
          deletedByEmail: req.user.email
        }
      }
    });

    console.log(`[Admin Invoices] Invoice deleted: ${invoiceId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('[Admin Invoices] Delete invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete invoice',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/invoices/bulk-resend - Bulk resend invoices
router.post('/bulk-resend', [
  body('invoiceIds').isArray({ min: 1 }),
  body('invoiceIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { invoiceIds } = req.body;

    // Check which invoices exist
    const invoices = await prisma.order_invoices.findMany({
      where: {
        id: { in: invoiceIds }
      }
    });

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No invoices found'
      });
    }

    const validIds = invoices.map(i => i.id);
    const invalidIds = invoiceIds.filter(id => !validIds.includes(id));

    // Fetch related orders
    const orderIds = invoices.map(i => i.order_id);
    const orders = await prisma.orders.findMany({
      where: { id: { in: orderIds } },
      include: {
        users: true
      }
    });

    const orderMap = new Map(orders.map(o => [o.id, o]));

    // Update all valid invoices
    const updatePromises = invoices.map(async (invoice) => {
      const order = orderMap.get(invoice.order_id);

      // Update invoice
      await prisma.order_invoices.update({
        where: { id: invoice.id },
        data: {
          sent_at: new Date(),
          metadata: {
            ...invoice.metadata,
            resent_at: new Date().toISOString(),
            resentBy: req.user.id,
            resentByEmail: req.user.email
          }
        }
      });

      // Create notification record
      if (order?.user?.email) {
        await prisma.order_notifications.create({
          data: {
            order_id: invoice.order_id,
            user_id: order.userId,
            notification_type: 'invoice_generated',
            channel: 'email',
            recipient: order.users.email,
            subject: `Invoice ${invoice.invoice_number} - Resent`,
            message: `Your invoice ${invoice.invoice_number} has been resent.`,
            status: 'sent',
            sent_at: new Date(),
            metadata: {
              invoiceId: invoice.id,
              invoice_number: invoice.invoice_number,
              resent: true
            }
          }
        });
      }
    });

    await Promise.all(updatePromises);

    console.log(`[Admin Invoices] Bulk resent ${validIds.length} invoices by ${req.user.email}`);

    res.json({
      success: true,
      message: `${validIds.length} invoices resent successfully`,
      resentCount: validIds.length,
      invalidIds
    });

  } catch (error) {
    console.error('[Admin Invoices] Bulk resend error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk resend invoices',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/admin/invoices/bulk-delete - Bulk delete invoices (soft delete)
router.delete('/bulk-delete', [
  body('invoiceIds').isArray({ min: 1 }),
  body('invoiceIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { invoiceIds } = req.body;

    // Check which invoices exist
    const invoices = await prisma.order_invoices.findMany({
      where: {
        id: { in: invoiceIds }
      }
    });

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No invoices found'
      });
    }

    const validIds = invoices.map(i => i.id);
    const invalidIds = invoiceIds.filter(id => !validIds.includes(id));

    // Soft delete all valid invoices
    await prisma.order_invoices.updateMany({
      where: {
        id: { in: validIds }
      },
      data: {
        metadata: {
          deletedAt: new Date().toISOString(),
          deletedBy: req.user.id,
          deletedByEmail: req.user.email
        }
      }
    });

    console.log(`[Admin Invoices] Bulk deleted ${validIds.length} invoices by ${req.user.email}`);

    res.json({
      success: true,
      message: `${validIds.length} invoices deleted successfully`,
      deletedCount: validIds.length,
      invalidIds
    });

  } catch (error) {
    console.error('[Admin Invoices] Bulk delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk delete invoices',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/invoices/bulk-email - Bulk email invoices to customers
router.post('/bulk-email', [
  body('invoiceIds').isArray({ min: 1 }),
  body('invoiceIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { invoiceIds } = req.body;

    // Check which invoices exist
    const invoices = await prisma.order_invoices.findMany({
      where: {
        id: { in: invoiceIds }
      }
    });

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No invoices found'
      });
    }

    const validIds = invoices.map(i => i.id);
    const invalidIds = invoiceIds.filter(id => !validIds.includes(id));

    // Fetch related orders
    const orderIds = invoices.map(i => i.order_id);
    const orders = await prisma.orders.findMany({
      where: { id: { in: orderIds } },
      include: {
        users: true
      }
    });

    const orderMap = new Map(orders.map(o => [o.id, o]));

    // Email all valid invoices
    const emailPromises = invoices.map(async (invoice) => {
      const order = orderMap.get(invoice.order_id);

      // Update invoice sent timestamp
      await prisma.order_invoices.update({
        where: { id: invoice.id },
        data: {
          sent_at: new Date(),
          metadata: {
            ...invoice.metadata,
            emailedAt: new Date().toISOString(),
            emailedBy: req.user.id,
            emailedByEmail: req.user.email
          }
        }
      });

      // Create notification record
      if (order?.user?.email) {
        await prisma.order_notifications.create({
          data: {
            order_id: invoice.order_id,
            user_id: order.userId,
            notification_type: 'invoice_generated',
            channel: 'email',
            recipient: order.users.email,
            subject: `Invoice ${invoice.invoice_number}`,
            message: `Please find attached your invoice ${invoice.invoice_number}.`,
            status: 'sent',
            sent_at: new Date(),
            metadata: {
              invoiceId: invoice.id,
              invoice_number: invoice.invoice_number,
              bulkEmail: true
            }
          }
        });
      }
    });

    await Promise.all(emailPromises);

    console.log(`[Admin Invoices] Bulk emailed ${validIds.length} invoices by ${req.user.email}`);

    res.json({
      success: true,
      message: `${validIds.length} invoices emailed successfully`,
      emailedCount: validIds.length,
      invalidIds
    });

  } catch (error) {
    console.error('[Admin Invoices] Bulk email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk email invoices',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/invoices/bulk-download - Bulk download invoices as ZIP
router.post('/bulk-download', [
  body('invoiceIds').isArray({ min: 1 }),
  body('invoiceIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  const { invoiceIds } = req.body;
  
  try {
    // Fetch invoices
    const invoices = await prisma.order_invoices.findMany({
      where: {
        id: { in: invoiceIds },
        deletedAt: null
      },
      select: {
        id: true,
        invoice_number: true,
        pdfData: true,
        orderId: true
      }
    });
    
    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No invoices found'
      });
    }
    
    // Create ZIP file
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="invoices-${Date.now()}.zip"`);
    
    // Pipe archive to response
    archive.pipe(res);
    
    // Add each invoice PDF to the ZIP
    let pdfCount = 0;
    for (const invoice of invoices) {
      if (invoice.pdfData) {
        try {
          // Convert binary data to buffer
          const pdfBuffer = Buffer.from(invoice.pdfData);
          archive.append(pdfBuffer, { name: `${invoice.invoice_number}.pdf` });
          pdfCount++;
        } catch (error) {
          console.error(`[Admin Invoices] Failed to add invoice ${invoice.invoice_number} to archive:`, error);
        }
      } else {
        console.warn(`[Admin Invoices] No PDF data found for invoice ${invoice.invoice_number}`);
      }
    }

    if (pdfCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'No PDF data found for any of the selected invoices'
      });
    }
    
    // Finalize archive
    await archive.finalize();
    
  } catch (error) {
    console.error('[Admin Invoices] Bulk download error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to download invoices'
      });
    }
  }
});

module.exports = router;
