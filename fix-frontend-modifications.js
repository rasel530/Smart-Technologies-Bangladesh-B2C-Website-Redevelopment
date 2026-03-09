const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/app/admin/orders/modifications/page.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Fix field names from camelCase to snake_case for order_modifications
const replacements = [
  ['modification\\.modificationType', 'modification.modification_type'],
  ['modification\\.orderId', 'modification.order_id'],
  ['modification\\.createdAt', 'modification.created_at'],
  ['selectedModification\\.modificationType', 'selectedModification.modification_type'],
  ['selectedModification\\.orderId', 'selectedModification.order_id'],
  ['selectedModification\\.createdAt', 'selectedModification.created_at'],
];

replacements.forEach(([from, to]) => {
  const regex = new RegExp(from, 'g');
  content = content.replace(regex, to);
});

// Write fixed content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed frontend modifications page successfully');
console.log('Changes made:');
console.log('- Changed modification.modificationType to modification.modification_type');
console.log('- Changed modification.orderId to modification.order_id');
console.log('- Changed modification.createdAt to modification.created_at');
console.log('- Changed selectedModification.modificationType to selectedModification.modification_type');
console.log('- Changed selectedModification.orderId to selectedModification.order_id');
console.log('- Changed selectedModification.createdAt to selectedModification.created_at');
