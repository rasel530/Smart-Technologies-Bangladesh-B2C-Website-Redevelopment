# Smart E-commerce Dev Database Relationship Testing Guide

## Database Connection Setup

### PostgreSQL Connection
```bash
# Connect to smart_ecommerce_dev database
psql -h localhost -U postgres -d smart_ecommerce_dev

# Or using connection string
psql "postgresql://postgres:password@localhost:5432/smart_ecommerce_dev"
```

### Prerequisites
1. **Database**: `smart_ecommerce_dev` must exist and be accessible
2. **Schema**: All tables must be created with proper constraints
3. **Permissions**: User must have CREATE, INSERT, UPDATE, DELETE permissions
4. **Extensions**: Required PostgreSQL extensions must be installed

## Test Execution Instructions

### Step 1: Database Preparation
```sql
-- Connect to smart_ecommerce_dev
\c smart_ecommerce_dev

-- Verify database connection
SELECT current_database(), current_user(), version();

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Step 2: Execute Test Script
```bash
# Execute the complete test script
psql -h localhost -U postgres -d smart_ecommerce_dev -f DATABASE_RELATIONSHIP_TEST_EXECUTION.sql

# Or execute interactively
psql -h localhost -U postgres -d smart_ecommerce_dev
\i DATABASE_RELATIONSHIP_TEST_EXECUTION.sql
```

### Step 3: Monitor Test Execution
The test script will output progress indicators:
- `=== USER RELATIONSHIPS ===`
- `=== PRODUCT RELATIONSHIPS ===`
- `=== ORDER RELATIONSHIPS ===`
- `=== CATEGORY HIERARCHY ===`

### Step 4: Verify Results
After execution, run verification queries:
```sql
-- Check test data was created
SELECT COUNT(*) as total_users FROM users WHERE email LIKE '%@example.com';
SELECT COUNT(*) as total_products FROM products WHERE sku LIKE 'SKU%';
SELECT COUNT(*) as total_orders FROM orders WHERE orderNumber LIKE 'ORD-2023%';

-- Verify relationships
SELECT 
    u.email,
    COUNT(a.id) as addresses,
    COUNT(o.id) as orders,
    COUNT(r.id) as reviews
FROM users u
LEFT JOIN addresses a ON u.id = a.userId
LEFT JOIN orders o ON u.id = o.userId
LEFT JOIN reviews r ON u.id = r.userId
WHERE u.email LIKE '%@example.com'
GROUP BY u.id, u.email;
```

## Test Data Overview

### Users Created
| ID | Email | Name | Role | Status |
|---|---|---|---|
| user-john | john.doe@example.com | John Doe | CUSTOMER | Active |
| user-jane | jane.smith@example.com | Jane Smith | CUSTOMER | Active |
| user-admin | admin@smarttech.com | Admin User | ADMIN | Active |
| user-mike | mike.wilson@example.com | Mike Wilson | CUSTOMER | Active |
| user-sarah | sarah.jones@example.com | Sarah Jones | CUSTOMER | Inactive |

### Products Created
| ID | Name | SKU | Price | Category | Brand |
|---|---|---|---|---|
| prod-iphone14 | iPhone 14 Pro | IPHONE14-256 | 129,999 BDT | Smartphones | Apple |
| prod-galaxy-s23 | Samsung Galaxy S23 | GALAXYS23-128 | 89,999 BDT | Smartphones | Samsung |
| prod-macbook | MacBook Pro 14" | MACBOOK14-M2 | 185,000 BDT | Laptops | Apple |
| prod-airmax | Nike Air Max | AIRMAX90 | 8,500 BDT | Men's Clothing | Nike |
| prod-ultraboost | Adidas Ultraboost | ULTRABOOST22 | 12,000 BDT | Men's Clothing | Adidas |

### Orders Created
| ID | Order Number | User | Status | Total |
|---|---|---|---|
| order-john-1 | ORD-2023001 | John Doe | DELIVERED | 254,898 BDT |
| order-jane-1 | ORD-2023002 | Jane Smith | PROCESSING | 99,299 BDT |
| order-mike-1 | ORD-2023003 | Mike Wilson | CONFIRMED | 18,400 BDT |

## Expected Test Results

### Relationship Validation
- **User → Addresses**: Each user should have 1-2 addresses
- **User → Orders**: Users should have 0-2 orders
- **Product → Images**: Products should have 0-2 images
- **Product → Variants**: Products should have 0-3 variants
- **Order → Items**: Orders should have 1-2 items
- **Category Hierarchy**: Parent categories should have 1-2 children

### Constraint Validation
- **NOT NULL**: All required fields must reject NULL values
- **UNIQUE**: Emails, SKUs, slugs must be unique
- **FOREIGN KEY**: Invalid references must be rejected
- **CHECK**: Enum values must be validated

### Cascade Operations
- **User Delete**: Should remove addresses, sessions, reviews
- **Product Delete**: Should remove images, specs, variants
- **Category Delete**: Should set children parentId to NULL
- **Order Delete**: Should remove order items

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Connection Failed
```
Error: FATAL: database "smart_ecommerce_dev" does not exist
```
**Solution**: Create database first
```sql
CREATE DATABASE smart_ecommerce_dev;
```

#### Issue 2: Permission Denied
```
Error: permission denied for relation users
```
**Solution**: Grant permissions
```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

