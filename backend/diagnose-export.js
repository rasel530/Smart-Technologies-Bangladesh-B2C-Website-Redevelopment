const { PrismaClient } = require('@prisma/client');
const { dataExportService } = require('./services/dataExport.service');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function diagnoseExport(exportId) {
  console.log('=== DIAGNOSING EXPORT ===');
  console.log('Export ID:', exportId);
  console.log('');

  try {
    // Get export record
    const exportRecord = await prisma.userDataExports.findUnique({
      where: { id: exportId }
    });

    if (!exportRecord) {
      console.log('❌ Export not found in database');
      return;
    }

    console.log('📋 Export Record:');
    console.log('  Status:', exportRecord.status);
    console.log('  User ID:', exportRecord.userId);
    console.log('  Data Types:', exportRecord.dataTypes);
    console.log('  Format:', exportRecord.format);
    console.log('  File URL:', exportRecord.fileUrl || 'NULL');
    console.log('  Requested At:', exportRecord.requestedAt);
    console.log('  Ready At:', exportRecord.readyAt || 'NULL');
    console.log('  Error Message:', exportRecord.errorMessage || 'NULL');
    console.log('');

    // Check if file exists
    if (exportRecord.fileUrl) {
      const filename = exportRecord.fileUrl.replace('/exports/', '');
      const filepath = path.join(__dirname, 'exports', filename);

      try {
        await fs.access(filepath);
        const stats = await fs.stat(filepath);
        console.log('✅ File exists:', filepath);
        console.log('   File size:', stats.size, 'bytes');
        console.log('   Created:', stats.birthtime);
        console.log('');

        // Read and display file content
        const content = await fs.readFile(filepath, 'utf8');
        console.log('📄 File content preview:');
        console.log(content.substring(0, 500));
        console.log('...');
      } catch (err) {
        console.log('❌ File does not exist or is not accessible:', filepath);
        console.log('   Error:', err.message);
        console.log('');
      }
    } else {
      console.log('❌ No file URL in export record');
      console.log('');
    }

    // Check if user exists
    console.log('👤 Checking user...');
    try {
      const user = await prisma.user.findUnique({
        where: { id: exportRecord.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });

      if (user) {
        console.log('✅ User exists:', user.email);
      } else {
        console.log('❌ User not found');
      }
    } catch (err) {
      console.log('❌ Error checking user:', err.message);
    }
    console.log('');

    // Check user data based on requested types
    console.log('📊 Checking user data availability...');
    for (const dataType of exportRecord.dataTypes) {
      console.log(`\n  ${dataType.toUpperCase()}:`);

      try {
        if (dataType === 'profile') {
          const user = await prisma.user.findUnique({
            where: { id: exportRecord.userId },
            select: { id: true, email: true }
          });
          console.log('    ✅ Profile data available');
        } else if (dataType === 'orders') {
          const orders = await prisma.order.findMany({
            where: { userId: exportRecord.userId },
            take: 1
          });
          console.log(`    ✅ Orders data available (${orders.length} orders)`);
        } else if (dataType === 'addresses') {
          const addresses = await prisma.address.findMany({
            where: { userId: exportRecord.userId },
            take: 1
          });
          console.log(`    ✅ Addresses data available (${addresses.length} addresses)`);
        } else if (dataType === 'wishlist') {
          const wishlist = await prisma.wishlist.findMany({
            where: { userId: exportRecord.userId },
            take: 1
          });
          console.log(`    ✅ Wishlist data available (${wishlist.length} items)`);
        }
      } catch (err) {
        console.log(`    ❌ Error fetching ${dataType}:`, err.message);
      }
    }

    console.log('\n=== DIAGNOSIS COMPLETE ===');

    // Provide recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (exportRecord.status === 'processing') {
      if (exportRecord.fileUrl) {
        console.log('  - File exists but status is still "processing"');
        console.log('  - Consider updating status to "ready" manually');
      } else {
        console.log('  - Export is stuck in processing state');
        console.log('  - The async process may have failed silently');
        console.log('  - Check backend logs for errors');
        console.log('  - Consider retrying the export process');
      }
    } else if (exportRecord.status === 'ready') {
      console.log('  - Export is ready for download');
      console.log('  - File should be accessible via download URL');
    }

  } catch (error) {
    console.error('❌ Diagnosis error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get export ID from command line
const exportId = process.argv[2];

if (!exportId) {
  console.log('Usage: node diagnose-export.js <export-id>');
  process.exit(1);
}

diagnoseExport(exportId);
