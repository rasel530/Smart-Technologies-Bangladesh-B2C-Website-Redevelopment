# Database Schema Test Execution Guide

**Project:** Smart Technologies Bangladesh B2C Website Redevelopment  
**Phase:** Phase 2 - Core Architecture & Database Design  
**Milestone:** 1 - Database Schema Design  
**Document:** Test Execution Guide with Demo Data  
**Date:** December 15, 2025  

---

## Overview

This guide provides comprehensive instructions for testing the completed database schema implementation with Bangladesh-specific features and demo data. The test validates all entity relationships, data integrity, and business logic requirements.

## Prerequisites

### Environment Setup
1. **PostgreSQL Database**: Ensure PostgreSQL 15+ is running
2. **Node.js**: Version 18+ LTS installed
3. **Dependencies**: All npm packages installed (`npm install`)
4. **Environment**: `.env` file configured with database URL

### Database Configuration
```bash
# Update .env file with your database credentials
DATABASE_URL="postgresql://username:password@localhost:5432/smart_ecommerce_dev"
NODE_ENV="development"
PORT=3001
```

---

## Test Execution Methods

### Method 1: Automated Test Script (Recommended)

#### Quick Start
```bash
# Navigate to backend directory
cd "Smart Technologies Bangladesh B2C Website Redevelopment/backend"

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run comprehensive database test
npm run test:demo
```

#### Expected Output
The test script will:
- ✅ Create admin and customer users
- ✅ Generate Bangladesh addresses (DHAKA, CHITTAGONG divisions)
- ✅ Create categories and brands (Samsung, Walton)
- ✅ Add products with multilingual support (English/Bengali)
- ✅ Test shopping cart and wishlist functionality
- ✅ Create orders with BDT payment methods
- ✅ Generate reviews and ratings
- ✅ Test authentication sessions
- ✅ Validate all database relationships

### Method 2: Manual Step-by-Step Testing

#### Step 1: Database Setup
```bash
# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

#### Step 2: Start Backend Server
```bash
# Start development server
npm run dev

# Test health endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/db-status
```

#### Step 3: Database Validation
```bash
# Open Prisma Studio for visual inspection
npm run db:studio

# Access at: http://localhost:5555
```

---

## Test Data Structure

### Bangladesh-Specific Test Data

#### Administrative Divisions
| Division | Code | Test Address |
|----------|-------|-------------|
| DHAKA | DHAKA | Dhanmondi, Dhaka |
| CHITTAGONG | CHITTAGONG | Patiya, Chittagong |
| RAJSHAHI | RAJSHAHI | Boalia, Rajshahi |
| SYLHET | SYLHET | Zindabazar, Sylhet |
| KHULNA | KHULNA | Daulatpur, Khulna |
| BARISHAL | BARISHAL | Barishal Sadar |
| RANGPUR | RANGPUR | Rangpur City |
| MYMENSINGH | MYMENSINGH | Mymensingh |

#### Payment Methods (Bangladesh Focus)
| Method | Type | Test Usage |
|--------|-------|-----------|
| CASH_ON_DELIVERY | Local | Default for test orders |
| BKASH | Mobile | Popular digital wallet |
| NAGAD | Mobile | Growing payment method |
| ROCKET | Mobile | DBBL mobile banking |
| BANK_TRANSFER | Traditional | Bank transfer option |

#### Multilingual Products
| Product | English Name | Bengali Name | Features |
|---------|--------------|--------------|---------|
| Samsung Galaxy S23 | Samsung Galaxy S23 | স্যামসাং গ্যালাক্সি S23 | Official BD warranty |
| Walton Primo GH8 | Walton Primo GH8 | ওয়লটন প্রিমো GH8 | Local brand support |

---

## Test Validation Checklist

### User Management Tests
- [ ] Admin user created with proper role
- [ ] Customer user with Bangladesh phone number (+880...)
- [ ] User authentication with bcrypt password hashing
- [ ] Session management with expiration
- [ ] Social account integration ready

### Address System Tests
- [ ] All 8 Bangladesh divisions represented
- [ ] Proper address hierarchy (Division → District → Upazila)
- [ ] Shipping and billing address types
- [ ] Default address selection working
- [ ] Postal code validation

### Product Catalog Tests
- [ ] Categories with hierarchical structure
- [ ] Brands with website integration
- [ ] Products with multilingual fields (EN/BN)
- [ ] Product images with proper ordering
- [ ] Specifications with key-value structure
- [ ] Product variants support
- [ ] Stock management and thresholds

### Shopping System Tests
- [ ] Cart creation with expiration
- [ ] Cart items with quantity and pricing
- [ ] Wishlist with privacy settings
- [ ] Guest cart support
- [ ] Session-based cart persistence

### Order Management Tests
- [ ] Order creation with unique numbers
- [ ] Bangladesh address integration
- [ ] Multiple payment methods (BDT focus)
- [ ] Order status tracking
- [ ] Tax calculation for Bangladesh
- [ ] Shipping cost integration

### Review System Tests
- [ ] Product ratings (1-5 stars)
- [ ] Review approval workflow
- [ ] Verified purchase reviews
- [ ] Bengali language review support
- [ ] Review moderation system

### Coupon System Tests
- [ ] Percentage discount coupons
- [ ] Fixed amount coupons
- [ ] Minimum amount validation
- [ ] Usage limits tracking
- [ ] Expiration management
- [ ] Bangladesh-specific coupon codes

---

## Performance Testing

### Database Query Performance
```sql
-- Test product search with filters
EXPLAIN ANALYZE SELECT * FROM products 
WHERE category_id = 'electronics' 
AND status = 'ACTIVE' 
AND stock_quantity > 0;

