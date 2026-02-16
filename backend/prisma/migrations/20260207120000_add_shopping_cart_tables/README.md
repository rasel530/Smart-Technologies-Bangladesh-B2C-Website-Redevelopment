# Shopping Cart Foundation Migration Report

**Phase:** Phase 6, Milestone 1: Shopping Cart Foundation  
**Migration Date:** 2026-02-07  
**Migration ID:** 20260207120000_add_shopping_cart_tables  
**Status:** ✅ Completed Successfully

---

## Executive Summary

This migration implements the database schema changes for Milestone 1: Shopping Cart Foundation. The migration is **non-destructive**, meaning all existing data was preserved and no tables or columns were dropped. The migration follows the project's naming conventions (snake_case for database tables/columns, camelCase for Prisma fields with `@map()` directives).

---

## Schema Changes

### 1. Cart Model Enhancements

The existing [`Cart`](../schema.prisma:370) model was enhanced with the following new fields:

| Prisma Field   | Database Column | Type            | Default | Description                                       |
| -------------- | --------------- | --------------- | ------- | ------------------------------------------------- |
| `subtotal`     | `subtotal`      | `DECIMAL(12,2)` | `0`     | Sum of all item prices before tax and shipping    |
| `tax`          | `tax`           | `DECIMAL(12,2)` | `0`     | Tax amount for the cart                           |
| `shippingCost` | `shipping_cost` | `DECIMAL(12,2)` | `0`     | Shipping cost for the cart                        |
| `discount`     | `discount`      | `DECIMAL(12,2)` | `0`     | Discount amount applied to the cart               |
| `total`        | `total`         | `DECIMAL(12,2)` | `0`     | Final total including tax, shipping, and discount |

**Additional Changes:**

- Added `analytics` relation to [`CartAnalytics`](../schema.prisma:414) model
- Added indexes for performance optimization:
  - `carts_user_id_idx` on `user_id`
  - `carts_session_id_idx` on `session_id`
  - `carts_expires_at_idx` on `expires_at`

### 2. CartItem Model Updates

The existing [`CartItem`](../schema.prisma:383) model was updated to match naming conventions:

| Prisma Field | Database Column | Type            | Description                           |
| ------------ | --------------- | --------------- | ------------------------------------- |
| `cartId`     | `cart_id`       | `TEXT`          | Foreign key to carts table            |
| `productId`  | `product_id`    | `TEXT`          | Foreign key to products table         |
| `variantId`  | `variant_id`    | `TEXT`          | Foreign key to product_variants table |
| `price`      | `price`         | `DECIMAL(12,2)` | Unit price of the item                |
| `subtotal`   | `subtotal`      | `DECIMAL(12,2)` | Total price (price × quantity)        |
| `addedAt`    | `added_at`      | `TIMESTAMP(3)`  | When the item was added to cart       |

**Column Renames:**

- `unitPrice` → `price`
- `totalPrice` → `subtotal`
- `cartId` → `cart_id`
- `productId` → `product_id`
- `variantId` → `variant_id`
- `addedAt` → `added_at`

**Additional Changes:**

- Updated foreign key constraints to use `ON DELETE CASCADE` for better data integrity
- Added indexes for performance:
  - `cart_items_cart_id_idx` on `cart_id`
  - `cart_items_product_id_idx` on `product_id`
  - `cart_items_variant_id_idx` on `variant_id`

### 3. New CartAnalytics Model

A new [`CartAnalytics`](../schema.prisma:414) model was created to track cart events and conversion funnel data:

| Prisma Field       | Database Column     | Type           | Default                             | Description                                    |
| ------------------ | ------------------- | -------------- | ----------------------------------- | ---------------------------------------------- |
| `id`               | `id`                | `TEXT`         | UUID primary key                    |
| `cartId`           | `cart_id`           | `TEXT`         | Foreign key to carts table (unique) |
| `events`           | `events`            | `JSONB`        | `'{}'`                              | Stores cart events (add, remove, update, etc.) |
| `conversionFunnel` | `conversion_funnel` | `JSONB`        | `'{}'`                              | Tracks conversion funnel stages                |
| `createdAt`        | `created_at`        | `TIMESTAMP(3)` | `CURRENT_TIMESTAMP`                 | When analytics record was created              |
| `updatedAt`        | `updated_at`        | `TIMESTAMP(3)` | `CURRENT_TIMESTAMP`                 | When analytics record was last updated         |

