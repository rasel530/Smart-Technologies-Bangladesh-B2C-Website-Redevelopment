# Migration: Add CartEvent Table

## Overview

This migration creates the `cart_events` table to track individual user interactions with shopping carts. This addresses **DB-CRIT-001: Missing CartEvent table** from the database audit.

## Migration Details

- **Migration ID:** 20260207140000
- **Date:** 2026-02-07
- **Phase:** Phase 6, Milestone 1: Shopping Cart Foundation
- **Issue Fixed:** DB-CRIT-001

## Changes Made

### 1. New Table: `cart_events`

Tracks all cart-related events for analytics and user behavior analysis.

#### Table Schema

| Column     | Type          | Constraints             | Description                                                                                         |
| ---------- | ------------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| id         | TEXT          | PRIMARY KEY             | Unique identifier for the event                                                                     |
| cart_id    | TEXT          | NOT NULL, FK            | Reference to the cart table                                                                         |
| user_id    | TEXT          | NULLABLE                | Reference to the user (optional for guest carts)                                                    |
| event_type | VARCHAR(50)   | NOT NULL                | Type of event (item_added, item_removed, item_updated, cart_viewed, cart_abandoned, cart_converted) |
| product_id | TEXT          | NULLABLE                | Reference to the product (if applicable)                                                            |
| quantity   | INTEGER       | NULLABLE                | Quantity involved in the event                                                                      |
| price      | DECIMAL(12,2) | NULLABLE                | Price at the time of event                                                                          |
| timestamp  | TIMESTAMP(3)  | NOT NULL, DEFAULT NOW() | When the event occurred                                                                             |

### 2. Indexes Created

For optimal query performance:

- `cart_events_cart_id_idx` - Index on cart_id for fast cart lookups
- `cart_events_user_id_idx` - Index on user_id for user-based queries
- `cart_events_event_type_idx` - Index on event_type for filtering by event type
- `cart_events_timestamp_idx` - Index on timestamp for time-based queries
- `cart_events_cart_id_timestamp_idx` - Composite index for cart timeline queries

### 3. Foreign Keys

- `cart_events_cart_id_fkey` - Links to carts table with CASCADE delete

## Event Types

The following event types are tracked:

- `item_added` - When a product is added to the cart
- `item_removed` - When a product is removed from the cart
- `item_updated` - When item quantity is updated
- `cart_viewed` - When a user views their cart
- `cart_abandoned` - When a cart is abandoned (not converted within timeout)
- `cart_converted` - When a cart is converted to an order

## Impact

- **Non-destructive:** This migration only creates a new table
- **Backward compatible:** No changes to existing tables
- **Performance:** Proper indexes ensure fast queries
- **Data integrity:** Foreign key constraints maintain referential integrity

## Rollback

To rollback this migration:

```sql
DROP TABLE IF EXISTS "cart_events";
```

## Testing

After running this migration, verify:

1. Table exists: `\d cart_events` (PostgreSQL)
2. Indexes exist: `\di cart_events_*`
3. Foreign key exists: Check `information_schema.table_constraints`

## Related Files

- Schema: `backend/prisma/schema.prisma` - CartEvent model
- Controller: `backend/controllers/cartController.js` - Event tracking logic
- Seed: `backend/prisma/seed.js` - Test data seeding

## Notes

- This table enables comprehensive analytics on user cart behavior
- Events can be used for abandoned cart recovery
- Supports conversion funnel analysis
- Timestamp allows for time-series analysis
