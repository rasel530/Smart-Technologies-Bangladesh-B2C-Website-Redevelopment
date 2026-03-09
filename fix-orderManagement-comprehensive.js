const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/routes/orderManagement.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix all camelCase to snake_case for order-related models
const replacements = [
  // order_cancellations fields
  { from: /\bc\.cancellationType\b/g, to: 'c.cancellation_type' },
  { from: /\bcancellationType: type\b/g, to: 'cancellation_type: type' },
  { from: /\bwhere\.cancellationType\b/g, to: 'where.cancellation_type' },
  { from: /\brequestedBy: adminId\b/g, to: 'requested_by: adminId' },
  { from: /\brequestedBy: userId\b/g, to: 'requested_by: userId' },
  { from: /\bapprovedBy: adminId\b/g, to: 'approved_by: adminId' },
  { from: /\bapprovedBy: isAdmin \? userId : null\b/g, to: 'approved_by: isAdmin ? userId : null' },
  { from: /\bapprovedBy: adminId\b/g, to: 'approved_by: adminId' },
  { from: /\bprocessedAt: new Date\(\)\b/g, to: 'processed_at: new Date()' },
  
  // order_modifications fields
  { from: /\bm\.modificationType\b/g, to: 'm.modification_type' },
  { from: /\bmodificationType: type\b/g, to: 'modification_type: type' },
  { from: /\bwhere\.modificationType\b/g, to: 'where.modification_type' },
  { from: /\bmodification\.modificationType\b/g, to: 'modification.modification_type' },
  { from: /\bmodificationType: modification\.modificationType\b/g, to: 'modification_type: modification.modification_type' },
  { from: /\bmodificationType: modification\.modificationType\b/g, to: 'modification_type: modification.modification_type' },
  
  // order_fulfillments fields
  { from: /\bcourierServiceId\b/g, to: 'courier_service_id' },
  { from: /\btrackingNumber\b/g, to: 'tracking_number' },
  { from: /\bestimatedDelivery\b/g, to: 'estimated_delivery' },
  { from: /\bshippedAt\b/g, to: 'shipped_at' },
  { from: /\bdeliveredAt\b/g, to: 'delivered_at' },
  { from: /\bpackagingDetails\b/g, to: 'packaging_details' },
  { from: /\bfulfillmentId\b/g, to: 'fulfillment_id' },
  
  // order_notes fields
  { from: /\bnoteType: type\b/g, to: 'note_type: type' },
  { from: /\bwhere\.noteType\b/g, to: 'where.note_type' },
  { from: /\bisPinned: isPinned\b/g, to: 'is_pinned: is_pinned' },
  { from: /\bisPinned: isPinned \|\| false\b/g, to: 'is_pinned: is_pinned || false' },
  { from: /\bcreatedBy: userId\b/g, to: 'created_by: userId' },
  { from: /\bupdatedBy: userId\b/g, to: 'updated_by: userId' },
  { from: /\bnote\.createdBy\b/g, to: 'note.created_by' },
  { from: /\bnote\.updatedBy\b/g, to: 'note.updated_by' },
  { from: /\bupdateData\.isPinned\b/g, to: 'updateData.is_pinned' },
  { from: /\bupdateData\.updatedBy\b/g, to: 'updateData.updated_by' },
  
  // order_status_history fields
  { from: /\bchangedBy: adminId\b/g, to: 'changed_by: adminId' },
  { from: /\bchangedBy: req\.user\.id\b/g, to: 'changed_by: req.user.id' },
  { from: /\bchangedBy: userId\b/g, to: 'changed_by: userId' },
  
  // order_tracking_events fields
  { from: /\beventTime\b/g, to: 'event_time' },
  { from: /\be\.eventTime\b/g, to: 'e.event_time' },
  { from: /\bfulfillmentId\b/g, to: 'fulfillment_id' },
  { from: /\btrackingNumber\b/g, to: 'tracking_number' },
  { from: /\bcourierServiceId\b/g, to: 'courier_service_id' },
];

// Apply all replacements
replacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

// Write the fixed content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed all field naming issues in orderManagement.js');
console.log('Replacements applied:', replacements.length);
