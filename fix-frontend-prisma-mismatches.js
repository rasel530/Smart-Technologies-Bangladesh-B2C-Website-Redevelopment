#!/usr/bin/env node

/**
 * Comprehensive Frontend Fix Script for Prisma Schema Mismatches
 * 
 * This script fixes all frontend-side issues related to Prisma schema mismatches.
 * It addresses address field naming inconsistencies and updates TypeScript interfaces
 * to use camelCase naming conventions.
 * 
 * Approach: Update frontend to use camelCase to match TypeScript conventions
 * while maintaining compatibility with the Prisma schema.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const FILES_TO_FIX = [
  'frontend/src/app/admin/orders/page.tsx',
  'frontend/src/lib/api/orderManagement.ts'
];

const BACKUP_DIR = 'backups/frontend-fixes';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Log a message with timestamp
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '✓',
    success: '✓',
    warning: '⚠',
    error: '✗',
    section: '▶'
  }[type] || '•';
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log(`Created backup directory: ${BACKUP_DIR}`, 'success');
  }
}

/**
 * Create a backup of a file
 */
function createBackup(filePath) {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `${path.basename(filePath)}.${timestamp}.backup`);
  
  try {
    fs.copyFileSync(filePath, backupPath);
    log(`Created backup: ${backupPath}`, 'success');
    return backupPath;
  } catch (error) {
    log(`Failed to create backup for ${filePath}: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Read file content
 */
function readFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    log(`Read file: ${filePath}`, 'info');
    return content;
  } catch (error) {
    log(`Failed to read ${filePath}: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Write file content
 */
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    log(`Wrote file: ${filePath}`, 'success');
  } catch (error) {
    log(`Failed to write ${filePath}: ${error.message}`, 'error');
    throw error;
  }
}

// ============================================================================
// Fix Functions
// ============================================================================

/**
 * Fix address field references in admin orders page
 */
function fixAdminOrdersPage(content) {
  log('Fixing address field references in admin orders page...', 'section');
  
  let changes = [];
  let modifiedContent = content;
  
  // Fix OrderAddress interface (lines 40-52)
  // Change addressLine1 to address
  if (modifiedContent.includes('addressLine1: string;')) {
    const oldText = '  addressLine1: string;';
    const newText = '  address: string;';
    modifiedContent = modifiedContent.replace(oldText, newText);
    changes.push('Line 46: Changed addressLine1 to address in OrderAddress interface');
  }
  
  // Change state to district
  if (modifiedContent.includes('  state: string;')) {
    const oldText = '  state: string;';
    const newText = '  district: string;';
    modifiedContent = modifiedContent.replace(oldText, newText);
    changes.push('Line 49: Changed state to district in OrderAddress interface');
  }
  
  // Change country to division
  if (modifiedContent.includes('  country: string;')) {
    const oldText = '  country: string;';
    const newText = '  division: string;';
    modifiedContent = modifiedContent.replace(oldText, newText);
    changes.push('Line 51: Changed country to division in OrderAddress interface');
  }
  
  // Fix address display in shipping address section (lines 751-756)
  // Fix line 751: addressLine1 -> address
  if (modifiedContent.includes('                  <p>{selectedOrder.address.addressLine1}</p>')) {
    const oldText = '                  <p>{selectedOrder.address.addressLine1}</p>';
    const newText = '                  <p>{selectedOrder.address.address}</p>';
    modifiedContent = modifiedContent.replace(oldText, newText);
    changes.push('Line 751: Changed addressLine1 to address in shipping address display');
  }
  
  // Fix line 754: state -> district
  if (modifiedContent.includes('                    {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.postalCode}')) {
    const oldText = '                    {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.postalCode}';
    const newText = '                    {selectedOrder.address.city}, {selectedOrder.address.district} {selectedOrder.address.postalCode}';
    modifiedContent = modifiedContent.replace(oldText, newText);
    changes.push('Line 754: Changed state to district in shipping address display');
  }
  
  // Fix line 756: country -> division
  if (modifiedContent.includes('                  <p>{selectedOrder.address.country}</p>')) {
    const oldText = '                  <p>{selectedOrder.address.country}</p>';
    const newText = '                  <p>{selectedOrder.address.division}</p>';
    modifiedContent = modifiedContent.replace(oldText, newText);
    changes.push('Line 756: Changed country to division in shipping address display');
  }
  
  if (changes.length > 0) {
    log(`Applied ${changes.length} changes to admin orders page:`, 'success');
    changes.forEach(change => log(`  - ${change}`, 'info'));
  } else {
    log('No changes needed for admin orders page', 'warning');
  }
  
  return modifiedContent;
}

