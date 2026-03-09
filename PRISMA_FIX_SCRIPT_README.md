# Prisma Schema Fix Script

## Overview

This comprehensive script analyzes the Prisma schema and codebase to identify and fix all model and field naming mismatches between the schema and the code.

## Features

- **Prisma Schema Analysis**: Reads and parses the Prisma schema file to extract all models and their fields
- **Codebase Scanning**: Scans both backend (JavaScript/TypeScript) and frontend (TypeScript/TSX) files
- **Issue Detection**: Identifies naming mismatches including:
  - Backend: Singular model names instead of plural
  - Backend: camelCase field names instead of snake_case
  - Frontend: snake_case field names instead of camelCase
- **Interactive Menu**: User-friendly menu system for selecting fix options
- **Backup System**: Automatically creates backups before making any changes
- **Confirmation Prompts**: Asks for confirmation before applying fixes
- **Detailed Reporting**: Shows comprehensive summaries of all issues found

## Installation

No installation required. The script is a standalone Node.js file.

## Usage

### Run the Script

```bash
node fix-prisma-schema.js
```

### Menu Options

1. **Analyze Prisma schema and codebase**
   - Reads the Prisma schema
   - Extracts all models and their fields
   - Scans backend and frontend files
   - Shows a comprehensive summary of all issues

2. **Fix all backend model name mismatches**
   - Fixes singular model names to plural (e.g., `user` → `users`)
   - Creates backups before applying changes
   - Shows preview of changes
   - Requires confirmation

3. **Fix all backend field name mismatches**
   - Fixes camelCase field names to snake_case (e.g., `firstName` → `first_name`)
   - Creates backups before applying changes
   - Shows preview of changes
   - Requires confirmation

4. **Fix all frontend field name mismatches**
   - Fixes snake_case field names to camelCase (e.g., `first_name` → `firstName`)
   - Creates backups before applying changes
   - Shows preview of changes
   - Requires confirmation

5. **Fix all issues (backend + frontend)**
   - Applies all fixes at once
   - Creates backups before applying changes
   - Shows preview of changes
   - Requires confirmation

6. **Show summary of all changes**
   - Displays a detailed summary of all issues found
   - Categorizes issues by type and location

7. **View specific file**
   - Allows you to view any file with line numbers
   - Optional search term to highlight specific lines

8. **Exit**
   - Exits the script

## Configuration

The script uses the following configuration (can be modified at the top of the file):

```javascript
const CONFIG = {
  backendDir: './backend',
  frontendDir: './frontend',
  prismaSchemaPath: './backend/prisma/schema.prisma',
  backupDir: './backups/prisma-fixes',
  backendExtensions: ['.js', '.ts'],
  frontendExtensions: ['.ts', '.tsx'],
  excludeDirs: ['node_modules', '.next', 'dist', 'build', '.git']
};
```

## Supported Model Name Fixes

The script automatically fixes the following model name mismatches:

### Singular → Plural (Backend)
- `address` → `addresses`
- `brand` → `brands`
- `category` → `categories`
- `cart` → `carts`
- `order` → `orders`
- `product` → `products`
- `review` → `reviews`
- `wishlist` → `wishlists`
- `user` → `users`
- And many more...

## Supported Field Name Fixes

### Backend: camelCase → snake_case
- `firstName` → `first_name`
- `lastName` → `last_name`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `userId` → `user_id`
- `productId` → `product_id`
- `orderId` → `order_id`
- And 500+ more field mappings...

### Frontend: snake_case → camelCase
- `first_name` → `firstName`
- `last_name` → `lastName`
- `created_at` → `createdAt`
- `updated_at` → `updatedAt`
- `user_id` → `userId`
- `product_id` → `productId`
- `order_id` → `orderId`
- And 500+ more field mappings...

## Backup System

The script automatically creates backups before making any changes:

- **Location**: `./backups/prisma-fixes/`
- **Naming**: `backup-YYYY-MM-DDTHH-MM-SS-mmmZ`
- **Content**: Complete directory structure with all modified files
- **Restoration**: Simply copy files from backup to restore

## Safety Features

1. **Automatic Backups**: Always creates backups before modifying files
2. **Confirmation Prompts**: Asks for user confirmation before applying fixes
3. **Detailed Logging**: Shows exactly what changes will be made
4. **Non-Destructive**: Only modifies files that have issues
5. **Rollback Capability**: Backups can be used to restore previous state

## Example Usage

### Analyze the Codebase

