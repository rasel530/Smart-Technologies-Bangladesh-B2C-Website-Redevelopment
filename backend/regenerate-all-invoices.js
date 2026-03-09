/**
 * Regenerate all existing invoices with fixed PDF generation code
 * This will replace old invoices (with garbled text) with new ones (with BDT currency)
 */

const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');

const prisma = new PrismaClient();

/**
 * Generate PDF invoice (same as in orderConfirmation.js)
 */
async function generateInvoicePDF(order, invoiceNumber) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      // Event handlers for PDF generation
      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          console.log(`[Invoice PDF] Generated PDF buffer size: ${pdfBuffer.length} bytes`);
          resolve(pdfBuffer);
        } catch (error) {
          console.error('[Invoice PDF] Error concatenating PDF chunks:', error);
          reject(error);
        }
      });

      doc.on('error', (error) => {
        console.error('[Invoice PDF] PDF generation error:', error);
        reject(error);
      });

      // Define colors
      const primaryColor = '#2563eb';
      const secondaryColor = '#64748b';
      const borderColor = '#e2e8f0';

      // ========== HEADER SECTION ==========
      // Draw header background
      doc.rect(0, 0, 595.28, 100).fill(primaryColor);
      
      // Company header (white text on blue background)
      doc.fillColor('#ffffff')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Smart Technologies Bangladesh', { align: 'center' });
      doc.fontSize(12)
        .font('Helvetica')
        .text('Your Trusted Technology Partner', { align: 'center' });
      
      // Invoice info on header
      doc.fontSize(10)
        .text(`Invoice #${invoiceNumber}`, 50, 70, { width: 200 });
      doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 85, { width: 200 });
      
      doc.text('PAID INVOICE', 345, 70, { width: 200, align: 'right' })
        .fontSize(8)
        .text(`Order #${order.orderNumber}`, 345, 85, { width: 200, align: 'right' });

      // Reset fill color
      doc.fillColor('#000000');

      // ========== BILL TO & SHIP TO SECTION ==========
      doc.moveDown(2);
      
      // Draw section divider
      doc.strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545.28, doc.y)
        .stroke();
      
      doc.moveDown();

      // Left column - Bill To
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('BILL TO', 50, doc.y);
      
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000');
      
      const billToY = doc.y + 15;
      if (order.user) {
        doc.text(`${order.user.firstName} ${order.user.lastName}`, 50, billToY);
        doc.text(order.user.email || '', 50, doc.y + 5);
        if (order.user.phone) {
          doc.text(order.user.phone, 50, doc.y + 5);
        }
      } else {
        doc.text(`${order.address.firstName} ${order.address.lastName}`, 50, billToY);
        if (order.address.email) {
          doc.text(order.address.email, 50, doc.y + 5);
        }
        if (order.address.phone) {
          doc.text(order.address.phone, 50, doc.y + 5);
        }
      }

      // Right column - Ship To
      const shipToY = billToY;
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('SHIP TO', 320, shipToY - 15);
      
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(`${order.address.firstName} ${order.address.lastName}`, 320, shipToY);
      
      const shipAddressY = doc.y + 5;
      doc.text(order.address.address, 320, shipAddressY);
      if (order.address.addressLine2) {
        doc.text(order.address.addressLine2, 320, doc.y + 5);
      }
      doc.text(`${order.address.city}, ${order.address.district}`, 320, doc.y + 5);
      if (order.address.postalCode) {
        doc.text(order.address.postalCode, 320, doc.y + 5);
      }
      doc.text(order.address.division, 320, doc.y + 5);

      // ========== ITEMS TABLE SECTION ==========
      doc.moveDown(3);
      
      // Draw table header background
      const tableY = doc.y;
      doc.rect(50, tableY, 495.28, 30).fill('#f1f5f9');
      
      // Table headers
      doc.fillColor('#1e293b')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('DESCRIPTION', 55, tableY + 10, { width: 250 });
      doc.text('QTY', 310, tableY + 10, { width: 50 });
      doc.text('UNIT PRICE', 365, tableY + 10, { width: 70, align: 'right' });
      doc.text('TOTAL', 440, tableY + 10, { width: 100, align: 'right' });
      
      // Draw table header border
      doc.strokeColor(borderColor)
        .lineWidth(0.5)
        .rect(50, tableY, 495.28, 30)
        .stroke();
      
      // Items
      doc.fillColor('#000000')
        .fontSize(10)
        .font('Helvetica');
      
      let itemY = tableY + 40;
      order.items.forEach((item, index) => {
        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(50, itemY - 5, 495.28, 25).fill('#f8fafc');
        }
        
        const productName = item.product.name + (item.variant ? ` (${item.variant.name})` : '');
        const unitPrice = parseFloat(item.unitPrice).toFixed(2);
        const totalPrice = parseFloat(item.totalPrice).toFixed(2);
        
        doc.text(productName, 55, itemY, { width: 250 });
        doc.text(item.quantity.toString(), 310, itemY, { width: 50 });
        doc.text(`BDT ${unitPrice}`, 365, itemY, { width: 70, align: 'right' });
        doc.text(`BDT ${totalPrice}`, 440, itemY, { width: 100, align: 'right' });
        
        // Draw row border
        doc.strokeColor(borderColor)
          .lineWidth(0.5)
          .moveTo(50, itemY + 20)
          .lineTo(545.28, itemY + 20)
          .stroke();
        
        itemY += 25;
      });
      
      // Draw table border
      doc.strokeColor(borderColor)
        .lineWidth(1)
        .rect(50, tableY, 495.28, itemY - tableY)
        .stroke();

      // ========== TOTALS SECTION ==========
      doc.moveDown(2);
      
      const totalsStartY = doc.y;
      const totalsX = 320;
      const lineHeight = 22;
      
      const subtotal = parseFloat(order.subtotal).toFixed(2);
      const tax = parseFloat(order.tax).toFixed(2);
      const shipping = parseFloat(order.shippingCost).toFixed(2);
      const discount = parseFloat(order.discount).toFixed(2);
      const total = parseFloat(order.total).toFixed(2);
      
      // Subtotal
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Subtotal', totalsX, totalsStartY);
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(`BDT ${subtotal}`, 440, totalsStartY, { width: 100, align: 'right' });
      
      // Tax
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Tax', totalsX, totalsStartY + lineHeight);
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(`BDT ${tax}`, 440, totalsStartY + lineHeight, { width: 100, align: 'right' });
      
      // Shipping
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Shipping', totalsX, totalsStartY + lineHeight * 2);
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(`BDT ${shipping}`, 440, totalsStartY + lineHeight * 2, { width: 100, align: 'right' });
      
      // Discount
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Discount', totalsX, totalsStartY + lineHeight * 3);
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#16a34a')
        .text(`-BDT ${discount}`, 440, totalsStartY + lineHeight * 3, { width: 100, align: 'right' });
      
      // Total
      doc.moveDown();
      const totalY = doc.y;
      doc.rect(320, totalY - 5, 225.28, 35).fill(primaryColor);
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('TOTAL', 335, totalY + 5);
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text(`BDT ${total}`, 440, totalY + 2, { width: 100, align: 'right' });

      // ========== PAYMENT INFO SECTION ==========
      doc.moveDown(2);
      
      doc.strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545.28, doc.y)
        .stroke();
      
      doc.moveDown();
      
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('PAYMENT INFORMATION', 50, doc.y);
      
      doc.moveDown(0.5);
      
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Payment Method:', 50, doc.y);
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(order.paymentMethod.replace('_', ' ').toUpperCase(), 150, doc.y);
      
      doc.moveDown(0.5);
      
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Payment Status:', 50, doc.y);
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(order.paymentStatus === 'paid' ? '#16a34a' : '#dc2626')
        .text(order.paymentStatus.toUpperCase(), 150, doc.y);

      // ========== TERMS & CONDITIONS SECTION ==========
      doc.moveDown(2);
      
      doc.strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545.28, doc.y)
        .stroke();
      
      doc.moveDown();
      
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('TERMS & CONDITIONS', 50, doc.y);
      
      doc.moveDown(0.5);
      
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('1. All prices are in Bangladeshi Taka (BDT).', 50, doc.y);
      doc.text('2. Payment is due upon receipt of invoice.', 50, doc.y + 5);
      doc.text('3. Please quote invoice number in all correspondence.', 50, doc.y + 5);
      doc.text('4. Goods once sold will not be taken back.', 50, doc.y + 5);
      doc.text('5. For any queries, please contact our customer support.', 50, doc.y + 5);

      // ========== FOOTER SECTION ==========
      doc.moveDown(3);
      
      // Draw footer background
      const footerY = doc.y;
      doc.rect(0, footerY, 595.28, 60).fill('#f1f5f9');
      
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('Thank you for your business!', { align: 'center' });
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Smart Technologies Bangladesh', { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.text('For support, contact us at support@smarttechbd.com', { align: 'center' });

      // Finalize the PDF document
      doc.end();
    } catch (error) {
      console.error('[Invoice PDF] Error during PDF creation:', error);
      reject(error);
    }
  });
}

