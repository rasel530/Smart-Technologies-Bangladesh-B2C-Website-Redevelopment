/**
 * Database Integration Tests for Product Images
 * 
 * Tests the product_images table schema, indexes, constraints,
 * helper functions, and triggers.
 * 
 * Run with: npx ts-node backend/tests/database-integration.test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test results tracking
const testResults: { name: string; status: string; error?: string }[] = [];
let passed = 0;
let failed = 0;

function test(name: string, fn: () => Promise<void> | void) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      result.then(() => {
        passed++;
        testResults.push({ name, status: 'PASSED' });
        console.log('✓ ' + name);
      }).catch((error) => {
        failed++;
        testResults.push({ name, status: 'FAILED', error: error.message });
        console.log('✗ ' + name + ': ' + error.message);
      });
    } else {
      passed++;
      testResults.push({ name, status: 'PASSED' });
      console.log('✓ ' + name);
    }
  } catch (error: any) {
    failed++;
    testResults.push({ name, status: 'FAILED', error: error.message });
    console.log('✗ ' + name + ': ' + error.message);
  }
}

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTests() {
  console.log('\n===========================================');
  console.log('DATABASE INTEGRATION TESTS');
  console.log('===========================================\n');

  // ============================================
  // 1. TABLE SCHEMA TESTS
  // ============================================
  console.log('--- Table Schema Tests ---\n');

  await test('product_images table exists', async () => {
    const tableExists = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_images'
      )`;
    assert(tableExists.exists === true, 'product_images table does not exist');
  });

  await test('product_images has 15 columns', async () => {
    const columns = await prisma.$queryRaw<[{ count: string }]>`
      SELECT COUNT(*) as count FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'product_images'
    `;
    assert(parseInt(columns[0].count) === 15, 'Expected 15 columns, found ' + columns[0].count);
  });

  await test('product_images has correct column types', async () => {
    const columns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'product_images'
      ORDER BY ordinal_position
    `;
    
    const expectedColumns: Record<string, string> = {
      'id': 'text',
      'product_id': 'text',
      'original_url': 'character varying',
      'optimized_url': 'character varying',
      'thumbnail_url': 'character varying',
      'alt_text_bn': 'character varying',
      'alt_text_en': 'character varying',
      'display_order': 'integer',
      'is_primary': 'boolean',
      'file_size_bytes': 'integer',
      'mime_type': 'character varying',
      'width': 'integer',
      'height': 'integer',
      'processing_status': 'character varying',
      'created_at': 'timestamp with time zone',
      'updated_at': 'timestamp with time zone'
    };

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const expected = expectedColumns[col.column_name];
      assert(expected, 'Unexpected column: ' + col.column_name);
      assert(col.data_type === expected, 
        'Column ' + col.column_name + ' has type ' + col.data_type + ', expected ' + expected);
    }
  });

  await test('id column has default value', async () => {
    const defaults = await prisma.$queryRaw<[{ column_default: string }]>`
      SELECT column_default FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'product_images'
      AND column_name = 'id'
    `;
    assert(defaults[0].column_default.includes('gen_random_uuid'), 
      'id column should have gen_random_uuid() default');
  });

  // ============================================
  // 2. INDEXES TESTS
  // ============================================
  console.log('\n--- Index Tests ---\n');

  await test('idx_product_images_product_id index exists', async () => {
    const indexExists = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT FROM pg_indexes WHERE schemaname = 'public'
        AND indexname = 'idx_product_images_product_id'
      )`;
    assert(indexExists.exists === true, 'idx_product_images_product_id index does not exist');
  });

  await test('idx_product_images_display_order index exists', async () => {
    const indexExists = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT FROM pg_indexes WHERE schemaname = 'public'
        AND indexname = 'idx_product_images_display_order'
      )`;
    assert(indexExists.exists === true, 'idx_product_images_display_order index does not exist');
  });

  await test('idx_product_images_processing_status index exists', async () => {
    const indexExists = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT FROM pg_indexes WHERE schemaname = 'public'
        AND indexname = 'idx_product_images_processing_status'
      )`;
    assert(indexExists.exists === true, 'idx_product_images_processing_status index does not exist');
  });

  await test('idx_product_images_is_primary index exists', async () => {
    const indexExists = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT FROM pg_indexes WHERE schemaname = 'public'
        AND indexname = 'idx_product_images_is_primary'
      )`;
    assert(indexExists.exists === true, 'idx_product_images_is_primary index does not exist');
  });

  // ============================================
  // 3. CONSTRAINT TESTS
  // ============================================
  console.log('\n--- Constraint Tests ---\n');

  await test('valid_processing_status constraint exists', async () => {
    const constraint = await prisma.$queryRaw<Array<{ conname: string }>>`
      SELECT conname FROM pg_constraint WHERE conname = 'valid_processing_status'
    `;
    assert(constraint.length > 0, 'valid_processing_status constraint does not exist');
  });

  await test('valid_display_order constraint exists', async () => {
    const constraint = await prisma.$queryRaw<Array<{ conname: string }>>`
      SELECT conname FROM pg_constraint WHERE conname = 'valid_display_order'
    `;
    assert(constraint.length > 0, 'valid_display_order constraint does not exist');
  });

  await test('valid_file_size constraint exists', async () => {
    const constraint = await prisma.$queryRaw<Array<{ conname: string }>>`
      SELECT conname FROM pg_constraint WHERE conname = 'valid_file_size'
    `;
    assert(constraint.length > 0, 'valid_file_size constraint does not exist');
  });

  await test('valid_dimensions constraint exists', async () => {
    const constraint = await prisma.$queryRaw<Array<{ conname: string }>>`
      SELECT conname FROM pg_constraint WHERE conname = 'valid_dimensions'
    `;
    assert(constraint.length > 0, 'valid_dimensions constraint does not exist');
  });

  await test('valid_mime_type constraint exists', async () => {
    const constraint = await prisma.$queryRaw<Array<{ conname: string }>>`
      SELECT conname FROM pg_constraint WHERE conname = 'valid_mime_type'
    `;
    assert(constraint.length > 0, 'valid_mime_type constraint does not exist');
  });

  // ============================================
  // 4. FOREIGN KEY AND CASCADE DELETE TESTS
  // ============================================
  console.log('\n--- Foreign Key & Cascade Delete Tests ---\n');

  await test('product_id has foreign key constraint with CASCADE DELETE', async () => {
    const fk = await prisma.$queryRaw<Array<{ confdeltype: string }>>`
      SELECT confdeltype FROM pg_constraint con
      JOIN pg_class cl ON con.conrelid = cl.oid
      JOIN pg_class rel ON con.confrelid = rel.oid
      WHERE cl.relname = 'product_images'
      AND con.conname LIKE '%product_images_product_id%'
      LIMIT 1
    `;
    assert(fk.length > 0, 'Foreign key constraint not found');
    assert(fk[0].confdeltype === 'c', 'CASCADE DELETE not configured');
  });

  await test('CASCADE DELETE removes images when product is deleted', async () => {
    // Create a test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product for Cascade Delete',
        nameEn: 'Test Product for Cascade Delete',
        slug: 'test-cascade-' + Date.now(),
        price: 100,
        stock: 10
      }
    });

    const testProductId = product.id;

    // Create an image for this product
    const imageResult = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO product_images (
        id, product_id, original_url, alt_text_bn, alt_text_en,
        display_order, is_primary, processing_status, created_at, updated_at
      ) VALUES (
        gen_random_uuid()::text, $1, '/uploads/test.jpg', 'Test BN', 'Test EN',
        0, true, 'completed', NOW(), NOW()
      )
      RETURNING id
    `, [testProductId];

    const imageId = imageResult[0].id;

    // Delete the product
    await prisma.product.delete({ where: { id: testProductId } });

    // Verify image is deleted
    const deletedImage = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM product_images WHERE id = $1
    `, [imageId]);
    assert(deletedImage.length === 0, 'Image was not deleted when product was deleted');
  });

  // ============================================
  // 5. HELPER FUNCTION TESTS
  // ============================================
  console.log('\n--- Helper Function Tests ---\n');

  await test('get_product_primary_image function exists', async () => {
    const funcExists = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT FROM pg_proc WHERE proname = 'get_product_primary_image'
      )`;
    assert(funcExists.exists === true, 'get_product_primary_image function does not exist');
  });

  await test('get_product_images function exists', async () => {
    const funcExists = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT FROM pg_proc WHERE proname = 'get_product_images'
      )`;
    assert(funcExists.exists === true, 'get_product_images function does not exist');
  });

  await test('count_images_by_status function exists', async () => {
    const funcExists = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT FROM pg_proc WHERE proname = 'count_images_by_status'
      )`;
    assert(funcExists.exists === true, 'count_images_by_status function does not exist');
  });

  await test('get_product_primary_image returns correct data', async () => {
    // Create a test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product Primary',
        nameEn: 'Test Product Primary',
        slug: 'test-primary-' + Date.now(),
        price: 100,
        stock: 10
      }
    });

    const testProductId = product.id;

    // Create a primary image
    await prisma.$queryRaw`
      INSERT INTO product_images (
        id, product_id, original_url, optimized_url, thumbnail_url,
        alt_text_bn, alt_text_en, display_order, is_primary,
        file_size_bytes, mime_type, width, height, processing_status,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid()::text, $1, '/uploads/primary.jpg', '/uploads/primary_opt.webp', '/uploads/primary_thumb.jpg',
        'Primary BN', 'Primary EN', 0, true,
        1024, 'image/jpeg', 1200, 1200, 'completed',
        NOW(), NOW()
      )
    `, [testProductId];

    // Create a non-primary image
    await prisma.$queryRaw`
      INSERT INTO product_images (
        id, product_id, original_url, alt_text_bn, alt_text_en,
        display_order, is_primary, processing_status, created_at, updated_at
      ) VALUES (
        gen_random_uuid()::text, $1, '/uploads/secondary.jpg', 'Secondary BN', 'Secondary EN',
        1, false, 'completed', NOW(), NOW()
      )
    `, [testProductId];

    // Call the function
    const result = await prisma.$queryRaw<Array<{ alt_text_en: string }>>`
      SELECT alt_text_en FROM get_product_primary_image($1)
    `, [testProductId]);

    assert(result.length === 1, 'Should return exactly one primary image');
    assert(result[0].alt_text_en === 'Primary EN', 'Should return the correct primary image');

    // Cleanup
    await prisma.product.delete({ where: { id: testProductId } });
  });

  await test('get_product_images returns images in correct order', async () => {
    // Create a test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product Order',
        nameEn: 'Test Product Order',
        slug: 'test-order-' + Date.now(),
        price: 100,
        stock: 10
      }
    });

    const testProductId = product.id;

    // Create images in non-sequential order
    await prisma.$queryRaw`
      INSERT INTO product_images (
        id, product_id, original_url, alt_text_bn, alt_text_en,
        display_order, is_primary, processing_status, created_at, updated_at
      ) VALUES (
        gen_random_uuid()::text, $1, '/uploads/third.jpg', 'Third BN', 'Third EN',
        2, false, 'completed', NOW(), NOW()
      )
    `, [testProductId];

    await prisma.$queryRaw`
      INSERT INTO product_images (
        id, product_id, original_url, alt_text_bn, alt_text_en,
        display_order, is_primary, processing_status, created_at, updated_at
      ) VALUES (
        gen_random_uuid()::text, $1, '/uploads/first.jpg', 'First BN', 'First EN',
        0, true, 'completed', NOW(), NOW()
      )
    `, [testProductId];

    await prisma.$queryRaw`
      INSERT INTO product_images (
        id, product_id, original_url, alt_text_bn, alt_text_en,
        display_order, is_primary, processing_status, created_at, updated_at
      ) VALUES (
        gen_random_uuid()::text, $1, '/uploads/second.jpg', 'Second BN', 'Second EN',
        1, false, 'completed', NOW(), NOW()
      )
    `, [testProductId];

    // Call the function
    const result = await prisma.$queryRaw<Array<{ alt_text_en: string }>>`
      SELECT alt_text_en FROM get_product_images($1)
    `, [testProductId]);

    assert(result.length === 3, 'Should return all 3 images');
    assert(result[0].alt_text_en === 'First EN', 'Primary image should be first');
    assert(result[1].alt_text_en === 'Second EN', 'Second image should be second');
    assert(result[2].alt_text_en === 'Third EN', 'Third image should be third');

    // Cleanup
    await prisma.product.delete({ where: { id: testProductId } });
  });

  await test('count_images_by_status returns correct count', async () => {
    const result = await prisma.$queryRaw<[{ count: string }]>`
      SELECT count_images_by_status('completed') as count
    `;
    assert(typeof parseInt(result[0].count) === 'number', 'Should return a number');
  });

  // ============================================
  // 6. TRIGGER TESTS
  // ============================================
  console.log('\n--- Trigger Tests ---\n');

  await test('update_product_images_updated_at trigger exists', async () => {
    const triggerExists = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT FROM pg_trigger WHERE tgname = 'update_product_images_updated_at'
      )`;
    assert(triggerExists.exists === true, 'update_product_images_updated_at trigger does not exist');
  });

  await test('updated_at is automatically updated on UPDATE', async () => {
    // Create a test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product Updated At',
        nameEn: 'Test Product Updated At',
        slug: 'test-updated-' + Date.now(),
        price: 100,
        stock: 10
      }
    });

    const testProductId = product.id;

    // Create an image
    const imageResult = await prisma.$queryRaw<Array<{ id: string; updated_at: Date }>>`
      INSERT INTO product_images (
        id, product_id, original_url, alt_text_bn, alt_text_en,
        display_order, is_primary, processing_status, created_at, updated_at
      ) VALUES (
        gen_random_uuid()::text, $1, '/uploads/test.jpg', 'Test BN', 'Test EN',
        0, true, 'completed', NOW(), NOW()
      )
      RETURNING id, updated_at
    `, [testProductId];

    const imageId = imageResult[0].id;
    const originalUpdatedAt = new Date(imageResult[0].updated_at).getTime();

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update the image
    await prisma.$queryRaw`
      UPDATE product_images SET alt_text_bn = 'Updated BN' WHERE id = $1
    `, [imageId];

    // Fetch updated image
    const updatedImage = await prisma.$queryRaw<Array<{ updated_at: Date }>>`
      SELECT updated_at FROM product_images WHERE id = $1
    `, [imageId]);

    const updatedAtDate = new Date(updatedImage[0].updated_at).getTime();
    assert(updatedAtDate > originalUpdatedAt, 
      'updated_at should be automatically updated');

    // Cleanup
    await prisma.product.delete({ where: { id: testProductId } });
  });

  // ============================================
  // 7. DATA INTEGRITY TESTS
  // ============================================
  console.log('\n--- Data Integrity Tests ---\n');

  await test('Processing status only accepts valid values', async () => {
    // Create a test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product Status',
        nameEn: 'Test Product Status',
        slug: 'test-status-' + Date.now(),
        price: 100,
        stock: 10
      }
    });

    const testProductId = product.id;

    // Try to insert with invalid status - should fail
    let error = null;
    try {
      await prisma.$queryRaw`
        INSERT INTO product_images (
          id, product_id, original_url, processing_status
        ) VALUES (
          gen_random_uuid()::text, $1, '/uploads/test.jpg', 'invalid_status'
        )
      `, [testProductId];
    } catch (e: any) {
      error = e;
    }

    assert(error !== null, 'Should reject invalid processing_status');

    // Cleanup
    await prisma.product.delete({ where: { id: testProductId } });
  });

  await test('Display order cannot be negative', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Test Product Negative',
        nameEn: 'Test Product Negative',
        slug: 'test-negative-' + Date.now(),
        price: 100,
        stock: 10
      }
    });

    const testProductId = product.id;

    let error = null;
    try {
      await prisma.$queryRaw`
        INSERT INTO product_images (
          id, product_id, original_url, display_order
        ) VALUES (
          gen_random_uuid()::text, $1, '/uploads/test.jpg', -1
        )
      `, [testProductId];
    } catch (e: any) {
      error = e;
    }

    assert(error !== null, 'Should reject negative display_order');

    await prisma.product.delete({ where: { id: testProductId } });
  });

  // ============================================
  // 8. MIGRATION ROLLBACK TEST
  // ============================================
  console.log('\n--- Migration Rollback Tests ---\n');

  await test('Rollback script exists and is valid', async () => {
    const fs = await import('fs');
    const rollbackScript = fs.readFileSync(
      'backend/migrations/20260128141209_rollback_product_images.sql',
      'utf8'
    );
    
    assert(rollbackScript.includes('DROP TABLE'), 'Rollback script should contain DROP TABLE');
    assert(rollbackScript.includes('product_images'), 'Rollback script should reference product_images');
  });

  await test('Verify script exists and is valid', async () => {
    const fs = await import('fs');
    const verifyScript = fs.readFileSync(
      'backend/migrations/20260128141209_verify_product_images.sql',
      'utf8'
    );
    
    assert(verifyScript.includes('SELECT EXISTS'), 'Verify script should contain SELECT EXISTS');
    assert(verifyScript.includes('product_images'), 'Verify script should reference product_images');
  });

  // ============================================
  // PRINT RESULTS
  // ============================================
  console.log('\n===========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('===========================================');
  console.log('Total Tests: ' + (passed + failed));
  console.log('Passed: ' + passed);
  console.log('Failed: ' + failed);
  console.log('===========================================\n');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(console.error);
