/**
 * Comprehensive diagnostic script for invoice download issue
 * This script will help identify why the fix isn't taking effect
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('INVOICE DOWNLOAD ISSUE - COMPREHENSIVE DIAGNOSTIC');
console.log('='.repeat(80));
console.log();

// ============================================================================
// STEP 1: Verify file contents are correct
// ============================================================================
console.log('STEP 1: Verifying file contents...');
console.log('-'.repeat(80));

const orderConfirmationPath = path.join(__dirname, 'routes', 'orderConfirmation.js');
const adminInvoicesPath = path.join(__dirname, 'routes', 'admin', 'invoices.js');

function checkFile(filePath, fileName) {
  console.log(`\nChecking ${fileName}:`);
  console.log(`  Path: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ ERROR: File does not exist!`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for correct imports
  const hasDatabaseServiceImport = content.includes("const { databaseService } = require('../services/database');") ||
                                  content.includes("const { databaseService } = require('../../services/database');");
  const hasPrismaClient = content.includes('const prisma = databaseService.getClient();');
  const hasOldPrismaImport = content.includes("const { PrismaClient } = require('@prisma/client');");
  const hasOldPrismaInit = content.includes('const prisma = new PrismaClient();');
  
  console.log(`  ✓ File exists`);
  console.log(`  ${hasDatabaseServiceImport ? '✓' : '✗'} Has databaseService import`);
  console.log(`  ${hasPrismaClient ? '✓' : '✗'} Uses databaseService.getClient()`);
  console.log(`  ${!hasOldPrismaImport ? '✓' : '✗'} Does NOT have old PrismaClient import`);
  console.log(`  ${!hasOldPrismaInit ? '✓' : '✗'} Does NOT use new PrismaClient()`);
  
  const allCorrect = hasDatabaseServiceImport && hasPrismaClient && !hasOldPrismaImport && !hasOldPrismaInit;
  
  if (allCorrect) {
    console.log(`  ✅ File is correctly fixed!`);
  } else {
    console.log(`  ❌ File still has issues!`);
  }
  
  return allCorrect;
}

const orderConfirmationOk = checkFile(orderConfirmationPath, 'orderConfirmation.js');
const adminInvoicesOk = checkFile(adminInvoicesPath, 'admin/invoices.js');

console.log();

// ============================================================================
// STEP 2: Check database service
// ============================================================================
console.log('STEP 2: Checking database service...');
console.log('-'.repeat(80));

const databaseServicePath = path.join(__dirname, 'services', 'database.js');

if (!fs.existsSync(databaseServicePath)) {
  console.log(`  ❌ ERROR: database.js does not exist at ${databaseServicePath}`);
} else {
  console.log(`  ✓ database.js exists`);
  
  const databaseContent = fs.readFileSync(databaseServicePath, 'utf8');
  
  const hasGetClient = databaseContent.includes('getClient()');
  const hasPrismaProperty = databaseContent.includes('this.prisma');
  
  console.log(`  ${hasGetClient ? '✓' : '✗'} Has getClient() method`);
  console.log(`  ${hasPrismaProperty ? '✓' : '✗'} Has this.prisma property`);
  
  if (hasGetClient && hasPrismaProperty) {
    console.log(`  ✅ Database service looks correct`);
  } else {
    console.log(`  ❌ Database service has issues`);
  }
}

console.log();

// ============================================================================
// STEP 3: Check route mounting
// ============================================================================
console.log('STEP 3: Checking route mounting...');
console.log('-'.repeat(80));

const routesIndexPath = path.join(__dirname, 'routes', 'index.js');

if (!fs.existsSync(routesIndexPath)) {
  console.log(`  ❌ ERROR: routes/index.js does not exist`);
} else {
  console.log(`  ✓ routes/index.js exists`);
  
  const routesContent = fs.readFileSync(routesIndexPath, 'utf8');
  
  const hasOrderConfirmationImport = routesContent.includes("const orderConfirmationRoutes = require('./orderConfirmation');");
  const hasOrderConfirmationMount = routesContent.includes("router.use('/v1/orders', orderConfirmationRoutes);");
  
  console.log(`  ${hasOrderConfirmationImport ? '✓' : '✗'} Imports orderConfirmationRoutes`);
  console.log(`  ${hasOrderConfirmationMount ? '✓' : '✗'} Mounts at /v1/orders`);
  
  if (hasOrderConfirmationImport && hasOrderConfirmationMount) {
    console.log(`  ✅ Routes are correctly mounted`);
  } else {
    console.log(`  ❌ Route mounting has issues`);
  }
}

console.log();

// ============================================================================
// STEP 4: Try to load and test database service
// ============================================================================
console.log('STEP 4: Testing database service loading...');
console.log('-'.repeat(80));

try {
  const { databaseService } = require('./services/database');
  console.log(`  ✓ databaseService loaded successfully`);
  
  const prisma = databaseService.getClient();
  
  if (!prisma) {
    console.log(`  ❌ ERROR: getClient() returned undefined!`);
  } else {
    console.log(`  ✓ getClient() returned a prisma instance`);
    console.log(`  ✓ Prisma instance type: ${typeof prisma}`);
    console.log(`  ✓ Prisma has findUnique: ${typeof prisma.findUnique}`);
    console.log(`  ✓ Prisma has findFirst: ${typeof prisma.findFirst}`);
    console.log(`  ✅ Database service is working!`);
  }
} catch (error) {
  console.log(`  ❌ ERROR loading database service: ${error.message}`);
  console.log(`  Stack: ${error.stack}`);
}

console.log();

// ============================================================================
// STEP 5: Check for Node.js cache issues
// ============================================================================
console.log('STEP 5: Checking for potential caching issues...');
console.log('-'.repeat(80));

console.log(`  Current working directory: ${process.cwd()}`);
console.log(`  Script directory: ${__dirname}`);
console.log(`  Node.js version: ${process.version}`);
console.log(`  Platform: ${process.platform}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

console.log();
console.log('  IMPORTANT NOTES:');
console.log('  1. Node.js caches required modules');
console.log('  2. After code changes, you MUST restart the server completely');
console.log('  3. Hot-reload or nodemon may not always reload all modules');
console.log('  4. Try stopping the server (Ctrl+C) and starting fresh');

console.log();

// ============================================================================
// STEP 6: Summary and recommendations
// ============================================================================
console.log('STEP 6: Summary and recommendations');
console.log('='.repeat(80));

const allFilesCorrect = orderConfirmationOk && adminInvoicesOk;

console.log();
console.log('DIAGNOSTIC RESULTS:');
console.log(`  orderConfirmation.js: ${orderConfirmationOk ? '✅ CORRECT' : '❌ INCORRECT'}`);
console.log(`  admin/invoices.js: ${adminInvoicesOk ? '✅ CORRECT' : '❌ INCORRECT'}`);
console.log();

if (allFilesCorrect) {
  console.log('✅ All files are correctly fixed!');
  console.log();
  console.log('RECOMMENDATIONS:');
  console.log('  1. Stop the backend server completely (Ctrl+C)');
  console.log('  2. Wait a few seconds for process to terminate');
  console.log('  3. Start the server again with: npm start or node index.js');
  console.log('  4. If using nodemon, try stopping it and running node index.js directly');
  console.log('  5. Clear any Node.js cache if needed:');
  console.log('     - Delete node_modules/.cache folder');
  console.log('     - Or run: npm cache clean --force');
  console.log();
  console.log('  If the issue persists after full restart:');
  console.log('  1. Check if there are multiple backend instances running');
  console.log('  2. Check if you are running from the correct directory');
  console.log('  3. Check browser cache (try in incognito mode)');
  console.log('  4. Check if there is a proxy or load balancer caching responses');
} else {
  console.log('❌ Some files are not correctly fixed!');
  console.log();
  console.log('RECOMMENDATIONS:');
  console.log('  1. Review the files marked as INCORRECT above');
  console.log('  2. Make sure the changes were saved to disk');
  console.log('  3. Check for any backup or duplicate files');
  console.log('  4. Verify you are editing the correct files in the correct location');
}

console.log();
console.log('='.repeat(80));
console.log('DIAGNOSTIC COMPLETE');
console.log('='.repeat(80));
