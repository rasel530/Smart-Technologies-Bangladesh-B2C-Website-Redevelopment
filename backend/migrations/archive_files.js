const fs = require('fs');
const path = require('path');

const filesToArchive = [
  'phase6_milestone2_wishlist_new_tables.sql',
  'migrate_wishlist_safe_v2.js',
  'migrate_wishlist_simple.js',
  'safe_migrate_wishlist.js',
  'check_wishlist_data.js',
  'check_wishlist_tables.js'
];

// Use __dirname directly since this script is in the migrations directory
const migrationsDir = __dirname;
const archiveDir = path.join(migrationsDir, 'archive');

console.log('Script directory:', __dirname);
console.log('Looking for files in:', migrationsDir);
console.log('Archive directory:', archiveDir);

// List files in current directory
const filesInDir = fs.readdirSync(migrationsDir);
console.log('Files in directory:', filesInDir.filter(f => filesToArchive.includes(f)));

// Create archive directory if it doesn't exist
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
  console.log('Created archive directory');
}

// Move files
let movedCount = 0;
for (const file of filesToArchive) {
  const sourcePath = path.join(migrationsDir, file);
  const destPath = path.join(archiveDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, destPath);
    console.log(`Moved: ${file}`);
    movedCount++;
  } else {
    console.log(`File not found: ${file}`);
  }
}

console.log(`\nMoved ${movedCount}/${filesToArchive.length} files to archive/`);
