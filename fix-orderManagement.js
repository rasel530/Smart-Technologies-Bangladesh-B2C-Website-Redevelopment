const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/routes/orderManagement.js');

let content = fs.readFileSync(filePath, 'utf8');

// Fix model names (singular to plural)
const modelReplacements = [
  ['prisma\\.order\\.', 'prisma.orders.'],
  ['prisma\\.product\\.', 'prisma.products.'],
  ['prisma\\.user\\.', 'prisma.users.'],
  ['prisma\\.address\\.', 'prisma.addresses.'],
  ['prisma\\.orderItem\\.', 'prisma.order_items.'],
  ['prisma\\.orderCancellation\\.', 'prisma.order_cancellations.'],
  ['prisma\\.orderStatusHistory\\.', 'prisma.order_status_histories.'],
  ['prisma\\.orderFulfillment\\.', 'prisma.order_fulfillments.'],
  ['prisma\\.orderTrackingEvent\\.', 'prisma.order_tracking_events.'],
  ['tx\\.order\\.', 'tx.orders.'],
  ['tx\\.product\\.', 'tx.products.'],
  ['tx\\.user\\.', 'tx.users.'],
  ['tx\\.address\\.', 'tx.addresses.'],
  ['tx\\.orderItem\\.', 'tx.order_items.'],
  ['tx\\.orderCancellation\\.', 'tx.order_cancellations.'],
  ['tx\\.orderStatusHistory\\.', 'tx.order_status_histories.'],
];

modelReplacements.forEach(([from, to]) => {
  const regex = new RegExp(from, 'g');
  content = content.replace(regex, to);
});

// Fix field names in order-related models (camelCase to snake_case)
// These models use snake_case: order_modifications, order_cancellations, order_fulfillments, order_notes, order_status_history, order_tracking_events

// Fix order_modifications field names
content = content.replace(/(\bprisma\.order_modifications\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)createdAt/g, '$1created_at');
content = content.replace(/(\bprisma\.order_modifications\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)processedAt/g, '$1processed_at');
content = content.replace(/(\bprisma\.order_modifications\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)modificationType/g, '$1modification_type');
content = content.replace(/(\bprisma\.order_modifications\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)orderId/g, '$1order_id');

// Fix order_cancellations field names
content = content.replace(/(\bprisma\.order_cancellations\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)createdAt/g, '$1created_at');
content = content.replace(/(\bprisma\.order_cancellations\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)processedAt/g, '$1processed_at');
content = content.replace(/(\bprisma\.order_cancellations\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)cancellationType/g, '$1cancellation_type');
content = content.replace(/(\bprisma\.order_cancellations\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)orderId/g, '$1order_id');

// Fix order_fulfillments field names
content = content.replace(/(\bprisma\.order_fulfillments\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)createdAt/g, '$1created_at');
content = content.replace(/(\bprisma\.order_fulfillments\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)shippedAt/g, '$1shipped_at');
content = content.replace(/(\bprisma\.order_fulfillments\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)deliveredAt/g, '$1delivered_at');
content = content.replace(/(\bprisma\.order_fulfillments\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)courierServiceId/g, '$1courier_service_id');
content = content.replace(/(\bprisma\.order_fulfillments\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)trackingNumber/g, '$1tracking_number');
content = content.replace(/(\bprisma\.order_fulfillments\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)orderId/g, '$1order_id');

// Fix order_notes field names
content = content.replace(/(\bprisma\.order_notes\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)createdAt/g, '$1created_at');
content = content.replace(/(\bprisma\.order_notes\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)updatedAt/g, '$1updated_at');
content = content.replace(/(\bprisma\.order_notes\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)noteType/g, '$1note_type');
content = content.replace(/(\bprisma\.order_notes\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)isPinned/g, '$1is_pinned');
content = content.replace(/(\bprisma\.order_notes\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)createdBy/g, '$1created_by');
content = content.replace(/(\bprisma\.order_notes\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)updatedBy/g, '$1updated_by');
content = content.replace(/(\bprisma\.order_notes\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)orderId/g, '$1order_id');

// Fix order_status_history field names
content = content.replace(/(\bprisma\.order_status_histories\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)createdAt/g, '$1created_at');
content = content.replace(/(\bprisma\.order_status_histories\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)previousStatus/g, '$1previous_status');
content = content.replace(/(\bprisma\.order_status_histories\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)newStatus/g, '$1new_status');
content = content.replace(/(\bprisma\.order_status_histories\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)changedBy/g, '$1changed_by');
content = content.replace(/(\bprisma\.order_status_histories\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)orderId/g, '$1order_id');

// Fix order_tracking_events field names
content = content.replace(/(\bprisma\.order_tracking_events\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)createdAt/g, '$1created_at');
content = content.replace(/(\bprisma\.order_tracking_events\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)eventTime/g, '$1event_time');
content = content.replace(/(\bprisma\.order_tracking_events\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)fulfillmentId/g, '$1fulfillment_id');
content = content.replace(/(\bprisma\.order_tracking_events\.[a-zA-Z]+\([^)]*|orderBy:\s*\{[^}]*)orderId/g, '$1order_id');

// Fix include relation names
content = content.replace(/include:\s*\{\s*items:/g, 'include: { order_items:');
content = content.replace(/include:\s*\{\s*user:/g, 'include: { users:');
content = content.replace(/include:\s*\{\s*address:/g, 'include: { addresses:');
content = content.replace(/include:\s*\{\s*product:/g, 'include: { products:');
content = content.replace(/include:\s*\{\s*courierService:/g, 'include: { courier_services:');

// Fix where clauses for order-related models
content = content.replace(/where:\s*\{\s*orderId:/g, 'where: { order_id:');
content = content.replace(/where:\s*\{\s*modificationType:/g, 'where: { modification_type:');
content = content.replace(/where:\s*\{\s*cancellationType:/g, 'where: { cancellation_type:');

// Fix data objects for order-related models
content = content.replace(/data:\s*\{\s*orderId:/g, 'data: { order_id:');
content = content.replace(/data:\s*\{\s*modificationType:/g, 'data: { modification_type:');
content = content.replace(/data:\s*\{\s*cancellationType:/g, 'data: { cancellation_type:');

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed orderManagement.js successfully');
console.log('Changes made:');
console.log('- Changed singular model names to plural (order -> orders, product -> products, etc.)');
console.log('- Changed camelCase field names to snake_case for order-related models');
console.log('- Fixed include relation names');
console.log('- Fixed where and data clauses');