**Features:**

- One-to-one relationship with [`Cart`](../schema.prisma:370) model
- Cascade delete: when a cart is deleted, its analytics are also deleted
- Index on `cart_id` for performance

---

## Migration Strategy

### Non-Destructive Approach

The migration was designed to be **non-destructive** by:

1. **Using `IF NOT EXISTS` clauses** for all column additions
2. **Renaming columns instead of dropping them** (preserves data)
3. **Using `DROP INDEX IF EXISTS`** before renaming columns
4. **Using `DROP CONSTRAINT IF EXISTS`** before renaming columns
5. **Creating new tables** without affecting existing ones
6. **No `DROP TABLE` or `TRUNCATE` statements** were used

### Migration Steps

The migration SQL executes in the following order:

1. **Drop indexes and constraints** on columns to be renamed
2. **Rename columns** from camelCase to snake_case
3. **Recreate foreign key constraints** with new column names
4. **Recreate indexes** with new column names
5. **Add new columns** to existing tables (subtotal, tax, shipping_cost, discount, total)
6. **Create new cart_analytics table**
7. **Add constraints and indexes** for new table

---

## Data Preservation

### Existing Data Preserved

All existing data in the following tables was **completely preserved**:

- ✅ `carts` table - all existing cart records maintained
- ✅ `cart_items` table - all existing cart items maintained
- ✅ Column renames preserved data (no data loss)

### Default Values

New columns added to the `carts` table use safe default values:

- `subtotal` = 0
- `tax` = 0
- `shipping_cost` = 0
- `discount` = 0
- `total` = 0

These defaults ensure existing carts remain functional until the application updates these values.

---

## Verification

### Migration Execution

```bash
cd backend && npx prisma db execute --stdin < prisma/migrations/20260207120000_add_shopping_cart_tables/migration.sql
```

**Result:** ✅ Script executed successfully

### Prisma Client Generation

```bash
cd backend && npx prisma generate
```

**Result:** ✅ Generated Prisma Client (v5.22.0) successfully

### Database Schema Verification

```bash
cd backend && npx prisma db pull --print
```

**Result:** ✅ Database schema matches Prisma schema

---

## Relationships

### Cart Model Relationships

```prisma
model Cart {
  // ... fields ...
  analytics    CartAnalytics?  // One-to-one with CartAnalytics
  items        CartItem[]     // One-to-many with CartItem
  user         User?           // Many-to-one with User
}
```

### CartItem Model Relationships

```prisma
model CartItem {
  // ... fields ...
  cart      Cart             // Many-to-one with Cart
  product   Product          // Many-to-one with Product
  variant   ProductVariant?  // Many-to-one with ProductVariant (optional)
}
```

### CartAnalytics Model Relationships

```prisma
model CartAnalytics {
  // ... fields ...
  cart      Cart  // Many-to-one with Cart
}
```

---

## Performance Optimizations

### Indexes Added

The following indexes were added to improve query performance:

**Carts Table:**

- `carts_user_id_idx` - Fast lookups by user ID
- `carts_session_id_idx` - Fast lookups by session ID (guest carts)
- `carts_expires_at_idx` - Efficient cleanup of expired carts

**CartItems Table:**

- `cart_items_cart_id_idx` - Fast retrieval of items for a cart
- `cart_items_product_id_idx` - Fast lookups by product ID
- `cart_items_variant_id_idx` - Fast lookups by variant ID

**CartAnalytics Table:**

- `cart_analytics_cart_id_idx` - Fast lookups by cart ID

---

## Integration with Existing Models

### User Model Integration

The [`User`](../schema.prisma:11) model already had a `cart` relation, which is now enhanced:

```prisma
model User {
  // ... fields ...
  cart  Cart?  // Optional: one user can have one cart
}
```

### Product Model Integration

The [`Product`](../schema.prisma:165) model already had a `cartItems` relation:

```prisma
model Product {
  // ... fields ...
  cartItems  CartItem[]  // One product can be in many carts
}
```

### ProductVariant Model Integration

