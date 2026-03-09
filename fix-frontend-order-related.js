const fs = require('fs');
const path = require('path');

// Fix cancellations page
const cancellationsPath = path.join(__dirname, 'frontend/src/app/admin/orders/cancellations/page.tsx');
if (fs.existsSync(cancellationsPath)) {
  let content = fs.readFileSync(cancellationsPath, 'utf8');
  
  const replacements = [
    { from: /cancellation\.cancellationType\b/g, to: 'cancellation.cancellation_type' },
    { from: /cancellationTypeLabels\[cancellation\.cancellationType\]/g, to: 'cancellationTypeLabels[cancellation.cancellation_type]' },
  ];
  
  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  fs.writeFileSync(cancellationsPath, content, 'utf8');
  console.log('✅ Fixed cancellations page');
}

// Fix modifications page
const modificationsPath = path.join(__dirname, 'frontend/src/app/admin/orders/modifications/page.tsx');
if (fs.existsSync(modificationsPath)) {
  let content = fs.readFileSync(modificationsPath, 'utf8');
  
  const replacements = [
    { from: /modification\.modificationType\b/g, to: 'modification.modification_type' },
    { from: /modificationTypeLabels\[modification\.modificationType\]/g, to: 'modificationTypeLabels[modification.modification_type]' },
    { from: /modification\.orderId\b/g, to: 'modification.order_id' },
    { from: /modification\.createdAt\b/g, to: 'modification.created_at' },
    { from: /selectedModification\.modificationType\b/g, to: 'selectedModification.modification_type' },
    { from: /selectedModification\.orderId\b/g, to: 'selectedModification.order_id' },
    { from: /selectedModification\.createdAt\b/g, to: 'selectedModification.created_at' },
  ];
  
  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  fs.writeFileSync(modificationsPath, content, 'utf8');
  console.log('✅ Fixed modifications page');
}

// Fix orderManagement API
const apiPath = path.join(__dirname, 'frontend/src/lib/api/orderManagement.ts');
if (fs.existsSync(apiPath)) {
  let content = fs.readFileSync(apiPath, 'utf8');
  
  const replacements = [
    { from: /modificationType: string;/g, to: 'modification_type: string;' },
    { from: /orderId: string;/g, to: 'order_id: string;' },
    { from: /requestedBy: string;/g, to: 'requested_by: string;' },
    { from: /approvedBy\?: string;/g, to: 'approved_by?: string;' },
    { from: /processedAt\?: Date;/g, to: 'processed_at?: Date;' },
    { from: /createdAt: Date;/g, to: 'created_at: Date;' },
    { from: /updatedAt: Date;/g, to: 'updated_at: Date;' },
  ];
  
  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  fs.writeFileSync(apiPath, content, 'utf8');
  console.log('✅ Fixed orderManagement API');
}

console.log('\n✅ All frontend fixes applied successfully');
