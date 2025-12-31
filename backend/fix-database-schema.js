const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');

async function fixDatabaseSchema() {
  console.log('🔧 Starting Database Schema Fixes...\n');
  
  // Database connection details
  const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'smart_ecommerce_dev',
    user: 'smart_dev',
    password: 'smart_dev_password_2024'
  };
  
  const client = new Client(dbConfig);
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully\n');
    
    // Step 1: Check current enum values for UserStatus
    console.log('🔍 Step 1: Checking UserStatus enum values...');
    const enumQuery = `
      SELECT e.enumlabel 
      FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'UserStatus'
      ORDER BY e.enumsortorder;
    `;
    
    const enumResult = await client.query(enumQuery);
    const currentEnumValues = enumResult.rows.map(row => row.enumlabel);
    console.log('Current UserStatus enum values:', currentEnumValues);
    
    // Step 2: Fix UserStatus enum if PENDING is missing
    if (!currentEnumValues.includes('PENDING')) {
      console.log('🔧 Adding missing PENDING value to UserStatus enum...');
      await client.query(`ALTER TYPE "UserStatus" ADD VALUE 'PENDING';`);
      console.log('✅ Added PENDING value to UserStatus enum');
    } else {
      console.log('✅ PENDING value already exists in UserStatus enum');
    }
    
    // Step 3: Check and add missing foreign key constraints
    console.log('\n🔍 Step 2: Checking foreign key constraints...');
    
    // Get all current foreign key constraints
    const fkQuery = `
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public';
    `;
    
    const fkResult = await client.query(fkQuery);
    const existingFKs = fkResult.rows.map(row => row.constraint_name);
    console.log('Current foreign key constraints:', existingFKs.length);
    
    // Define required foreign key constraints based on Prisma schema
    const requiredFKs = [
      {
        name: 'addresses_userId_fkey',
        table: 'addresses',
        column: 'userId',
        foreignTable: 'users',
        foreignColumn: 'id'
      },
      {
        name: 'categories_parentId_fkey',
        table: 'categories',
        column: 'parentId',
        foreignTable: 'categories',
        foreignColumn: 'id'
      },
      {
        name: 'products_categoryId_fkey',
        table: 'products',
        column: 'categoryId',
        foreignTable: 'categories',
        foreignColumn: 'id'
      },
      {
        name: 'products_brandId_fkey',
        table: 'products',
        column: 'brandId',
        foreignTable: 'brands',
        foreignColumn: 'id'
      },
      {
        name: 'user_sessions_userId_fkey',
        table: 'user_sessions',
        column: 'userId',
        foreignTable: 'users',
        foreignColumn: 'id'
      },
      {
        name: 'user_social_accounts_userId_fkey',
        table: 'user_social_accounts',
        column: 'userId',
        foreignTable: 'users',
        foreignColumn: 'id'
      },
      {
        name: 'product_images_productId_fkey',
        table: 'product_images',
        column: 'productId',
        foreignTable: 'products',
        foreignColumn: 'id'
      },
      {
        name: 'product_specifications_productId_fkey',
        table: 'product_specifications',
        column: 'productId',
        foreignTable: 'products',
        foreignColumn: 'id'
      },
      {
        name: 'product_variants_productId_fkey',
        table: 'product_variants',
        column: 'productId',
        foreignTable: 'products',
        foreignColumn: 'id'
      },
      {
        name: 'cart_items_cartId_fkey',
        table: 'cart_items',
        column: 'cartId',
        foreignTable: 'carts',
        foreignColumn: 'id'
      },
      {
        name: 'cart_items_productId_fkey',
        table: 'cart_items',
        column: 'productId',
        foreignTable: 'products',
        foreignColumn: 'id'
      },
      {
        name: 'cart_items_variantId_fkey',
        table: 'cart_items',
        column: 'variantId',
        foreignTable: 'product_variants',
        foreignColumn: 'id'
      },
      {
        name: 'carts_userId_fkey',
        table: 'carts',
        column: 'userId',
        foreignTable: 'users',
        foreignColumn: 'id'
      },
      {
        name: 'wishlist_items_wishlistId_fkey',
        table: 'wishlist_items',
        column: 'wishlistId',
        foreignTable: 'wishlists',
        foreignColumn: 'id'
      },
      {
        name: 'wishlist_items_productId_fkey',
        table: 'wishlist_items',
        column: 'productId',
        foreignTable: 'products',
        foreignColumn: 'id'
      },
      {
        name: 'wishlists_userId_fkey',
        table: 'wishlists',
        column: 'userId',
        foreignTable: 'users',
        foreignColumn: 'id'
      },
      {
        name: 'orders_userId_fkey',
        table: 'orders',
        column: 'userId',
        foreignTable: 'users',
        foreignColumn: 'id'
      },
      {
        name: 'orders_addressId_fkey',
        table: 'orders',
        column: 'addressId',
        foreignTable: 'addresses',
        foreignColumn: 'id'
      },
      {
        name: 'order_items_orderId_fkey',
        table: 'order_items',
        column: 'orderId',
        foreignTable: 'orders',
        foreignColumn: 'id'
      },
      {
        name: 'order_items_productId_fkey',
        table: 'order_items',
        column: 'productId',
        foreignTable: 'products',
        foreignColumn: 'id'
      },
      {
        name: 'order_items_variantId_fkey',
        table: 'order_items',
        column: 'variantId',
        foreignTable: 'product_variants',
        foreignColumn: 'id'
      },
      {
        name: 'transactions_orderId_fkey',
        table: 'transactions',
        column: 'orderId',
        foreignTable: 'orders',
        foreignColumn: 'id'
      },
      {
        name: 'reviews_productId_fkey',
        table: 'reviews',
        column: 'productId',
        foreignTable: 'products',
        foreignColumn: 'id'
      },
      {
        name: 'reviews_userId_fkey',
        table: 'reviews',
        column: 'userId',
        foreignTable: 'users',
        foreignColumn: 'id'
      },
      {
        name: 'email_verification_tokens_userId_fkey',
        table: 'email_verification_tokens',
        column: 'userId',
        foreignTable: 'users',
        foreignColumn: 'id'
      },
      {
        name: 'phone_otps_userId_fkey',
        table: 'phone_otps',
        column: 'userId',
        foreignTable: 'users',
        foreignColumn: 'id'
      },
      {
        name: 'password_history_userId_fkey',
        table: 'password_history',
        column: 'userId',
        foreignTable: 'users',
        foreignColumn: 'id'
      }
    ];
    
    // Add missing foreign key constraints
    for (const fk of requiredFKs) {
      if (!existingFKs.includes(fk.name)) {
        console.log(`🔧 Adding foreign key constraint: ${fk.name}`);
        try {
          const addFKQuery = `
            ALTER TABLE "${fk.table}" 
            ADD CONSTRAINT "${fk.name}" 
            FOREIGN KEY ("${fk.column}") 
            REFERENCES "${fk.foreignTable}"("${fk.foreignColumn}")
            ON DELETE CASCADE;
          `;
          await client.query(addFKQuery);
          console.log(`✅ Added foreign key constraint: ${fk.name}`);
        } catch (error) {
          console.log(`⚠️  Failed to add ${fk.name}: ${error.message}`);
        }
      } else {
        console.log(`✅ Foreign key constraint already exists: ${fk.name}`);
      }
    }
    
    // Step 4: Check and add missing indexes
    console.log('\n🔍 Step 3: Checking indexes...');
    
    // Get all current indexes
    const indexQuery = `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname NOT LIKE '%_pkey';
    `;
    
    const indexResult = await client.query(indexQuery);
    const existingIndexes = indexResult.rows.map(row => row.indexname);
    console.log('Current indexes:', existingIndexes.length);
    
    // Define required indexes based on Prisma schema
    const requiredIndexes = [
      {
        name: 'categories_parentId_idx',
        table: 'categories',
        columns: ['parentId']
      },
      {
        name: 'products_categoryId_idx',
        table: 'products',
        columns: ['categoryId']
      },
      {
        name: 'products_brandId_idx',
        table: 'products',
        columns: ['brandId']
      },
      {
        name: 'user_sessions_token_idx',
        table: 'user_sessions',
        columns: ['token']
      },
      {
        name: 'users_email_idx',
        table: 'users',
        columns: ['email']
      },
      {
        name: 'users_phone_idx',
        table: 'users',
        columns: ['phone']
      },
      {
        name: 'products_sku_idx',
        table: 'products',
        columns: ['sku']
      },
      {
        name: 'products_slug_idx',
        table: 'products',
        columns: ['slug']
      },
      {
        name: 'brands_slug_idx',
        table: 'brands',
        columns: ['slug']
      },
      {
        name: 'categories_slug_idx',
        table: 'categories',
        columns: ['slug']
      },
      {
        name: 'orders_orderNumber_idx',
        table: 'orders',
        columns: ['orderNumber']
      },
      {
        name: 'email_verification_tokens_token_idx',
        table: 'email_verification_tokens',
        columns: ['token']
      },
      {
        name: 'phone_otps_phone_idx',
        table: 'phone_otps',
        columns: ['phone']
      }
    ];
    
    // Add missing indexes
    for (const index of requiredIndexes) {
      if (!existingIndexes.includes(index.name)) {
        console.log(`🔧 Adding index: ${index.name}`);
        try {
          const addIndexQuery = `
            CREATE INDEX "${index.name}" 
            ON "${index.table}"(${index.columns.map(col => `"${col}"`).join(', ')});
          `;
          await client.query(addIndexQuery);
          console.log(`✅ Added index: ${index.name}`);
        } catch (error) {
          console.log(`⚠️  Failed to add ${index.name}: ${error.message}`);
        }
      } else {
        console.log(`✅ Index already exists: ${index.name}`);
      }
    }
    
    // Step 5: Verify all changes
    console.log('\n🔍 Step 4: Verifying changes...');
    
    // Verify enum values
    const enumVerifyResult = await client.query(enumQuery);
    const finalEnumValues = enumVerifyResult.rows.map(row => row.enumlabel);
    console.log('✅ Final UserStatus enum values:', finalEnumValues);
    
    // Verify foreign key constraints
    const fkVerifyResult = await client.query(fkQuery);
    const finalFKs = fkVerifyResult.rows.map(row => row.constraint_name);
    console.log(`✅ Final foreign key constraints count: ${finalFKs.length}`);
    
    // Verify indexes
    const indexVerifyResult = await client.query(indexQuery);
    const finalIndexes = indexVerifyResult.rows.map(row => row.indexname);
    console.log(`✅ Final indexes count: ${finalIndexes.length}`);
    
    // Step 6: Test basic database operations
    console.log('\n🧪 Step 5: Testing database operations...');
    
    try {
      // Test creating a user with PENDING status
      const testUserQuery = `
        INSERT INTO users (id, email, firstName, lastName, status, role) 
        VALUES ('test-user-123', 'test@example.com', 'Test', 'User', 'PENDING', 'CUSTOMER')
        ON CONFLICT (email) DO NOTHING;
      `;
      await client.query(testUserQuery);
      console.log('✅ Successfully created/verified user with PENDING status');
      
      // Test selecting user
      const selectUserQuery = `SELECT status FROM users WHERE email = 'test@example.com';`;
      const userResult = await client.query(selectUserQuery);
      if (userResult.rows.length > 0) {
        console.log(`✅ User status verification: ${userResult.rows[0].status}`);
      }
      
      // Clean up test user
      await client.query("DELETE FROM users WHERE email = 'test@example.com';");
      console.log('✅ Cleaned up test user');
      
    } catch (error) {
      console.log(`⚠️  Database operation test failed: ${error.message}`);
    }
    
    console.log('\n🎉 Database schema fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    throw error;
  } finally {
    await client.end();
    console.log('📡 Database connection closed');
  }
}

// Run the schema fixes
if (require.main === module) {
  fixDatabaseSchema()
    .then(() => {
      console.log('\n✅ Schema fix process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Schema fix process failed:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabaseSchema };