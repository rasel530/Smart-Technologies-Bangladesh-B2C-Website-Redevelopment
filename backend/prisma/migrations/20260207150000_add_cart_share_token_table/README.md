# Migration: Add Cart Share Token Table

**Migration ID:** 20260207150000_add_cart_share_token_table
**Date:** 2026-02-07
**Phase:** Phase 6, Milestone 1: Shopping Cart Foundation
**Issue Fixed:** BE-CRIT-002: Missing POST /api/v1/cart/share endpoint

## Overview

This migration adds the `cart_share_tokens` table to enable cart sharing functionality. This allows users to share their shopping carts with others via a unique share token.

## Changes

### New Table: `cart_share_tokens`

| Column     | Type          | Description                |
| ---------- | ------------- | -------------------------- |
| id         | TEXT (UUID)   | Primary key                |
| cart_id    | TEXT (UUID)   | Foreign key to carts table |
| token      | TEXT (unique) | Unique share token         |
| expires_at | TIMESTAMP     | Token expiration date      |
| created_at | TIMESTAMP     | Token creation timestamp   |

### Constraints

- **Primary Key:** `cart_share_tokens_pkey` on `id`
- **Unique Constraint:** `cart_share_tokens_token_key` on `token`
- **Foreign Key:** `cart_share_tokens_cart_id_fkey` → `carts(id)` with CASCADE delete

### Indexes

| Index Name                         | Column     | Purpose               |
| ---------------------------------- | ---------- | --------------------- |
| `cart_share_tokens_cart_id_idx`    | cart_id    | Fast cart lookups     |
| `cart_share_tokens_token_idx`      | token      | Fast token validation |
| `cart_share_tokens_expires_at_idx` | expires_at | Expiration cleanup    |

## Features Enabled

1. **Cart Sharing:** Users can generate a share token for their cart
2. **Token Validation:** Shared carts can be accessed via unique token
3. **Expiration:** Share tokens expire after 7 days by default
4. **Security:** Tokens are unique and cannot be guessed
5. **Cleanup:** Expired tokens can be easily identified and removed

## Usage

### Generate Share Token

```sql
INSERT INTO cart_share_tokens (id, cart_id, token, expires_at)
VALUES (gen_random_uuid(), 'cart-id', 'unique-token', NOW() + INTERVAL '7 days');
```

### Validate Share Token

```sql
SELECT * FROM cart_share_tokens
WHERE token = 'unique-token' AND expires_at > NOW();
```

### Access Shared Cart

```sql
SELECT c.* FROM carts c
INNER JOIN cart_share_tokens cst ON c.id = cst.cart_id
WHERE cst.token = 'unique-token' AND cst.expires_at > NOW();
```

## API Endpoints

After this migration, the following endpoints will be available:

- `POST /api/v1/cart/:id/share` - Generate share token for a cart
- `GET /api/v1/cart/shared/:token` - Access a shared cart via token

## Rollback

To rollback this migration:

```sql
DROP TABLE IF EXISTS "cart_share_tokens";
```

## Notes

- Share tokens are valid for 7 days by default
- Tokens are automatically deleted when the parent cart is deleted (CASCADE)
- All indexes are created for optimal query performance
- The token column has a unique constraint to prevent duplicates
