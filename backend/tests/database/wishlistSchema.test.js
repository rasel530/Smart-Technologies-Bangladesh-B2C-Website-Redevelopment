/**
 * Wishlist Database Schema Test Suite
 * 
 * This test suite verifies the database schema for wishlist functionality:
 * - Table structure and columns
 * - Indexes and constraints
 * - Foreign key relationships
 * - Cascading deletes
 * - Triggers
 * - Idempotent migration
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Read the migration file for reference
const migrationPath = path.join(__dirname, '../../migrations/phase6_milestone2_wishlist.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

describe('Wishlist Database Schema Tests', () => {
  /**
   * Test wishlists table structure
   */
  describe('wishlists Table Structure', () => {
    it('should have correct columns', async () => {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'wishlists'
        ORDER BY ordinal_position
      `;

      const expectedColumns = [
        { name: 'id', type: 'uuid', nullable: false, hasDefault: true },
        { name: 'user_id', type: 'uuid', nullable: false, hasDefault: false },
        { name: 'name', type: 'character varying', nullable: true, hasDefault: false },
        { name: 'is_default', type: 'boolean', nullable: false, hasDefault: true },
        { name: 'is_public', type: 'boolean', nullable: false, hasDefault: true },
        { name: 'share_token', type: 'character varying', nullable: true, hasDefault: false },
        { name: 'created_at', type: 'timestamp without time zone', nullable: false, hasDefault: true },
        { name: 'updated_at', type: 'timestamp without time zone', nullable: false, hasDefault: true }
      ];

      expectedColumns.forEach(expected => {
        const column = columns.find(c => c.column_name === expected.name);
        expect(column).toBeDefined();
        expect(column.data_type).toContain(expected.type);
        expect(column.is_nullable).toBe(expected.nullable ? 'NO' : 'YES');
      });
    });

    it('should have primary key on id', async () => {
      const constraints = await prisma.$queryRaw`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'wishlists' AND constraint_type = 'PRIMARY KEY'
      `;

      expect(constraints.length).toBe(1);
      expect(constraints[0].constraint_name).toBeDefined();
    });

    it('should have unique constraint on share_token', async () => {
      const constraints = await prisma.$queryRaw`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'wishlists'
          AND ccu.column_name = 'share_token'
      `;

      expect(constraints.some(c => c.constraint_type === 'UNIQUE')).toBe(true);
    });

    it('should have unique constraint for default wishlist per user', async () => {
      const constraints = await prisma.$queryRaw`
        SELECT pg_get_constraintdef(oid) as constraint_def
        FROM pg_constraint
        WHERE conrelid = 'wishlists'::regclass
          AND contype = 'u'
      `;

      const hasDefaultConstraint = constraints.some(c =>
        c.constraint_def && c.constraint_def.includes('is_default')
      );

      expect(hasDefaultConstraint).toBe(true);
    });
  });

  /**
   * Test wishlist_items table structure
   */
  describe('wishlist_items Table Structure', () => {
    it('should have correct columns', async () => {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'wishlist_items'
        ORDER BY ordinal_position
      `;

      const expectedColumns = [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'wishlist_id', type: 'uuid', nullable: false },
        { name: 'product_id', type: 'uuid', nullable: false },
        { name: 'added_at', type: 'timestamp without time zone', nullable: false }
      ];

      expectedColumns.forEach(expected => {
        const column = columns.find(c => c.column_name === expected.name);
        expect(column).toBeDefined();
        expect(column.data_type).toContain(expected.type);
        expect(column.is_nullable).toBe(expected.nullable ? 'NO' : 'YES');
      });
    });

    it('should have unique constraint on (wishlist_id, product_id)', async () => {
      const constraints = await prisma.$queryRaw`
        SELECT pg_get_constraintdef(oid) as constraint_def
        FROM pg_constraint
        WHERE conrelid = 'wishlist_items'::regclass
          AND contype = 'u'
      `;

      const hasUniqueConstraint = constraints.some(c =>
        c.constraint_def && 
        c.constraint_def.includes('wishlist_id') && 
        c.constraint_def.includes('product_id')
      );

      expect(hasUniqueConstraint).toBe(true);
    });
  });

  /**
   * Test wishlist_analytics table structure
   */
  describe('wishlist_analytics Table Structure', () => {
    it('should have correct columns', async () => {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'wishlist_analytics'
        ORDER BY ordinal_position
      `;

      const expectedColumns = [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'wishlist_id', type: 'uuid', nullable: false },
        { name: 'event_type', type: 'character varying', nullable: false },
        { name: 'user_id', type: 'uuid', nullable: true },
        { name: 'metadata', type: 'jsonb', nullable: true },
        { name: 'created_at', type: 'timestamp without time zone', nullable: false }
      ];

      expectedColumns.forEach(expected => {
        const column = columns.find(c => c.column_name === expected.name);
        expect(column).toBeDefined();
        expect(column.data_type).toContain(expected.type);
        expect(column.is_nullable).toBe(expected.nullable ? 'NO' : 'YES');
      });
    });

    it('should have check constraint for valid event types', async () => {
      const constraints = await prisma.$queryRaw`
        SELECT pg_get_constraintdef(oid) as constraint_def
        FROM pg_constraint
        WHERE conrelid = 'wishlist_analytics'::regclass
          AND contype = 'c'
      `;

      const hasEventTypeConstraint = constraints.some(c =>
        c.constraint_def && 
        c.constraint_def.includes('event_type')
      );

      expect(hasEventTypeConstraint).toBe(true);
    });
  });

  /**
   * Test indexes
   */
  describe('Database Indexes', () => {
    it('should have index on wishlists.user_id', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'wishlists'
      `;

      const hasUserIdIndex = indexes.some(i => 
        i.indexdef && i.indexdef.includes('user_id')
      );

      expect(hasUserIdIndex).toBe(true);
    });

    it('should have partial index on wishlists.share_token (where not null)', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'wishlists'
      `;

      const hasShareTokenIndex = indexes.some(i =>
        i.indexdef && 
        i.indexdef.includes('share_token') &&
        i.indexdef.includes('WHERE')
      );

      expect(hasShareTokenIndex).toBe(true);
    });

    it('should have partial index on wishlists.is_public (where true)', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'wishlists'
      `;

      const hasPublicIndex = indexes.some(i =>
        i.indexdef && 
        i.indexdef.includes('is_public') &&
        i.indexdef.includes('WHERE')
      );

      expect(hasPublicIndex).toBe(true);
    });

    it('should have indexes on wishlist_items', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'wishlist_items'
      `;

      const hasWishlistIdIndex = indexes.some(i =>
        i.indexdef && i.indexdef.includes('wishlist_id')
      );
      const hasProductIdIndex = indexes.some(i =>
        i.indexdef && i.indexdef.includes('product_id')
      );
      const hasAddedAtIndex = indexes.some(i =>
        i.indexdef && i.indexdef.includes('added_at')
      );

      expect(hasWishlistIdIndex).toBe(true);
      expect(hasProductIdIndex).toBe(true);
      expect(hasAddedAtIndex).toBe(true);
    });

    it('should have indexes on wishlist_analytics', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'wishlist_analytics'
      `;

      const hasWishlistIdIndex = indexes.some(i =>
        i.indexdef && i.indexdef.includes('wishlist_id')
      );
      const hasEventTypeIndex = indexes.some(i =>
        i.indexdef && i.indexdef.includes('event_type')
      );
      const hasCreatedAtIndex = indexes.some(i =>
        i.indexdef && i.indexdef.includes('created_at')
      );

      expect(hasWishlistIdIndex).toBe(true);
      expect(hasEventTypeIndex).toBe(true);
      expect(hasCreatedAtIndex).toBe(true);
    });
  });

  /**
   * Test foreign key constraints
   */
  describe('Foreign Key Constraints', () => {
    it('should have foreign key from wishlists.user_id to users.id', async () => {
      const fks = await prisma.$queryRaw`
        SELECT tc.constraint_name, tc.constraint_type, ccu.column_name, ccu.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'wishlists'
          AND tc.constraint_type = 'FOREIGN KEY'
      `;

      const hasUserFk = fks.some(fk =>
        fk.column_name === 'user_id' && fk.table_name === 'users'
      );

      expect(hasUserFk).toBe(true);
    });

    it('should have foreign key from wishlist_items.wishlist_id to wishlists.id with CASCADE', async () => {
      const fks = await prisma.$queryRaw`
        SELECT 
          tc.constraint_name,
          ccu.column_name,
          ccu.table_name,
          pg_get_constraintdef(oid) as constraint_def
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'wishlist_items'
          AND tc.constraint_type = 'FOREIGN KEY'
      `;

      const wishlistFk = fks.find(fk =>
        fk.column_name === 'wishlist_id' && fk.table_name === 'wishlists'
      );

      expect(wishlistFk).toBeDefined();
      expect(wishlistFk.constraint_def).toContain('CASCADE');
    });

    it('should have foreign key from wishlist_items.product_id to products.id with CASCADE', async () => {
      const fks = await prisma.$queryRaw`
        SELECT 
          tc.constraint_name,
          ccu.column_name,
          ccu.table_name,
          pg_get_constraintdef(oid) as constraint_def
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'wishlist_items'
          AND tc.constraint_type = 'FOREIGN KEY'
      `;

      const productFk = fks.find(fk =>
        fk.column_name === 'product_id' && fk.table_name === 'products'
      );

      expect(productFk).toBeDefined();
      expect(productFk.constraint_def).toContain('CASCADE');
    });

    it('should have foreign key from wishlist_analytics.wishlist_id to wishlists.id with CASCADE', async () => {
      const fks = await prisma.$queryRaw`
        SELECT 
          tc.constraint_name,
          ccu.column_name,
          ccu.table_name,
          pg_get_constraintdef(oid) as constraint_def
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'wishlist_analytics'
          AND tc.constraint_type = 'FOREIGN KEY'
      `;

      const wishlistFk = fks.find(fk =>
        fk.column_name === 'wishlist_id' && fk.table_name === 'wishlists'
      );

      expect(wishlistFk).toBeDefined();
      expect(wishlistFk.constraint_def).toContain('CASCADE');
    });
  });

  /**
   * Test cascading deletes
   */
  describe('Cascading Deletes', () => {
    let testUser;
    let testProduct;

    beforeAll(async () => {
      // Create test data
      testUser = await prisma.user.create({
        data: {
          email: 'cascade.test@example.com',
          password: 'hashedpassword',
          firstName: 'Cascade',
          lastName: 'Test'
        }
      });

      testProduct = await prisma.product.create({
        data: {
          sku: 'CASCADE-TEST-' + Date.now(),
          name: 'Cascade Test Product',
          slug: 'cascade-test-product-' + Date.now(),
          categoryId: (await prisma.category.create({
            data: { name: 'Test Category', slug: 'test-cat-' + Date.now() }
          })).id,
          brandId: (await prisma.brand.create({
            data: { name: 'Test Brand', slug: 'test-brand-' + Date.now() }
          })).id,
          regularPrice: 100
        }
      });
    });

    afterAll(async () => {
      // Cleanup
      await prisma.wishlistItem.deleteMany({
        where: { wishlist: { userId: testUser.id } }
      });
      await prisma.wishlist.deleteMany({
        where: { userId: testUser.id }
      });
      await prisma.product.delete({ where: { id: testProduct.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should cascade delete wishlist_items when wishlist is deleted', async () => {
      // Create wishlist with items
      const wishlist = await prisma.wishlist.create({
        data: {
          userId: testUser.id,
          name: 'Cascade Test Wishlist'
        }
      });

      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId: testProduct.id
        }
      });

      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId: testProduct.id // Same product, different item
        }
      });

      // Verify items exist
      const itemsBefore = await prisma.wishlistItem.findMany({
        where: { wishlistId: wishlist.id }
      });
      expect(itemsBefore.length).toBe(2);

      // Delete wishlist
      await prisma.wishlist.delete({ where: { id: wishlist.id } });

      // Verify items are cascade deleted
      const itemsAfter = await prisma.wishlistItem.findMany({
        where: { wishlistId: wishlist.id }
      });
      expect(itemsAfter.length).toBe(0);
    });

    it('should cascade delete wishlist_analytics when wishlist is deleted', async () => {
      // Create wishlist with analytics
      const wishlist = await prisma.wishlist.create({
        data: {
          userId: testUser.id,
          name: 'Analytics Cascade Test'
        }
      });

      await prisma.wishlistAnalytics.create({
        data: {
          wishlistId: wishlist.id,
          eventType: 'view'
        }
      });

      await prisma.wishlistAnalytics.create({
        data: {
          wishlistId: wishlist.id,
          eventType: 'add_item'
        }
      });

      // Verify analytics exist
      const analyticsBefore = await prisma.wishlistAnalytics.findMany({
        where: { wishlistId: wishlist.id }
      });
      expect(analyticsBefore.length).toBe(2);

      // Delete wishlist
      await prisma.wishlist.delete({ where: { id: wishlist.id } });

      // Verify analytics are cascade deleted
      const analyticsAfter = await prisma.wishlistAnalytics.findMany({
        where: { wishlistId: wishlist.id }
      });
      expect(analyticsAfter.length).toBe(0);
    });
  });

  /**
   * Test trigger for updated_at
   */
  describe('Updated At Trigger', () => {
    let testUser;

    beforeAll(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'trigger.test@example.com',
          password: 'hashedpassword',
          firstName: 'Trigger',
          lastName: 'Test'
        }
      });
    });

    afterAll(async () => {
      await prisma.wishlist.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should update updated_at timestamp on row update', async () => {
      // Create wishlist
      const wishlist = await prisma.wishlist.create({
        data: {
          userId: testUser.id,
          name: 'Trigger Test Wishlist'
        }
      });

      // Get initial updated_at
      const initialUpdatedAt = wishlist.updatedAt;

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update wishlist
      const updatedWishlist = await prisma.wishlist.update({
        where: { id: wishlist.id },
        data: { name: 'Updated Name' }
      });

      // Verify updated_at changed
      expect(updatedWishlist.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });

    it('should have trigger defined', async () => {
      const triggers = await prisma.$queryRaw`
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'wishlists'
      `;

      const hasUpdateTrigger = triggers.some(t =>
        t.trigger_name && t.trigger_name.includes('updated_at')
      );

      expect(hasUpdateTrigger).toBe(true);
    });
  });

  /**
   * Test idempotent migration
   */
  describe('Idempotent Migration', () => {
    it('should be able to run migration multiple times without errors', async () => {
      // Re-read and execute migration again
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
        .join(';');

      // This should not throw an error
      await expect(
        prisma.$executeRaw`${statements}`
      ).resolves.not.toThrow();
    });

    it('should not duplicate tables after re-running migration', async () => {
      const tables = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('wishlists', 'wishlist_items', 'wishlist_analytics')
      `;

      expect(tables.length).toBe(3);
    });
  });
});
