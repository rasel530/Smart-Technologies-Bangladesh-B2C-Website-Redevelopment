const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testPDFGeneration() {
  console.log('==========================================');
  console.log('PDF Generation Debug Test');
  console.log('==========================================\n');

  try {
    // Find an order with items
    const order = await prisma.order.findFirst({
      where: {
        items: {
          some: {}
        }
      },
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
      console.log('No orders found with items. Exiting.');
      return;
    }

    console.log('Order found:');
    console.log(`  Order Number: ${order.orderNumber}`);
    console.log(`  Order ID: ${order.id}`);
    console.log(`  Number of items: ${order.items.length}`);
    console.log();

    // Log order items
    console.log('Order Items:');
    order.items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.product.name}`);
      console.log(`     SKU: ${item.product.sku}`);
      console.log(`     Variant: ${item.variant?.name || 'N/A'}`);
      console.log(`     Quantity: ${item.quantity}`);
      console.log(`     Unit Price: ${item.unitPrice}`);
      console.log(`     Total Price: ${item.totalPrice}`);
      console.log();
    });

    // Generate invoice number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const invoiceNumber = `INV${year}${month}${random}-${order.orderNumber}`;

    console.log(`Invoice Number: ${invoiceNumber}`);
    console.log();
    console.log('==========================================');
    console.log('Generating PDF...');
    console.log('==========================================\n');

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(order, invoiceNumber);

    console.log(`\nPDF generated successfully!`);
    console.log(`PDF buffer size: ${pdfBuffer.length} bytes`);

    // Save PDF to file
    const outputPath = path.join(__dirname, `test-invoice-${order.orderNumber}.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`PDF saved to: ${outputPath}`);

    console.log('\n==========================================');
    console.log('Test completed successfully!');
    console.log('==========================================');

  } catch (error) {
    console.error('Error during PDF generation test:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

async function generateInvoicePDF(order, invoiceNumber) {
  console.log(`[Invoice PDF] ============================================`);
  console.log(`[Invoice PDF] Starting PDF generation`);
  console.log(`[Invoice PDF] Invoice Number: ${invoiceNumber}`);
  console.log(`[Invoice PDF] Order Number: ${order.orderNumber}`);
  console.log(`[Invoice PDF] Order ID: ${order.id}`);
  console.log(`[Invoice PDF] Number of items: ${order.items ? order.items.length : 0}`);
  console.log(`[Invoice PDF] ============================================`);

  return new Promise((resolve, reject) => {
    try {
      // Create PDF document with explicit font settings
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        font: 'Helvetica'  // Set default font
      });

      // Log available fonts
      console.log(`[Invoice PDF] PDFKit version: ${PDFDocument.version}`);
      console.log(`[Invoice PDF] Default font set to: Helvetica`);

      const chunks = [];

      // Event handlers for PDF generation
      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          console.log(`[Invoice PDF] Generated PDF buffer size: ${pdfBuffer.length} bytes`);
          console.log(`[Invoice PDF] PDF generation completed successfully`);
          console.log(`[Invoice PDF] ============================================`);
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

      console.log(`[Invoice PDF] PDFKit document created`);
      console.log(`[Invoice PDF] Colors defined: primary=${primaryColor}, secondary=${secondaryColor}, border=${borderColor}`);

      // ========== HEADER SECTION ==========
      // Draw header background
      doc.rect(0, 0, 595.28, 100).fill(primaryColor);

      // Company header (white text on blue background) - positioned at top of header
      doc.fillColor('#ffffff')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Smart Technologies Bangladesh', 50, 25, { align: 'center', width: 495.28 });
      doc.fontSize(12)
        .font('Helvetica')
        .text('Your Trusted Technology Partner', 50, 52, { align: 'center', width: 495.28 });

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
      console.log(`[Invoice PDF] Starting items table section`);
      doc.moveDown(3);

      // Draw table header background
      const tableY = doc.y;
      console.log(`[Invoice PDF] Table Y position: ${tableY}`);
      doc.rect(50, tableY, 495.28, 30).fill('#f1f5f9');

      // Table headers
      console.log(`[Invoice PDF] Writing table headers`);
      doc.fillColor('#1e293b')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('DESCRIPTION', 55, tableY + 10, { width: 250 });
      doc.text('QTY', 310, tableY + 10, { width: 50 });
      doc.text('UNIT PRICE', 365, tableY + 10, { width: 70, align: 'right' });
      doc.text('TOTAL', 440, tableY + 10, { width: 100, align: 'right' });
      console.log(`[Invoice PDF] Table headers written successfully`);

      // Draw table header border
      doc.strokeColor(borderColor)
        .lineWidth(0.5)
        .rect(50, tableY, 495.28, 30)
        .stroke();

      // Items
      console.log(`[Invoice PDF] Starting to write ${order.items.length} items to table`);
      doc.fillColor('#000000')
        .fontSize(10)
        .font('Helvetica');

      let itemY = tableY + 40;
      order.items.forEach((item, index) => {
        console.log(`[Invoice PDF] Writing item ${index + 1}/${order.items.length}:`, {
          productName: item.product?.name,
          variant: item.variant?.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        });

        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(50, itemY - 5, 495.28, 25).fill('#f8fafc');
        }

        const productName = item.product.name + (item.variant ? ` (${item.variant.name})` : '');
        const unitPrice = parseFloat(item.unitPrice).toFixed(2);
        const totalPrice = parseFloat(item.totalPrice).toFixed(2);

        console.log(`[Invoice PDF] Writing item data to PDF at Y=${itemY}:`, {
          description: productName,
          qty: item.quantity,
          unitPrice: `BDT ${unitPrice}`,
          total: `BDT ${totalPrice}`
        });

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
      console.log(`[Invoice PDF] All ${order.items.length} items written to table successfully`);

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

      // Finalize is handled by doc.end() which is called implicitly
      doc.end();
    } catch (error) {
      console.error('[Invoice PDF] Error during PDF creation:', error);
      reject(error);
    }
  });
}

// Run the test
testPDFGeneration();