```
🚀 Starting Prisma Schema Fix Script...

================================================================================
🔧 PRISMA SCHEMA FIX SCRIPT
================================================================================

1. Analyze Prisma schema and codebase
2. Fix all backend model name mismatches
3. Fix all backend field name mismatches
4. Fix all frontend field name mismatches
5. Fix all issues (backend + frontend)
6. Show summary of all changes
7. View specific file
8. Exit

================================================================================

Please select an option (1-8): 1

📖 Analyzing Prisma schema and codebase...

📖 Reading Prisma schema...
✅ Prisma schema loaded successfully
🔍 Extracting models from Prisma schema...
✅ Found 80+ models in Prisma schema

📊 Prisma Models Found:
  - users: 20+ fields
  - products: 30+ fields
  - orders: 20+ fields
  - ...

🔍 Scanning codebase for issues...

🔍 Scanning backend files for Prisma model usage...
✅ Scanned 150+ backend files, found 45 issues

🔍 Scanning frontend files for Prisma field usage...
✅ Scanned 200+ frontend files, found 78 issues

================================================================================
📊 ISSUES SUMMARY
================================================================================

🔹 Backend Issues: 45

Backend Model Name Issues:
  [backend/controllers/userController.js:15] user → users (3 occurrences)
  [backend/services/orderService.js:23] order → orders (5 occurrences)
  ...

Backend Field Name Issues:
  [backend/controllers/userController.js:18] firstName → first_name (2 occurrences)
  [backend/services/orderService.js:27] createdAt → created_at (4 occurrences)
  ...

🔹 Frontend Issues: 78

Frontend Field Name Issues:
  [frontend/src/components/UserProfile.tsx:12] first_name → firstName (3 occurrences)
  [frontend/src/app/orders/page.tsx:45] created_at → createdAt (6 occurrences)
  ...

🔹 Total Issues: 123
================================================================================
```

### Fix All Issues

```
Please select an option (1-8): 5

🔧 Fixing all issues (backend + frontend)...

📊 Found 123 total issues
Do you want to apply these fixes? (y/n): y

💾 Backing up files...
  ✅ Backed up: backend/controllers/userController.js
  ✅ Backed up: backend/services/orderService.js
  ...
✅ Backup created at: ./backups/prisma-fixes/backup-2026-03-08T04-45-00-000Z

🔧 Applying fixes...

🔧 Fixing: backend/controllers/userController.js
  ✅ Fixed model name: user → users (3 occurrences)
  ✅ Fixed field name: firstName → first_name (2 occurrences)
✅ Fixed: backend/controllers/userController.js (5 total fixes)
...

✅ All fixes applied successfully!
   Backend: 89 fixes in 35 files
   Frontend: 134 fixes in 52 files
```

## Troubleshooting

### Script Not Running

- Ensure Node.js is installed: `node --version`
- Ensure you're in the project root directory
- Check file permissions: `ls -la fix-prisma-schema.js`

### No Issues Found

- The script may have already fixed all issues
- Check if your codebase follows the correct naming conventions
- Verify the Prisma schema path in CONFIG

### Backup Issues

- Ensure the `./backups` directory is writable
- Check disk space availability
- Verify file permissions

## Advanced Usage

### Custom Configuration

Edit the CONFIG object at the top of the script to customize:

```javascript
const CONFIG = {
  backendDir: './my-backend',
  frontendDir: './my-frontend',
  prismaSchemaPath: './my-backend/prisma/schema.prisma',
  backupDir: './my-backups',
  // ... other options
};
```

### Adding Custom Field Mappings

Add new mappings to the BACKEND_FIELD_FIXES object:

```javascript
const BACKEND_FIELD_FIXES = {
  // ... existing mappings
  'myCustomField': 'my_custom_field',
};
```

## Best Practices

1. **Always Run Analysis First**: Use option 1 to understand the scope of issues
2. **Review Changes**: Use option 7 to view files before fixing
3. **Test After Fixes**: Run your application to ensure nothing broke
4. **Keep Backups**: Don't delete backups until you've tested thoroughly
5. **Commit Changes**: Commit fixes with descriptive messages

## Contributing

To add support for additional models or fields:

1. Add the model name to `PRISMA_MODELS` object
2. Add the field mapping to `BACKEND_FIELD_FIXES` object
3. The frontend mapping is automatically generated

## License

This script is part of the Smart Tech B2C Website Redevelopment project.

## Support

For issues or questions:
- Check the troubleshooting section
- Review the backup directory for previous states
- Consult the Prisma schema documentation

## Version History

- **v1.0.0** (2026-03-08): Initial release
  - Comprehensive schema analysis
  - Backend and frontend scanning
  - Interactive menu system
  - Backup and confirmation features
  - 500+ field name mappings
  - 80+ model name mappings