async function regenerateAllInvoices() {
  console.log('='.repeat(80));
  console.log('REGENERATING ALL INVOICES WITH FIXED PDF GENERATION');
  console.log('='.repeat(80));
  
  try {
    // Get all invoices
    const invoices = await prisma.orderInvoice.findMany();

    console.log(`\n📊 Found ${invoices.length} invoices to regenerate\n`);

    if (invoices.length === 0) {
      console.log('✓ No invoices found to regenerate');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const invoice of invoices) {
      try {
        console.log(`\n🔄 Regenerating invoice: ${invoice.invoiceNumber}`);
        console.log(`   Invoice ID: ${invoice.id}`);
        console.log(`   Order ID: ${invoice.orderId}`);
        
        // Get order data for this invoice
        const order = await prisma.order.findUnique({
          where: { id: invoice.orderId },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            },
            address: true,
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true
                  }
                },
                variant: {
                  select: {
                    id: true,
                    name: true,
                    sku: true
                  }
                }
              }
            }
          }
        });

        if (!order) {
          console.log(`   ❌ Order not found for invoice ${invoice.invoiceNumber}`);
          failCount++;
          continue;
        }

        console.log(`   Order: ${order.orderNumber}`);
        console.log(`   Items: ${order.items.length}`);
        
        // Generate new PDF with fixed code
        console.log(`   Passing order to PDF generator...`);
        console.log(`   Order object type: ${typeof order}`);
        console.log(`   Order exists: ${!!order}`);
        console.log(`   Order has orderNumber: ${!!order?.orderNumber}`);
        
        const pdfBuffer = await generateInvoicePDF(invoice.order, invoice.invoiceNumber);
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
          console.log(`   ❌ Failed to generate PDF`);
          failCount++;
          continue;
        }
        
        // Update invoice with new PDF
        await prisma.orderInvoice.update({
          where: { id: invoice.id },
          data: {
            pdfData: pdfBuffer,
            generatedAt: new Date()
          }
        });
        
        console.log(`   ✓ PDF regenerated successfully (${pdfBuffer.length} bytes)`);
        successCount++;
        
      } catch (error) {
        console.error(`   ❌ Error regenerating invoice ${invoice.invoiceNumber}:`, error.message);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ REGENERATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Total invoices: ${invoices.length}`);
    console.log(`   Successfully regenerated: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`\n✓ All invoices now use BDT currency instead of Bengali Taka symbol`);
    console.log(`✓ PDFs should display correctly without garbled text`);
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error regenerating invoices:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run regeneration
regenerateAllInvoices();
