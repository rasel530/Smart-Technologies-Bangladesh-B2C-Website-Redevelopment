# Database Tables - Snack Format

**Milestone 4, Task 1: User Roles Definition**  
**Date:** January 13, 2026  
**Status:** ✅ COMPLETE

---

## 📊 Quick Stats

| Metric | Count |
|--------|-------|
| Total Tables | 32 |
| New Tables | 3 |
| Roles | 6 |
| Permissions | 37 |
| Role-Permission Mappings | 123 |
| Hierarchy Relationships | 7 |

---

## 🆕 New Tables (3)

### 1. Permission
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique identifier |
| name | TEXT (Unique) | Permission name (e.g., user:read) |
| description | TEXT | Permission description |
| category | TEXT | Category (users, products, etc.) |
| resource | TEXT | Resource type |
| action | TEXT | Action (read, create, etc.) |
| createdAt | TIMESTAMP | Creation time |
| updatedAt | TIMESTAMP | Last update |

**Records:** 37 permissions

### 2. RolePermission
| Column | Type | Description |
|--------|------|-------------|
| roleId | TEXT (PK) | Role identifier |
| permissionId | TEXT (PK) | Permission identifier |
| grantedAt | TIMESTAMP | When permission was granted |
| grantedBy | TEXT | Who granted the permission |

**Records:** 123 mappings

### 3. RoleHierarchy
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique identifier |
| parentRole | UserRole | Parent role |
| childRole | UserRole | Child role |
| createdAt | TIMESTAMP | Creation time |

**Records:** 7 relationships

---

## 👥 Roles (6)

| Role | Level | Permissions | Description |
|------|-------|-------------|-------------|
| SUPER_ADMIN | 100 | 37 | Super administrator - Full access |
| ADMIN | 80 | 34 | System administrator |
| MANAGER | 60 | 19 | Store manager |
| SUPPORT | 50 | 5 | Customer service |
| CORPORATE | 40 | 18 | Corporate account |
| CUSTOMER | 20 | 10 | Regular customer |

**Hierarchy:**
```
SUPER_ADMIN (100)
  └── ADMIN (80)
        ├── MANAGER (60) → CUSTOMER (20)
        ├── SUPPORT (50) → CUSTOMER (20)
        └── CORPORATE (40) → CUSTOMER (20)
```

---

## 🔐 Permissions (37)

### Users (5)
- `user:read` - View user information
- `user:create` - Create new users
- `user:update` - Update user information
- `user:delete` - Delete users
- `user:assign_role` - Assign roles to users

### Products (4)
- `product:read` - View products
- `product:create` - Create new products
- `product:update` - Update product information
- `product:delete` - Delete products

### Orders (5)
- `order:read` - View orders
- `order:create` - Create orders
- `order:update` - Update order information
- `order:delete` - Delete orders
- `order:manage_status` - Manage order status

### Categories (4)
- `category:read` - View categories
- `category:create` - Create new categories
- `category:update` - Update category information
- `category:delete` - Delete categories

### Brands (4)
- `brand:read` - View brands
- `brand:create` - Create new brands
- `brand:update` - Update brand information
- `brand:delete` - Delete brands

### Reviews (3)
- `review:read` - View reviews
- `review:create` - Create reviews
- `review:manage` - Manage reviews (approve/delete)

### Analytics (2)
- `analytics:view` - View analytics dashboard
- `analytics:export` - Export analytics data

### Support (3)
- `support:read` - View support tickets
- `support:respond` - Respond to support tickets
- `support:manage` - Manage support tickets

### Corporate (4)
- `corporate:read` - View corporate accounts
- `corporate:create` - Create corporate accounts
- `corporate:update` - Update corporate accounts
- `corporate:manage_users` - Manage corporate users

### System (3)
- `system:config` - Configure system settings
- `system:logs` - View system logs
- `system:backup` - Create system backups

---

## 🔗 Role-Permission Mappings (123)

| Role | Permissions | Coverage |
|------|-------------|----------|
| SUPER_ADMIN | 37 | 100% (All) |
| ADMIN | 34 | 92% (Excludes system) |
| MANAGER | 19 | 51% (Products, Categories, Brands, Orders, Analytics) |
| SUPPORT | 5 | 14% (Support, basic read) |
| CORPORATE | 18 | 49% (Corporate, basic ops) |
| CUSTOMER | 10 | 27% (Basic read/create) |

---

## 🌳 Role Hierarchy (7)

| Parent | Child |
|--------|-------|
| SUPER_ADMIN | ADMIN |
| ADMIN | MANAGER |
| ADMIN | SUPPORT |
| ADMIN | CORPORATE |
| MANAGER | CUSTOMER |
| SUPPORT | CUSTOMER |
| CORPORATE | CUSTOMER |

**Inheritance:** Each role inherits all permissions from parent roles

---

## 📋 Existing Tables (29)

| # | Table | Description |
|---|-------|-------------|
| 1 | users | User accounts |
| 2 | addresses | User addresses |
| 3 | brands | Product brands |
| 4 | cart_items | Shopping cart items |
| 5 | carts | Shopping carts |
| 6 | categories | Product categories |
| 7 | connection_info | Connection information |
| 8 | coupons | Discount coupons |
| 9 | email_verification_tokens | Email verification |
| 10 | order_items | Order line items |
| 11 | orders | Orders |
| 12 | password_history | Password history |
| 13 | phone_otps | Phone OTPs |
| 14 | product_images | Product images |
| 15 | product_specifications | Product specs |
| 16 | product_variants | Product variants |
| 17 | products | Products |
| 18 | reviews | Product reviews |
| 19 | transactions | Payment transactions |
| 20 | user_communication_preferences | User communication settings |
| 21 | user_data_exports | User data exports |
| 22 | user_notification_preferences | User notification settings |
| 23 | user_privacy_settings | User privacy settings |
| 24 | user_sessions | User sessions |
| 25 | user_social_accounts | Social accounts |
| 26 | wishlist_items | Wishlist items |
| 27 | wishlists | Wishlists |
| 28 | account_deletion_requests | Account deletion requests |
| 29 | _prisma_migrations | Migration history |

---

## 🔍 Quick Queries

### View all permissions
```sql
SELECT * FROM "Permission" ORDER BY category, name;
```

### View role permissions
```sql
SELECT rp."roleId", p.name, p.category 
FROM "RolePermission" rp 
JOIN "Permission" p ON rp."permissionId" = p.id 
ORDER BY rp."roleId", p.category;
```

### View role hierarchy
```sql
SELECT * FROM "RoleHierarchy" ORDER BY "parentRole", "childRole";
```

### Count permissions per role
```sql
SELECT "roleId", COUNT(*) as permission_count
FROM "RolePermission"
GROUP BY "roleId"
ORDER BY permission_count DESC;
```

---

## ✅ Verification

All tables created and verified:
- ✅ Permission table (37 records)
- ✅ RolePermission table (123 records)
- ✅ RoleHierarchy table (7 records)
- ✅ UserRole enum (6 roles)
- ✅ ProfileVisibility enum (3 values)

---

**Status:** 100% COMPLETE  
**Database:** PostgreSQL (smart_ecommerce_dev)  
**Migration Date:** January 13, 2026