/**
 * Fix TypeScript interfaces in orderManagement.ts to use camelCase
 */
function fixOrderManagementTypes(content) {
  log('Fixing TypeScript interfaces in orderManagement.ts...', 'section');
  
  let changes = [];
  let modifiedContent = content;
  
  // Fix OrderModification interface (lines 36-48)
  // Change order_id to orderId
  if (modifiedContent.includes('  order_id: string;') && modifiedContent.includes('export interface OrderModification')) {
    // Replace in OrderModification interface only
    const orderModificationMatch = modifiedContent.match(/export interface OrderModification \{[\s\S]*?\n\}/);
    if (orderModificationMatch) {
      const oldInterface = orderModificationMatch[0];
      const newInterface = oldInterface
        .replace(/order_id: string;/g, 'orderId: string;')
        .replace(/created_at: Date;/g, 'createdAt: Date;')
        .replace(/updated_at: Date;/g, 'updatedAt: Date;');
      modifiedContent = modifiedContent.replace(oldInterface, newInterface);
      changes.push('OrderModification interface: Changed order_id to orderId, created_at to createdAt, updated_at to updatedAt');
    }
  }
  
  // Fix OrderCancellation interface (lines 50-64)
  if (modifiedContent.includes('export interface OrderCancellation')) {
    const orderCancellationMatch = modifiedContent.match(/export interface OrderCancellation \{[\s\S]*?\n\}/);
    if (orderCancellationMatch) {
      const oldInterface = orderCancellationMatch[0];
      const newInterface = oldInterface
        .replace(/order_id: string;/g, 'orderId: string;')
        .replace(/created_at: Date;/g, 'createdAt: Date;')
        .replace(/updated_at: Date;/g, 'updatedAt: Date;');
      modifiedContent = modifiedContent.replace(oldInterface, newInterface);
      changes.push('OrderCancellation interface: Changed order_id to orderId, created_at to createdAt, updated_at to updatedAt');
    }
  }
  
  // Fix OrderFulfillment interface (lines 66-84)
  if (modifiedContent.includes('export interface OrderFulfillment')) {
    const orderFulfillmentMatch = modifiedContent.match(/export interface OrderFulfillment \{[\s\S]*?\n\}/);
    if (orderFulfillmentMatch) {
      const oldInterface = orderFulfillmentMatch[0];
      const newInterface = oldInterface
        .replace(/order_id: string;/g, 'orderId: string;')
        .replace(/created_at: Date;/g, 'createdAt: Date;')
        .replace(/updated_at: Date;/g, 'updatedAt: Date;');
      modifiedContent = modifiedContent.replace(oldInterface, newInterface);
      changes.push('OrderFulfillment interface: Changed order_id to orderId, created_at to createdAt, updated_at to updatedAt');
    }
  }
  
  // Fix OrderTrackingEvent interface (lines 100-110)
  if (modifiedContent.includes('export interface OrderTrackingEvent')) {
    const orderTrackingEventMatch = modifiedContent.match(/export interface OrderTrackingEvent \{[\s\S]*?\n\}/);
    if (orderTrackingEventMatch) {
      const oldInterface = orderTrackingEventMatch[0];
      const newInterface = oldInterface
        .replace(/order_id: string;/g, 'orderId: string;')
        .replace(/created_at: Date;/g, 'createdAt: Date;');
      modifiedContent = modifiedContent.replace(oldInterface, newInterface);
      changes.push('OrderTrackingEvent interface: Changed order_id to orderId, created_at to createdAt');
    }
  }
  
  // Fix OrderNote interface (lines 112-123)
  if (modifiedContent.includes('export interface OrderNote')) {
    const orderNoteMatch = modifiedContent.match(/export interface OrderNote \{[\s\S]*?\n\}/);
    if (orderNoteMatch) {
      const oldInterface = orderNoteMatch[0];
      const newInterface = oldInterface
        .replace(/order_id: string;/g, 'orderId: string;')
        .replace(/created_at: Date;/g, 'createdAt: Date;')
        .replace(/updated_at: Date;/g, 'updatedAt: Date;');
      modifiedContent = modifiedContent.replace(oldInterface, newInterface);
      changes.push('OrderNote interface: Changed order_id to orderId, created_at to createdAt, updated_at to updatedAt');
    }
  }
  
  // Fix OrderStatusHistory interface (lines 125-134)
  if (modifiedContent.includes('export interface OrderStatusHistory')) {
    const orderStatusHistoryMatch = modifiedContent.match(/export interface OrderStatusHistory \{[\s\S]*?\n\}/);
    if (orderStatusHistoryMatch) {
      const oldInterface = orderStatusHistoryMatch[0];
      const newInterface = oldInterface
        .replace(/order_id: string;/g, 'orderId: string;')
        .replace(/created_at: Date;/g, 'createdAt: Date;');
      modifiedContent = modifiedContent.replace(oldInterface, newInterface);
      changes.push('OrderStatusHistory interface: Changed order_id to orderId, created_at to createdAt');
    }
  }
  
  // Fix OrderItem interface (line 182)
  if (modifiedContent.includes('export interface OrderItem')) {
    const orderItemMatch = modifiedContent.match(/export interface OrderItem \{[\s\S]*?\n\}/);
    if (orderItemMatch) {
      const oldInterface = orderItemMatch[0];
      const newInterface = oldInterface.replace(/order_id: string;/g, 'orderId: string;');
      modifiedContent = modifiedContent.replace(oldInterface, newInterface);
      changes.push('OrderItem interface: Changed order_id to orderId');
    }
  }
  
  // Fix Order interface address field (lines 160-168)
  if (modifiedContent.includes('export interface Order') && modifiedContent.includes('addressLine1: string;')) {
    const orderMatch = modifiedContent.match(/export interface Order \{[\s\S]*?\n\}/);
    if (orderMatch) {
      const oldInterface = orderMatch[0];
      const newInterface = oldInterface.replace(/addressLine1: string;/g, 'address: string;');
      modifiedContent = modifiedContent.replace(oldInterface, newInterface);
      changes.push('Order interface: Changed addressLine1 to address');
    }
  }
  
  if (changes.length > 0) {
    log(`Applied ${changes.length} interface fixes:`, 'success');
    changes.forEach(change => log(`  - ${change}`, 'info'));
  } else {
    log('No interface fixes needed', 'warning');
  }
  
  return modifiedContent;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  log('Starting comprehensive frontend fix for Prisma schema mismatches...', 'section');
  log('Approach: Update frontend to use camelCase naming conventions', 'info');
  log('', 'info');
  
  const results = {
    totalFiles: 0,
    successFiles: 0,
    failedFiles: 0,
    totalChanges: 0,
    errors: []
  };
  
  for (const filePath of FILES_TO_FIX) {
    try {
      log(`\nProcessing: ${filePath}`, 'section');
      results.totalFiles++;
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Create backup
      const backupPath = createBackup(filePath);
      
      // Read file content
      const originalContent = readFile(filePath);
      
      // Apply fixes based on file type
      let modifiedContent;
      if (filePath.includes('admin/orders/page.tsx')) {
        modifiedContent = fixAdminOrdersPage(originalContent);
      } else if (filePath.includes('orderManagement.ts')) {
        modifiedContent = fixOrderManagementTypes(originalContent);
      } else {
        log(`No fix function defined for ${filePath}`, 'warning');
        continue;
      }
      
      // Check if content changed
      if (modifiedContent !== originalContent) {
        // Write modified content
        writeFile(filePath, modifiedContent);
        results.successFiles++;
        results.totalChanges++;
        log(`Successfully modified ${filePath}`, 'success');
      } else {
        log(`No changes needed for ${filePath}`, 'info');
        results.successFiles++;
      }
      
    } catch (error) {
      results.failedFiles++;
      results.errors.push({
        file: filePath,
        error: error.message
      });
      log(`Failed to process ${filePath}: ${error.message}`, 'error');
    }
  }
  
  // Print summary
  log('\n' + '='.repeat(70), 'section');
  log('FRONTEND FIX SUMMARY', 'section');
  log('='.repeat(70), 'section');
  log(`Total files processed: ${results.totalFiles}`, 'info');
  log(`Files successfully modified: ${results.successFiles}`, results.successFiles > 0 ? 'success' : 'warning');
  log(`Files failed: ${results.failedFiles}`, results.failedFiles > 0 ? 'error' : 'info');
  log(`Total changes applied: ${results.totalChanges}`, 'info');
  
  if (results.errors.length > 0) {
    log('\nErrors encountered:', 'error');
    results.errors.forEach((err, index) => {
      log(`  ${index + 1}. ${err.file}: ${err.error}`, 'error');
    });
  }
  
  log('\nBackup files created in: ' + BACKUP_DIR, 'info');
  log('To restore original files, copy from backup directory', 'info');
  
  if (results.failedFiles === 0) {
    log('\n✓ All frontend fixes completed successfully!', 'success');
  } else {
    log('\n✗ Some fixes failed. Please review errors above.', 'error');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