-- Test order lookup by customer
EXPLAIN ANALYZE SELECT o.*, oi.* FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 'customer-id'
ORDER BY o.created_at DESC;
```

### Index Validation
```sql
-- Check if indexes are properly created
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename IN ('users', 'products', 'orders', 'addresses');

-- Analyze query performance
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'products';
```

---

## Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues
**Problem**: Connection refused or timeout
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Restart PostgreSQL if needed
sudo systemctl restart postgresql
```

#### Prisma Generation Issues
**Problem**: Client generation fails
```bash
# Clear Prisma cache
rm -rf node_modules/.prisma

# Regenerate client
npm run db:generate
```

#### Seed Data Issues
**Problem**: Duplicate key violations
```bash
# Reset database
npm run db:reset

# Re-run seeding
npm run db:seed
```

#### Permission Issues
**Problem**: Database access denied
```sql
-- Check user permissions
\du

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE smart_ecommerce_dev TO smart_dev;
```

---

## Test Results Documentation

### Expected Test Output
```
🧪 Database Schema Test & Demo - Smart Technologies Bangladesh
==========================================================

📊 Step 1: Testing Database Connection...
✅ Database connected successfully

👥 Step 2: Creating Test Users...
✅ Admin user created: admin@smarttech.com
✅ Customer user created: customer@example.com

📍 Step 3: Creating Bangladesh Addresses...
✅ Created addresses in DHAKA and CHITTAGONG divisions

🏷️ Step 4: Creating Categories and Brands...
✅ Categories created: Electronics, Clothing
✅ Brands created: Samsung, Walton

📱 Step 5: Creating Products with Bangladesh Features...
✅ Products created: Samsung Galaxy S23, Walton Primo GH8

🖼️ Step 6: Adding Product Images and Specifications...
✅ Product images and specifications added

🛒 Step 7: Testing Shopping Cart System...
✅ Cart created with Samsung S23 (1) and Walton GH8 (2) items

❤️ Step 8: Testing Wishlist System...
✅ Wishlist created with 2 smartphone items

💰 Step 9: Testing Bangladesh Payment Methods...
✅ Bangladesh-specific coupons created: BDT-WELCOME (10%), EID-SPECIAL (৳1000)

📦 Step 10: Testing Order System...
✅ Order created with BDT payment method and Bangladesh address

⭐ Step 11: Testing Review System...
✅ 5-star review created with Bangladesh-specific feedback

🔐 Step 12: Testing Authentication System...
✅ User session created for authentication testing

📊 Step 13: Database Statistics...
📈 Database Statistics:
   Users: 2
   Products: 2
   Categories: 2
   Brands: 2
   Orders: 1
   Reviews: 1
   Coupons: 2
   Carts: 1
   Wishlists: 1

🎯 Step 14: Testing Bangladesh-Specific Features...
🇧🇩 Bangladesh Divisions in Database: 2
   - DHAKA
   - CHITTAGONG
💳 Payment Methods Used: 1
   - CASH_ON_DELIVERY
🌐 Products with Bengali Names: 2

✅ ALL TESTS PASSED SUCCESSFULLY!
```

### Success Criteria
- ✅ All database entities created successfully
- ✅ Bangladesh-specific features working
- ✅ Relationships and constraints enforced
- ✅ Multilingual support functional
- ✅ Payment methods for Bangladesh market
- ✅ Performance indexes optimized
- ✅ Data integrity maintained

---

## Next Steps After Testing

### Immediate Actions
1. **Frontend Integration**: Connect React frontend to database API
2. **API Development**: Implement business logic endpoints
3. **Performance Monitoring**: Set up query performance tracking
4. **Security Hardening**: Implement database security measures

### Production Deployment
1. **Environment Configuration**: Set up production database
2. **Migration Strategy**: Plan production migration workflow
3. **Backup Procedures**: Implement automated backups
4. **Monitoring Setup**: Configure database monitoring

---

## Contact and Support

### Technical Support
- **Database Issues**: Check PostgreSQL logs and configuration
- **Prisma Issues**: Review schema and generation logs
- **Test Failures**: Validate environment and dependencies

### Documentation References
- **Phase 2 Roadmap**: `doc/roadmap/phase_2/phase_2_development_roadmap.md`
- **Database Schema**: `backend/prisma/schema.prisma`
- **Completion Report**: `PHASE_2_MILESTONE_1_COMPLETION_REPORT.md`

---

**Document Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** Ready for Execution  
**Next Review:** After Test Completion