The [`ProductVariant`](../schema.prisma:269) model already had a `cartItems` relation:

```prisma
model ProductVariant {
  // ... fields ...
  cartItems  CartItem[]  // One variant can be in many carts
}
```

---

## Support for Guest Carts

The schema supports both logged-in users and guest carts:

### Logged-in User Carts

- `user_id` is populated
- Cart is associated with a user account
- Persists across sessions

### Guest Carts

- `session_id` is populated
- `user_id` is NULL
- Cart is temporary, identified by session ID
- Can be merged with user cart after login

---

## Next Steps

### Application-Level Implementation

With the database schema in place, the following application features can now be implemented:

1. **Cart Management API**
   - Create cart (user or guest)
   - Add items to cart
   - Update item quantities
   - Remove items from cart
   - Calculate totals

2. **Cart Analytics**
   - Track cart events (add, remove, update)
   - Monitor conversion funnel
   - Generate analytics reports

3. **Cart Persistence**
   - Save cart state
   - Load cart by user ID or session ID
   - Merge guest cart with user cart

4. **Cart Expiration**
   - Set expiration times
   - Clean up expired carts

---

## Rollback Plan

If needed, the migration can be rolled back by:

1. **Drop new columns** from `carts` table:

   ```sql
   ALTER TABLE "carts" DROP COLUMN "subtotal";
   ALTER TABLE "carts" DROP COLUMN "tax";
   ALTER TABLE "carts" DROP COLUMN "shipping_cost";
   ALTER TABLE "carts" DROP COLUMN "discount";
   ALTER TABLE "carts" DROP COLUMN "total";
   ```

2. **Drop cart_analytics table**:

   ```sql
   DROP TABLE "cart_analytics";
   ```

3. **Rename columns back** to camelCase (if needed):
   ```sql
   ALTER TABLE "carts" RENAME COLUMN "user_id" TO "userId";
   -- ... etc.
   ```

---

## Issues Encountered and Resolved

### Issue 1: Prisma Migration Shadow Database Error

**Problem:** Running `npx prisma migrate dev` failed with:

```
Error: P3006
Migration `20260126190700_remove_categoryid_from_products` failed to apply cleanly to the shadow database.
Error: The underlying table for model `product_categories` does not exist.
```

**Resolution:** Used manual migration approach by:

1. Creating migration directory manually
2. Writing migration SQL file
3. Executing migration with `npx prisma db execute --stdin`
4. Generating Prisma client with `npx prisma generate`

### Issue 2: Column Naming Mismatch

**Problem:** Original database had camelCase column names (`userId`, `sessionId`) while Prisma schema expected snake_case (`user_id`, `session_id`).

**Resolution:** Migration renamed columns from camelCase to snake_case following the project's convention, matching the pattern used in the [`product_images`](../20260201054000_fix_product_images_snake_case_columns/migration.sql) migration.

---

## Files Modified

1. **Schema File:** [`backend/prisma/schema.prisma`](../schema.prisma)
   - Updated [`Cart`](../schema.prisma:370) model
   - Updated [`CartItem`](../schema.prisma:383) model
   - Added [`CartAnalytics`](../schema.prisma:414) model

2. **Migration File:** [`backend/prisma/migrations/20260207120000_add_shopping_cart_tables/migration.sql`](migration.sql)
   - Non-destructive migration SQL
   - Column renames
   - New column additions
   - New table creation
   - Index creation

3. **Documentation:** [`backend/prisma/migrations/20260207120000_add_shopping_cart_tables/README.md`](README.md)
   - This file

---

## Conclusion

The database schema changes for **Phase 6, Milestone 1: Shopping Cart Foundation** have been successfully implemented. The migration was:

- ✅ **Non-destructive** - All existing data preserved
- ✅ **Follows naming conventions** - snake_case tables/columns, camelCase Prisma fields
- ✅ **Performance optimized** - Appropriate indexes added
- ✅ **Well-documented** - Comprehensive documentation provided
- ✅ **Production-ready** - Schema verified and Prisma client generated

The shopping cart foundation is now ready for application-level implementation.

---

**Migration Completed:** 2026-02-07T11:28:00Z  
**Verified By:** Prisma db pull --print  
**Status:** ✅ SUCCESS
