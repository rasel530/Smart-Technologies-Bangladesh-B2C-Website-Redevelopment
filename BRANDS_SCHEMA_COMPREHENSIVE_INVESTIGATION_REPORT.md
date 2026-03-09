# Brands Schema and Code - Comprehensive Investigation Report

**Date:** 2026-03-09  
**Investigation Type:** Complete analysis of brands model and all brand-related code  
**Status:** ✅ COMPLETED

---

## Executive Summary

This investigation identified **critical mismatches** between the Prisma schema and the brand creation code that are causing the error: `Argument 'updatedAt' is missing.`

The root cause is that the [`brands`](backend/prisma/schema.prisma:79-105) model has `updatedAt` as a **required field without a default value**, but the code in [`brands.js`](backend/routes/brands.js:271-289) does not provide this field when creating brands.

**Total Issues Found:** 4  
**Critical Issues:** 2  
**Minor Issues:** 2  
**Files Affected:** 3

---

## 1. Prisma Schema Analysis

### Complete `brands` Model Definition

```prisma
model brands {
  id              String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String
  slug            String      @unique
  description     String?
  address         String?
  contactEmail    String?
  contactPhone    String?
  createdAt       DateTime    @default(now())
  featuredOrder   Int         @default(0)
  isFeatured      Boolean     @default(false)
  logoUrl         String?
  metaDescription String?
  metaKeywords    String?
  metaTitle       String?
  nameBn          String?
  nameEn          String?
  status          BrandStatus @default(active)
  updatedAt       DateTime
  websiteUrl      String?
  products        products[]

  @@index([isFeatured])
  @@index([status])
  @@index([isFeatured], map: "idx_brands_is_featured")
  @@index([status], map: "idx_brands_status")
}
```

### Field Analysis

| Field | Type | Required | Default | Notes |
|--------|------|----------|--------|
| `id` | String @db.Uuid | ✅ Yes | ✅ Auto-generates UUID |
| `name` | String | ✅ Yes | ❌ No default - MUST be provided |
| `slug` | String | ✅ Yes | ❌ No default - MUST be provided |
| `description` | String? | ❌ No | ❌ No default - Optional |
| `address` | String? | ❌ No | ❌ No default - Optional |
| `contactEmail` | String? | ❌ No | ❌ No default - Optional |
| `contactPhone` | String? | ❌ No | ❌ No default - Optional |
| `createdAt` | DateTime | ❌ No | ✅ `@default(now())` - Auto-generated |
| `featuredOrder` | Int | ❌ No | ✅ `@default(0)` - Auto-generated |
| `isFeatured` | Boolean | ❌ No | ✅ `@default(false)` - Auto-generated |
| `logoUrl` | String? | ❌ No | ❌ No default - Optional |
| `metaDescription` | String? | ❌ No | ❌ No default - Optional |
| `metaKeywords` | String? | ❌ No | ❌ No default - Optional |
| `metaTitle` | String? | ❌ No | ❌ No default - Optional |
| `nameBn` | String? | ❌ No | ❌ No default - Optional |
| `nameEn` | String? | ❌ No | ❌ No default - Optional |
| `status` | BrandStatus | ❌ No | ✅ `@default(active)` - Auto-generated |
| `updatedAt` | DateTime | ✅ **YES** | ❌ **NO DEFAULT** - **MUST be provided** |
| `websiteUrl` | String? | ❌ No | ❌ No default - Optional |

### Critical Finding