#### Issue 3: Constraint Violation
```
Error: insert or update on table "users" violates foreign key constraint
```
**Solution**: Ensure referenced records exist before creating relationships

#### Issue 4: Transaction Rollback
```
Error: current transaction is aborted, commands ignored until end of transaction block
```
**Solution**: Use ROLLBACK and retry

### Performance Issues

#### Slow Bulk Operations
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email LIKE '%@example.com';

-- Add indexes if needed
CREATE INDEX CONCURRENTLY idx_users_email_pattern ON users(email);
```

#### Memory Issues
```sql
-- Monitor memory usage
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats_ext;
```

## Cleanup Procedures

### Remove Test Data
```sql
-- Execute cleanup section from test script
-- Uncomment cleanup block in DATABASE_RELATIONSHIP_TEST_EXECUTION.sql
-- Or run manually:
BEGIN;
DELETE FROM reviews WHERE userId LIKE 'user-%' OR productId LIKE 'prod-%';
DELETE FROM transactions WHERE orderId LIKE 'order-%';
DELETE FROM order_items WHERE orderId LIKE 'order-%';
DELETE FROM orders WHERE userId LIKE 'user-%';
DELETE FROM wishlist_items WHERE wishlistId LIKE 'wish-%';
DELETE FROM wishlists WHERE userId LIKE 'user-%';
DELETE FROM cart_items WHERE cartId LIKE 'cart-%';
DELETE FROM carts WHERE userId LIKE 'user-%';
DELETE FROM user_sessions WHERE userId LIKE 'user-%';
DELETE FROM user_social_accounts WHERE userId LIKE 'user-%';
DELETE FROM addresses WHERE userId LIKE 'user-%';
DELETE FROM product_specifications WHERE productId LIKE 'prod-%';
DELETE FROM product_images WHERE productId LIKE 'prod-%';
DELETE FROM product_variants WHERE productId LIKE 'prod-%';
DELETE FROM products WHERE id LIKE 'prod-%';
DELETE FROM coupons WHERE code LIKE 'coupon-%';
DELETE FROM categories WHERE id LIKE 'cat-%';
DELETE FROM brands WHERE id LIKE 'brand-%';
DELETE FROM users WHERE id LIKE 'user-%';
COMMIT;
```

### Reset Sequences
```sql
-- Reset auto-increment sequences
SELECT setval(pg_get_serial_sequence('users_id_seq'), 1, false);
SELECT setval(pg_get_serial_sequence('products_id_seq'), 1, false);
SELECT setval(pg_get_serial_sequence('orders_id_seq'), 1, false);
```

## Validation Checklist

### Pre-Test Checklist
- [ ] Database `smart_ecommerce_dev` exists
- [ ] User has required permissions
- [ ] All tables are created
- [ ] Foreign key constraints are enabled
- [ ] Test script is accessible

### Post-Test Checklist
- [ ] All test cases executed
- [ ] No constraint violations
- [ ] All relationships validated
- [ ] Cascade operations tested
- [ ] Performance metrics acceptable
- [ ] Test data cleaned up

### Success Criteria
- ✅ All 25 test cases pass
- ✅ No orphaned data remains
- ✅ All constraints enforced
- ✅ Performance within limits
- ✅ Database integrity maintained

## Next Steps

### Production Deployment
1. **Schema Validation**: Ensure production schema matches test schema
2. **Data Migration**: Plan migration strategy for existing data
3. **Performance Testing**: Test with production data volumes
4. **Monitoring Setup**: Implement database monitoring
5. **Backup Strategy**: Establish backup procedures

### Ongoing Testing
1. **Automated Tests**: Set up CI/CD pipeline tests
2. **Regression Testing**: Regular integrity checks
3. **Load Testing**: Performance under stress
4. **Security Testing**: SQL injection prevention

## Support

### Contact Information
- **Database Administrator**: [DBA Contact]
- **Development Team**: [Dev Team Contact]
- **Documentation**: [Documentation Link]

### Additional Resources
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Best Practices](https://wiki.postgresql.org/wiki/)
- [Performance Tuning Guide](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)

---

**Last Updated**: December 2023
**Version**: 1.0
**Database**: smart_ecommerce_dev
**Status**: Ready for Execution