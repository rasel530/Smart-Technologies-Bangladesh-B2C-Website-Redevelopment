/**
 * Check existing invoices in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingInvoices() {
  console.log('='.repeat(80));
  console.log('CHECKING EXISTING INVOICES');
  console.log('='.repeat(80));
  
  try {
    // Count all invoices
    const totalInvoices = await prisma.orderInvoice.count();
    console.log(`\n📊 Total invoices in database: ${totalInvoices}`);
    
    if (totalInvoices === 0) {
      console.log('\n✓ No existing invoices found');
      console.log('  All new invoices will use the fixed PDF generation');
      return;
    }
    
    // Get recent invoices
    const recentInvoices = await prisma.orderInvoice.findMany({
      take: 10,
      orderBy: { generatedAt: 'desc' },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true
          }
        }
      }
    });
    
    console.log(`\n📋 Recent invoices (last 10):`);
    console.log('-'.repeat(80));
    
    recentInvoices.forEach((invoice, index) => {
      console.log(`\n${index + 1}. Invoice #${invoice.invoiceNumber}`);
      console.log(`   Order: ${invoice.order.orderNumber}`);
      console.log(`   Generated: ${invoice.generatedAt.toISOString()}`);
      console.log(`   PDF Size: ${invoice.pdfData ? invoice.pdfData.length : 0} bytes`);
      console.log(`   Downloads: ${invoice.downloadCount || 0}`);
      
      // Check if PDF data exists
      if (!invoice.pdfData || invoice.pdfData.length === 0) {
        console.log(`   ⚠️  WARNING: No PDF data found!`);
      } else {
        // Check for encoding issues
        const header = invoice.pdfData.toString('ascii', 0, 10);
        if (!header.startsWith('%PDF')) {
          console.log(`   ❌ ERROR: Invalid PDF structure!`);
        } else {
          console.log(`   ✓ Valid PDF structure`);
        }
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  IMPORTANT NOTE:');
    console.log('='.repeat(80));
    console.log('\nIf you are seeing garbled text in downloaded invoices, it is likely');
    console.log('because those invoices were generated BEFORE the fix was applied.');
    console.log('\nTo fix this, you need to:');
    console.log('  1. Delete existing invoices from the database, OR');
    console.log('  2. Regenerate all invoices with the new code');
    console.log('\nNew invoices generated after the fix will display correctly.');
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error checking invoices:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingInvoices();
