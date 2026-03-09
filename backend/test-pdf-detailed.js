/**
 * Detailed PDF test to check encoding and content
 */

const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testPDFDetailed() {
  console.log('='.repeat(80));
  console.log('DETAILED PDF ENCODING TEST');
  console.log('='.repeat(80));
  
  try {
    // Find a test order
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
      console.error('❌ No test order found');
      process.exit(1);
    }

    console.log(`\n✓ Test order: ${order.orderNumber}`);
    
    // Test 1: Simple PDF with just text
    console.log('\n--- Test 1: Simple PDF with basic text ---');
    const simplePdf = await createSimplePDF(order);
    console.log(`✓ Simple PDF size: ${simplePdf.length} bytes`);
    
    // Test 2: PDF with BDT currency
    console.log('\n--- Test 2: PDF with BDT currency ---');
    const bdtPdf = await createBDTPDF(order);
    console.log(`✓ BDT PDF size: ${bdtPdf.length} bytes`);
    
    // Test 3: Check for encoding issues in buffer
    console.log('\n--- Test 3: Encoding analysis ---');
    analyzeEncoding(simplePdf, 'Simple PDF');
    analyzeEncoding(bdtPdf, 'BDT PDF');
    
    // Save both PDFs
    const outputDir = path.join(__dirname, 'test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(outputDir, 'simple-test.pdf'), simplePdf);
    fs.writeFileSync(path.join(outputDir, 'bdt-test.pdf'), bdtPdf);
    
    console.log('\n✓ PDFs saved to test-output/');
    console.log('  - simple-test.pdf');
    console.log('  - bdt-test.pdf');
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETED');
    console.log('='.repeat(80));
    console.log('\n📝 Please open both PDF files and compare:');
    console.log('  1. simple-test.pdf - Basic text without currency');
    console.log('  2. bdt-test.pdf - With BDT currency formatting');
    console.log('\n📂 Location: backend/test-output/');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSimplePDF(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Simple content
      doc.fontSize(20).text('Test Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Order: ${order.orderNumber}`);
      doc.text(`Total: ${order.total.toFixed(2)}`);
      doc.moveDown();
      doc.text('Items:');
      order.items.forEach(item => {
        doc.text(`- ${item.product.name} x ${item.quantity}`);
      });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function createBDTPDF(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Content with BDT
      doc.fontSize(20).text('Test Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Order: ${order.orderNumber}`);
      doc.text(`Subtotal: BDT ${order.subtotal.toFixed(2)}`);
      doc.text(`Tax: BDT ${order.tax.toFixed(2)}`);
      doc.text(`Shipping: BDT ${order.shippingCost.toFixed(2)}`);
      doc.text(`Discount: -BDT ${order.discount.toFixed(2)}`);
      doc.text(`Total: BDT ${order.total.toFixed(2)}`);
      doc.moveDown();
      doc.text('Items:');
      order.items.forEach(item => {
        const unitPrice = parseFloat(item.unitPrice).toFixed(2);
        const totalPrice = parseFloat(item.totalPrice).toFixed(2);
        doc.text(`- ${item.product.name} x ${item.quantity} = BDT ${totalPrice}`);
      });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function analyzeEncoding(buffer, name) {
  console.log(`\n🔍 Analyzing ${name}:`);
  
  // Check for BDT
  const hasBDT = buffer.toString('utf-8').includes('BDT');
  console.log(`  - Contains 'BDT': ${hasBDT ? '✓' : '✗'}`);
  
  // Check for Bengali Taka symbol
  const hasTaka = buffer.toString('utf-8').includes('৳');
  console.log(`  - Contains '৳': ${hasTaka ? '✓ (WARNING)' : '✗'}`);
  
  // Check for garbled patterns
  const content = buffer.toString('utf-8', 0, Math.min(2000, buffer.length));
  const garbledPatterns = ['Ÿ3', 'ƒS', 'ã', 'Ÿ'];
  let foundGarbled = [];
  
  garbledPatterns.forEach(pattern => {
    if (content.includes(pattern)) {
      foundGarbled.push(pattern);
    }
  });
  
  if (foundGarbled.length > 0) {
    console.log(`  - Garbled patterns found: ${foundGarbled.join(', ')} ❌`);
  } else {
    console.log(`  - Garbled patterns: None ✓`);
  }
  
  // Check PDF structure
  const header = buffer.toString('ascii', 0, 10);
  console.log(`  - PDF header: ${header}`);
  
  if (header.startsWith('%PDF')) {
    console.log(`  - Valid PDF structure: ✓`);
  } else {
    console.log(`  - Valid PDF structure: ✗`);
  }
}

// Run test
testPDFDetailed();
