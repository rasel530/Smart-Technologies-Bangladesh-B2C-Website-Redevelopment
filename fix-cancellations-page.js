const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/app/admin/orders/cancellations/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix all camelCase to snake_case for order_cancellations model
const replacements = [
  // In table row
  { from: /const typeInfo = cancellationTypeLabels\[cancellation\.cancellation_type\];/g, to: 'const typeInfo = cancellationTypeLabels[cancellation.cancellation_type];' },
  { from: /cancellation\.orderId/g, to: 'cancellation.order_id' },
  { from: /cancellation\.createdAt/g, to: 'cancellation.created_at' },
  { from: /formatDate\(cancellation\.createdAt\)/g, to: 'formatDate(cancellation.created_at)' },
  
  // In view modal
  { from: /cancellationTypeLabels\[selectedCancellation\.cancellationType\]/g, to: 'cancellationTypeLabels[selectedCancellation.cancellation_type]' },
  { from: /selectedCancellation\.orderId/g, to: 'selectedCancellation.order_id' },
  { from: /selectedCancellation\.createdAt/g, to: 'selectedCancellation.created_at' },
  { from: /formatDate\(selectedCancellation\.createdAt\)/g, to: 'formatDate(selectedCancellation.created_at)' },
];

// Apply all replacements
replacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

// Write fixed content back to file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed all field naming issues in cancellations page');
console.log('Replacements applied:', replacements.length);