**`updatedAt` is a REQUIRED field with NO DEFAULT value.** This means:
- Every `prisma.brands.create()` call MUST include `updatedAt`
- Every `prisma.brands.update()` call MUST include `updatedAt` (or it won't change)

### Schema Inconsistency

The `brands` model is **inconsistent** with other models in the schema:

**Models with BOTH timestamps having defaults:**
- `payment_gateway_settings` (lines 1138-1139)
- `payment_transaction` (lines 1217-1218)
- `product_images` (lines 1317-1318)
- `users` (lines 1814-1815)

**Models with ONLY `createdAt` having default (like `brands`):**
- `cart_note` (lines 39-40)
- `categories` (lines 420-421)
- `checkout_sessions` (lines 522-523)
- `cod_settings` (lines 541-542)
- `cross_sell_products` (lines 701-702)
- `emi_plans` (lines 751-752)
- `emi_providers` (lines 770-771)
- `order_fulfillments` (lines 897-898)
- `order_invoices` (lines 919-920)
- `order_modifications` (lines 948-949)
- `order_notes` (lines 966-967)
- `order_notifications` (lines 989-990)
- `order_tracking_events` (lines 1044-1045)
- `product_categories` (lines 1257-1258)
- `product_comparisons` (lines 1290-1291)
- `related_products` (lines 1422-1423)
- `reviews` (lines 1439-1440)
- `variant_types` (lines 1860-1861)
- **`brands`** (lines 87, 97) ⚠️ **INCONSISTENT**

---

## 2. Code Analysis

### A. Single Brand Creation Endpoint

**File:** [`backend/routes/brands.js`](backend/routes/brands.js:271-289)  
**Route:** `POST /api/v1/brands`  
**Lines:** 271-289

```javascript
const brand = await prisma.brands.create({
  data: {
    name: brandData.name,
    slug: brandData.slug,
    nameEn: brandData.nameEn || null,
    nameBn: brandData.nameBn || null,
    description: brandData.description || null,
    websiteUrl: brandData.websiteUrl || null,
    contactEmail: brandData.contactEmail || null,
    contactPhone: brandData.contactPhone || null,
    address: brandData.address || null,
    status: brandData.status || 'active',
    isFeatured: brandData.isFeatured || false,
    featuredOrder: brandData.featuredOrder || 0,
    metaTitle: brandData.metaTitle || null,
    metaDescription: brandData.metaDescription || null,
    metaKeywords: brandData.metaKeywords || null
  }
});
```

**❌ CRITICAL ISSUE:** Missing `updatedAt` field  
**❌ CRITICAL ISSUE:** Missing `createdAt` field (though it has a default, best practice is to be explicit)

### B. Bulk Brand Creation Endpoint

**File:** [`backend/routes/brands.js`](backend/routes/brands.js:832-850)  
**Route:** `POST /api/v1/brands/bulk`  
**Lines:** 832-850

```javascript
const brand = await tx.brands.create({
  data: {
    name: brandData.name,
    slug: brandData.slug,
    nameEn: brandData.nameEn || null,
    nameBn: brandData.nameBn || null,
    description: brandData.description || null,
    websiteUrl: brandData.websiteUrl || null,
    contactEmail: brandData.contactEmail || null,
    contactPhone: brandData.contactPhone || null,
    address: brandData.address || null,
    status: brandData.status || 'active',
    isFeatured: brandData.isFeatured || false,
    featuredOrder: brandData.featuredOrder || 0,
    metaTitle: brandData.metaTitle || null,
    metaDescription: brandData.metaDescription || null,
    metaKeywords: brandData.metaKeywords || null
  }
});
```

**❌ CRITICAL ISSUE:** Missing `updatedAt` field  
**❌ CRITICAL ISSUE:** Missing `createdAt` field (though it has a default, best practice is to be explicit)

### C. Brand Update Endpoints

All brand update operations in [`brands.js`](backend/routes/brands.js) do NOT include `updatedAt`:

1. **Line 352-355** - `PUT /api/v1/brands/:id`
2. **Line 468-471** - `PATCH /api/v1/brands/:id/status`
3. **Line 517-520** - `PATCH /api/v1/brands/:id/featured`
4. **Line 548-551** - `PATCH /api/v1/brands/featured-reorder`
5. **Line 721-724** - `POST /api/v1/brands/:id/logo`
6. **Line 770-773** - `DELETE /api/v1/brands/:id/logo`
7. **Line 928-931** - `PUT /api/v1/brands/bulk`
8. **Line 1077-1080** - `PATCH /api/v1/brands/:id/seo`

**⚠️ ISSUE:** When updating a brand, `updatedAt` should be updated to reflect the modification time. Currently, updates don't change `updatedAt`, which means the timestamp remains at the creation time.

### D. Test Files

#### Test Utility File

**File:** [`backend/tests/api-test-utils.js`](backend/tests/api-test-utils.js:119-128)  
**Lines:** 119-128

```javascript
const createTestBrand = async (brandData = {}) => {
  return prisma.brand.create({  // ❌ WRONG: should be 'brands' (plural)
    data: {
      name: brandData.name || 'Test Brand',
      slug: brandData.slug || 'test-brand',
      description: brandData.description || 'Test brand description',
      isActive: brandData.isActive !== undefined ? brandData.isActive : true  // ❌ WRONG: field doesn't exist
    }
  });
};
```

**❌ CRITICAL ISSUE 1:** Using `prisma.brand` instead of `prisma.brands` (missing "s")  
**❌ CRITICAL ISSUE 2:** Using field `isActive` which doesn't exist in schema (should be `status`)  
**❌ CRITICAL ISSUE 3:** Missing `updatedAt` field

#### Integration Test File

**File:** [`backend/tests/phase4-milestone2-integration.test.js`](backend/tests/phase4-milestone2-integration.test.js:146-150)  
**Lines:** 146-150

```javascript
async function createTestBrand(overrides = {}) {
  const uniqueId = generateUniqueId();
  const defaultBrand = {
    name: 'Test Brand',
    nameEn: 'Test Brand',
    nameBn: 'টেস্ট ব্র্যান্ড',
    slug: `test-brand-${uniqueId}`,
    status: 'active',
    ...overrides
  };

  const brand = await prisma.brand.create({  // ❌ WRONG: should be 'brands' (plural)
    data: defaultBrand
  });

  return brand;
}
```

**❌ CRITICAL ISSUE 1:** Using `prisma.brand` instead of `prisma.brands` (missing "s")  
**❌ CRITICAL ISSUE 2:** Missing `updatedAt` field  
**✅ CORRECT:** Using `status` field (correct field name)

**Line 1608** - Another brand creation:
```javascript
const brand = await prisma.brand.create({  // ❌ WRONG: should be 'brands' (plural)
  data: brandData
});
```

**❌ CRITICAL ISSUE:** Using `prisma.brand` instead of `prisma.brands` (missing "s")  
**❌ CRITICAL ISSUE:** Missing `updatedAt` field

---

## 3. Pattern Analysis from Other Routes

### How Other Routes Handle Timestamps

**Products Route** ([`backend/routes/products.js`](backend/routes/products.js:840-841)):
```javascript
data: {
  // ... other fields
  createdAt: new Date(),
  updatedAt: new Date()
}
```

**Cart Route** ([`backend/routes/cart.js`](backend/routes/cart.js:374-375)):
```javascript
data: {
  // ... other fields
  updatedAt: new Date()
}
```

**Checkout Route** ([`backend/routes/checkout.js`](backend/routes/checkout.js:349-350)):
```javascript
data: {
  // ... other fields
  updatedAt: new Date()
}
```

**Pattern:** When a model has `updatedAt` without a default, the code explicitly provides `updatedAt: new Date()` during creation.

---

## 4. Complete List of Issues

### Critical Issues (Must Fix)

| # | Issue | Location | Impact | Severity |
|---|--------|----------|----------|
| 1 | Missing `updatedAt` in brand creation (single) | [`brands.js:271-289`](backend/routes/brands.js:271-289) | ❌ Causes `Argument 'updatedAt' is missing` error | 🔴 CRITICAL |
| 2 | Missing `updatedAt` in brand creation (bulk) | [`brands.js:832-850`](backend/routes/brands.js:832-850) | ❌ Causes `Argument 'updatedAt' is missing` error | 🔴 CRITICAL |
| 3 | Missing `updatedAt` in test utility | [`api-test-utils.js:119-128`](backend/tests/api-test-utils.js:119-128) | ❌ Tests will fail | 🔴 CRITICAL |
| 4 | Missing `updatedAt` in integration tests | [`phase4-milestone2-integration.test.js:146-150`](backend/tests/phase4-milestone2-integration.test.js:146-150) | ❌ Tests will fail | 🔴 CRITICAL |

### Minor Issues (Should Fix)

| # | Issue | Location | Impact | Severity |
|---|--------|----------|----------|
| 5 | Using `prisma.brand` instead of `prisma.brands` | [`api-test-utils.js:120`](backend/tests/api-test-utils.js:120) | ❌ Will cause "Unknown model" error | 🟡 HIGH |
| 6 | Using `prisma.brand` instead of `prisma.brands` | [`phase4-milestone2-integration.test.js:146`](backend/tests/phase4-milestone2-integration.test.js:146) | ❌ Will cause "Unknown model" error | 🟡 HIGH |
| 7 | Using `prisma.brand` instead of `prisma.brands` | [`phase4-milestone2-integration.test.js:1608`](backend/tests/phase4-milestone2-integration.test.js:1608) | ❌ Will cause "Unknown model" error | 🟡 HIGH |
| 8 | Using field `isActive` (doesn't exist) | [`api-test-utils.js:125`](backend/tests/api-test-utils.js:125) | ❌ Will cause "Unknown field" error | 🟡 HIGH |
| 9 | `updatedAt` not updated on brand updates | [`brands.js:352-355`](backend/routes/brands.js:352-355) and others | ⚠️ Timestamp doesn't reflect actual update time | 🟡 HIGH |

---

## 5. Recommended Fixes

### Option A: Fix in Schema (RECOMMENDED) ✅

**Add `@default(now())` to `updatedAt` field in [`schema.prisma`](backend/prisma/schema.prisma:97)**

**Pros:**
- ✅ Single change fixes all issues
- ✅ Consistent with other models that have both timestamps with defaults
- ✅ No code changes needed in routes
- ✅ Database automatically handles timestamps
- ✅ Best practice for audit fields

**Cons:**
- ⚠️ Requires database migration

**Implementation:**

```prisma
model brands {
  // ... other fields
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now())  // ✅ ADD THIS
  // ... other fields
}
```

**Migration Required:** Yes  
**Files to Change:** 1 ([`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:97))

---

### Option B: Fix in Code (ALTERNATIVE) ⚠️

**Add `updatedAt: new Date()` to all brand creation and update calls**

**Pros:**
- ✅ No schema change needed
- ✅ No migration required

**Cons:**
- ❌ Multiple files to change (8+ locations)
- ❌ Easy to miss some locations
- ❌ Inconsistent with other models
- ❌ Maintenance burden (every new create/update must remember to add timestamps)
- ❌ Update operations won't auto-update `updatedAt`

**Files to Change:**
1. [`backend/routes/brands.js`](backend/routes/brands.js) (6 locations)
2. [`backend/tests/api-test-utils.js`](backend/tests/api-test-utils.js) (1 location)
3. [`backend/tests/phase4-milestone2-integration.test.js`](backend/tests/phase4-milestone2-integration.test.js) (2 locations)

**Implementation Example:**

```javascript
// Single brand creation (line 271)
const brand = await prisma.brands.create({
  data: {
    name: brandData.name,
    slug: brandData.slug,
    // ... other fields
    createdAt: new Date(),      // ✅ ADD THIS
    updatedAt: new Date()      // ✅ ADD THIS
  }
});

// Bulk brand creation (line 832)
const brand = await tx.brands.create({
  data: {
    name: brandData.name,
    slug: brandData.slug,
    // ... other fields
    createdAt: new Date(),      // ✅ ADD THIS
    updatedAt: new Date()      // ✅ ADD THIS
  }
});

// Brand updates (line 352, 468, 517, etc.)
const updatedBrand = await prisma.brands.update({
  where: { id },
  data: { 
    ...updateData,
    updatedAt: new Date()      // ✅ ADD THIS
  }
});
```

---

### Option C: Fix Model Name in Tests (REQUIRED) 🔴

**Change `prisma.brand` to `prisma.brands` in test files**

**Files to Change:**
1. [`backend/tests/api-test-utils.js`](backend/tests/api-test-utils.js:120)
2. [`backend/tests/phase4-milestone2-integration.test.js`](backend/tests/phase4-milestone2-integration.test.js:146)
3. [`backend/tests/phase4-milestone2-integration.test.js`](backend/tests/phase4-milestone2-integration.test.js:1608)

**Implementation:**

```javascript
// Change from:
return prisma.brand.create({ ... })

// To:
return prisma.brands.create({ ... })
```

---

### Option D: Fix Field Name in Tests (REQUIRED) 🔴

**Change `isActive` to `status` in [`api-test-utils.js`](backend/tests/api-test-utils.js:125)**

**Implementation:**

```javascript
// Change from:
isActive: brandData.isActive !== undefined ? brandData.isActive : true

// To:
status: brandData.status !== undefined ? brandData.status : 'active'
```

---

## 6. Recommended Fix Strategy

### Primary Recommendation: **Option A (Schema Fix)** ✅

**Rationale:**
1. **Single point of fix** - Change schema once, all code works
2. **Consistency** - Matches pattern used by `payment_gateway_settings`, `payment_transaction`, `product_images`, and `users` models
3. **Best practice** - Audit timestamps should be auto-managed by database
4. **Maintainability** - No need to remember to add timestamps in every create/update call
5. **Future-proof** - Any new code automatically works correctly

### Secondary Recommendations (Must Do Regardless of Primary Choice):

1. **Fix model name in tests** (Option C) - Change `prisma.brand` to `prisma.brands`
2. **Fix field name in test utility** (Option D) - Change `isActive` to `status`

---

## 7. Files Requiring Changes

### If Using Option A (Schema Fix):

| File | Lines | Change Type | Priority |
|------|--------|--------------|----------|
| [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:97) | 97 | Add `@default(now())` to `updatedAt` | 🔴 CRITICAL |
| [`backend/tests/api-test-utils.js`](backend/tests/api-test-utils.js:120) | 120 | Change `prisma.brand` to `prisma.brands` | 🔴 CRITICAL |
| [`backend/tests/api-test-utils.js`](backend/tests/api-test-utils.js:125) | 125 | Change `isActive` to `status` | 🔴 CRITICAL |
| [`backend/tests/phase4-milestone2-integration.test.js`](backend/tests/phase4-milestone2-integration.test.js:146) | 146 | Change `prisma.brand` to `prisma.brands` | 🔴 CRITICAL |
| [`backend/tests/phase4-milestone2-integration.test.js`](backend/tests/phase4-milestone2-integration.test.js:1608) | 1608 | Change `prisma.brand` to `prisma.brands` | 🔴 CRITICAL |

**Total Files:** 5  
**Total Changes:** 5

### If Using Option B (Code Fix):

| File | Lines | Change Type | Priority |
|------|--------|--------------|----------|
| [`backend/routes/brands.js`](backend/routes/brands.js:271-289) | 271-289 | Add `createdAt` and `updatedAt` | 🔴 CRITICAL |
| [`backend/routes/brands.js`](backend/routes/brands.js:352-355) | 352-355 | Add `updatedAt` to update | 🟡 HIGH |
| [`backend/routes/brands.js`](backend/routes/brands.js:468-471) | 468-471 | Add `updatedAt` to update | 🟡 HIGH |
| [`backend/routes/brands.js`](backend/routes/brands.js:517-520) | 517-520 | Add `updatedAt` to update | 🟡 HIGH |
| [`backend/routes/brands.js`](backend/routes/brands.js:548-551) | 548-551 | Add `updatedAt` to update | 🟡 HIGH |
| [`backend/routes/brands.js`](backend/routes/brands.js:721-724) | 721-724 | Add `updatedAt` to update | 🟡 HIGH |
| [`backend/routes/brands.js`](backend/routes/brands.js:770-773) | 770-773 | Add `updatedAt` to update | 🟡 HIGH |
| [`backend/routes/brands.js`](backend/routes/brands.js:832-850) | 832-850 | Add `createdAt` and `updatedAt` | 🔴 CRITICAL |
| [`backend/routes/brands.js`](backend/routes/brands.js:928-931) | 928-931 | Add `updatedAt` to update | 🟡 HIGH |
| [`backend/routes/brands.js`](backend/routes/brands.js:1077-1080) | 1077-1080 | Add `updatedAt` to update | 🟡 HIGH |
| [`backend/tests/api-test-utils.js`](backend/tests/api-test-utils.js:119-128) | 119-128 | Add `createdAt`, `updatedAt`, fix model name, fix field name | 🔴 CRITICAL |
| [`backend/tests/phase4-milestone2-integration.test.js`](backend/tests/phase4-milestone2-integration.test.js:146-150) | 146-150 | Add `createdAt`, `updatedAt`, fix model name | 🔴 CRITICAL |
| [`backend/tests/phase4-milestone2-integration.test.js`](backend/tests/phase4-milestone2-integration.test.js:1608-1610) | 1608-1610 | Add `createdAt`, `updatedAt`, fix model name | 🔴 CRITICAL |

**Total Files:** 3  
**Total Changes:** 13+

---

## 8. Testing Recommendations

After implementing fixes, test the following:

1. **Create single brand via API:**
   ```bash
   POST /api/v1/brands
   {
     "name": "Test Brand",
     "slug": "test-brand"
   }
   ```
   Expected: ✅ 201 Created

2. **Create bulk brands via API:**
   ```bash
   POST /api/v1/brands/bulk
   {
     "brands": [
       { "name": "Brand 1", "slug": "brand-1" },
       { "name": "Brand 2", "slug": "brand-2" }
     ]
   }
   ```
   Expected: ✅ 201 Created

3. **Update brand:**
   ```bash
   PUT /api/v1/brands/{id}
   {
     "name": "Updated Brand"
   }
   ```
   Expected: ✅ 200 OK

4. **Run test suite:**
   ```bash
   npm test -- backend/tests/api-brands.test.js
   npm test -- backend/tests/phase4-milestone2-integration.test.js
   ```
   Expected: ✅ All tests pass

5. **Verify timestamps:**
   ```sql
   SELECT id, name, "createdAt", "updatedAt" FROM brands LIMIT 5;
   ```
   Expected: ✅ Both timestamps populated

---

## 9. Root Cause Analysis

### Why This Error Occurred

1. **Schema Evolution:** The schema was likely modified to add `updatedAt` field for audit purposes, but the default value was not added
2. **Inconsistency:** Other models in the schema have different patterns for timestamp defaults
3. **Code Not Updated:** When the schema changed, the code was not updated to provide the new required field
4. **Test Not Updated:** Test utilities were using old field names and model names

### Why It Wasn't Caught Earlier

1. **No integration tests running** - If tests were running, they would have caught this
2. **Manual testing only** - Manual API tests might have been using different data
3. **Schema validation** - Prisma doesn't validate that required fields without defaults are provided at compile time

---

## 10. Conclusion

### Summary

The `brands` model has a **critical schema inconsistency** where `updatedAt` is a required field without a default value, but the code doesn't provide it. This causes the error: `Argument 'updatedAt' is missing.`

### Recommended Action Plan

1. **IMMEDIATE (Critical):** Fix schema by adding `@default(now())` to `updatedAt` field
2. **IMMEDIATE (Critical):** Fix model names in test files (`brand` → `brands`)
3. **IMMEDIATE (Critical):** Fix field name in test utility (`isActive` → `status`)
4. **OPTIONAL (High):** Consider standardizing all models to have both timestamps with defaults for consistency

### Expected Outcome

After implementing Option A (Schema Fix):
- ✅ All brand creation operations will work without code changes
- ✅ All brand update operations will automatically update `updatedAt`
- ✅ Test files will work after fixing model names
- ✅ No more "Argument 'updatedAt' is missing" errors
- ✅ Consistent timestamp behavior across the application

---

## Appendix A: Complete File List

### Schema Files
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:79-105)

### Route Files
- [`backend/routes/brands.js`](backend/routes/brands.js) (1096 lines)

### Test Files
- [`backend/tests/api-test-utils.js`](backend/tests/api-test-utils.js) (449 lines)
- [`backend/tests/phase4-milestone2-integration.test.js`](backend/tests/phase4-milestone2-integration.test.js) (2114 lines)
- [`backend/tests/api-brands.test.js`](backend/tests/api-brands.test.js) (referenced in search)

### Other Files Referencing Brands
- [`backend/routes/products.js`](backend/routes/products.js) (brand lookup for products)
- [`backend/routes/search.js`](backend/routes/search.js) (brand aggregation in search)

---

## Appendix B: Related Models Comparison

### Models with Both Timestamps Having Defaults

| Model | createdAt | updatedAt | Pattern |
|--------|-----------|-----------|----------|
| `payment_gateway_settings` | ✅ @default(now()) | ✅ @default(now()) | ✅ Consistent |
| `payment_transaction` | ✅ @default(now()) | ✅ @default(now()) | ✅ Consistent |
| `product_images` | ✅ @default(now()) | ✅ @default(now()) | ✅ Consistent |
| `users` | ✅ @default(now()) | ✅ @default(now()) | ✅ Consistent |

### Models with Only createdAt Having Default (Like brands)

| Model | createdAt | updatedAt | Pattern |
|--------|-----------|-----------|----------|
| `brands` | ✅ @default(now()) | ❌ No default | ⚠️ Inconsistent |
| `cart_note` | ✅ @default(now()) | ❌ No default | ⚠️ Inconsistent |
| `categories` | ✅ @default(now()) | ❌ No default | ⚠️ Inconsistent |
| `checkout_sessions` | ✅ @default(now()) | ❌ No default | ⚠️ Inconsistent |
| `cod_settings` | ✅ @default(now()) | ❌ No default | ⚠️ Inconsistent |

---

**Report End**

*This comprehensive investigation was performed to identify all mismatches between the brands schema and brand-related code, providing clear recommendations for fixing all issues permanently.*
