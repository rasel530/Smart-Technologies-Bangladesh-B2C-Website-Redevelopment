const fs = require('fs');
const path = require('path');

// List of payment service files to update
const serviceFiles = [
  'backend/src/services/payment/fraud-detection.service.ts',
  'backend/src/services/payment/payment-cache.service.ts',
  'backend/src/services/payment/payment-optimization-integration.service.ts',
  'backend/src/services/payment/payment-performance.service.ts',
  'backend/src/services/payment/payment-queue.service.ts',
  'backend/src/services/payment/payment-retry.service.ts',
  'backend/src/services/payment/payment-transaction.service.ts',
  'backend/src/services/payment/security-audit.service.ts'
];

// Pattern to replace
const oldPattern = /import\s+{\s*PrismaClient[^}]*}\s+from\s+['"]@prisma\/client['"];?\s*\n\s*const\s+prisma\s*=\s*new\s+PrismaClient\(\);?\s*\n/g;
const newImport = `import { databaseService } from '../../../../services/database.service';\n\nconst prisma = databaseService.getClient();\n`;

serviceFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if file needs updating
    if (content.includes('new PrismaClient()')) {
      // Replace the import and prisma initialization
      content = content.replace(oldPattern, newImport);
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️  Skipped (already updated): ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log('\n✅ Payment services update complete!');
