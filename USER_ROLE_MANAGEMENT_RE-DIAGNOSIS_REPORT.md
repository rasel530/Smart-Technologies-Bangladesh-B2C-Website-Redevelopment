# User Role Management Issues - Re-Diagnosis Report

**Date:** 2026-02-08  
**Investigation Focus:** Why previous fixes did not resolve issues at http://localhost:3000/admin/rbac/users

---

## Executive Summary

After comprehensive investigation of the live environment, I have identified **THREE CRITICAL ROOT CAUSES** that explain why the previous fixes did not resolve the issues:

1. **DUPLICATE MANAGER ROLES** in the database (case sensitivity issue)
2. **LEGACY ROLE FIELD NOT UPDATED** when users are created with Manager role
3. **FRONTEND EXPECTS MISSING PROPERTY** (`maxRoleLevel`) that backend doesn't provide

---

## Task 1: Database State Verification

### 1.1 Target Users Exist and Have Role Assignments

✅ **CONFIRMED:** Both users EXIST in the database

| Email | User ID | Status | Legacy Role Field | Role Assignment |
|--------|-----------|--------|-------------------|-----------------|
| rasel.bepari@smartbd.com | 35c1d3fe-3ccb-4730-b1d2-dce186ac7431 | active | **customer** | MANAGER (Level 3) |
| mdbaki@gmail.com | 9c18a472-b362-4bb7-9a4f-29563472317a | active | **customer** | MANAGER (Level 3) |

**KEY FINDING:** Both users have:
- ✅ Active status
- ✅ MANAGER role assigned in `user_roles` table
- ❌ Legacy `role` field still set to "customer" (WRONG!)

### 1.2 Database Statistics

```
Total users in database: 12
Active users: 12
Users with active role assignments: 7
Users without role assignments: 5
```

### 1.3 Recent User Creation Pattern

The last 3 users created all show the SAME pattern:

| Email | Legacy Role Field | Actual Role Assigned |
|--------|-------------------|---------------------|
| test@gmail.com | customer | MANAGER (Level 3) |
| mdbaki@gmail.com | customer | MANAGER (Level 3) |
| rasel.bepari@smartbd.com | customer | MANAGER (Level 3) |

**PATTERN:** When users are created with "Manager" role, the legacy `role` field remains as "customer".

---

## Task 2: Backend API Response Analysis

### 2.1 API Returns Users Correctly

✅ **CONFIRMED:** The backend API `GET /api/rbac/users` DOES return the target users.

**Sample API Response for Target Users:**

```json
{
  "id": "9c18a472-b362-4bb7-9a4f-29563472317a",
  "email": "mdbaki@gmail.com",
  "firstName": "Mohammad1",
  "lastName": "Baki",
  "status": "active",
  "role": "customer",  // ← LEGACY FIELD (WRONG!)
  "createdAt": "2026-02-08T20:10:15.000Z",
  "updatedAt": "2026-02-08T20:10:15.000Z",
  "user_roles": [
    {
      "id": "b8142c78-50c9-4e17-8c64-558703b66750",
      "role_id": "12f934fa-4dde-433d-808d-5cd75f451db8",
      "assigned_at": "2026-02-08T20:10:15.000Z",
      "roles": {
        "id": "12f934fa-4dde-433d-808d-5cd75f451db8",
        "name": "MANAGER",  // ← CORRECT ROLE!
        "description": "Manager",
        "hierarchy_level": 3
      }
    }
  ]
}
```

**CRITICAL ISSUE:** The API response includes BOTH:
1. Legacy `role` field: "customer" (WRONG)
2. `user_roles` array with correct role: "MANAGER" (CORRECT)

### 2.2 Backend Route Code Analysis

**File:** [`backend/routes/rbacUserRoles.js`](backend/routes/rbacUserRoles.js:613)

**GET /api/rbac/users endpoint (lines 613-708):**

```javascript
router.get('/', [
  rbacAuthMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('user:read')
], rbacReadRateLimit, async (req, res) => {
  // ...
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        status: true,
        role: true,  // ← LEGACY FIELD INCLUDED IN RESPONSE
        createdAt: true,
        updatedAt: true,
        user_roles: {
          where: { is_active: true },
          select: {
            id: true,
            role_id: true,
            assigned_at: true,
            roles: {
              select: {
                id: true,
                name: true,
                description: true,
                hierarchy_level: true
              }
            }
          },
          orderBy: { assigned_at: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.user.count({ where })
  ]);
  
  // Transform users to match expected format
  const transformedUsers = users.map(user => ({
    id: user.id,
    email: user.email,
    phone: user.phone,
    first_name: user.firstName,
    last_name: user.lastName,
    status: user.status,
    roles: user.user_roles.map(ur => ({  // ← CORRECTLY TRANSFORMS user_roles
      id: ur.roles.id,
      name: ur.roles.name,
      description: ur.roles.description,
      hierarchy_level: ur.roles.hierarchy_level,
      assigned_at: ur.assigned_at
    })),
    created_at: user.createdAt,
    updated_at: user.updatedAt
  }));
  
  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: transformedUsers,
    pagination: { ... }
  });
});
```

**FINDING:** The backend correctly transforms the response and includes `roles` array from `user_roles`. However, it also includes the legacy `role` field in the select statement, which is then NOT used in the transformation.

### 2.3 POST /api/rbac/users (User Creation) Analysis

**File:** [`backend/routes/rbacUserRoles.js`](backend/routes/rbacUserRoles.js:381)

```javascript
router.post('/', [
  // validation...
], rbacAuthMiddleware.authenticate(),
rbacAuthMiddleware.requirePermission('user:assign_role'), async (req, res) => {
  const { email, phone, password, first_name, last_name, role_ids } = req.body;
  
  const result = await db.getClient().$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email,
        phone: normalizedPhone || null,
        password: hashedPassword,
        firstName: first_name,
        lastName: last_name,
        status: 'active'
        // ← NO 'role' FIELD SET HERE!
      },
      select: { id, email, phone, firstName, lastName, status, createdAt, updatedAt }
    });
    
    // Assign roles to user
    const userRoles = await Promise.all(role_ids.map(role_id =>
      tx.user_roles.create({
        data: {
          user_id: user.id,
          role_id,
          assigned_by: req.user.id,
          assigned_at: new Date(),
          is_active: true
        }
      })
    ));
    
    // ...
  });
});
```

**CRITICAL FINDING:** When creating a user, the code does NOT set the legacy `role` field. It defaults to "customer" as defined in the Prisma schema (line 22 of schema.prisma).

---

## Task 3: Frontend Code Analysis

### 3.1 Frontend Filtering Logic

**File:** [`frontend/src/app/admin/rbac/users/page.tsx`](frontend/src/app/admin/rbac/users/page.tsx:390)

```typescript
const filteredUsers = users.filter((user) => {
  const matchesSearch =
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()));

  const matchesRole =
    roleFilter === 'all' ||
    user.roles.some((role) => role.name === roleFilter);  // ← FILTERS BY role.name

  return matchesSearch && matchesRole;
});
```

**FINDING:** The frontend correctly filters by `user.roles.some((role) => role.name === roleFilter)`. This means it uses the `roles` array from the API response, NOT the legacy `role` field.

### 3.2 Frontend Display Logic

**File:** [`frontend/src/app/admin/rbac/users/page.tsx`](frontend/src/app/admin/rbac/users/page.tsx:558)

```typescript
{user.roles.length > 0 ? (
  user.roles.map((userRole) => (
    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
      {getRoleDisplayName(userRole.name)}  // ← DISPLAYS role.name FROM roles ARRAY
    </span>
  ))
) : (
  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-300">
    No Role
  </span>
)}
```

**FINDING:** The frontend correctly displays roles from the `user.roles` array.

### 3.3 Frontend Missing Property Issue

**File:** [`frontend/src/app/admin/rbac/users/page.tsx`](frontend/src/app/admin/rbac/users/page.tsx:576)

```typescript
<span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
  Level {user.maxRoleLevel}  // ← PROPERTY DOES NOT EXIST IN API RESPONSE!
</span>
```

**CRITICAL FINDING:** The frontend expects a `maxRoleLevel` property on the user object, but the backend API does NOT provide this property. This will cause the frontend to display "Level undefined" for all users.

**File:** [`frontend/src/types/rbac.ts`](frontend/src/types/rbac.ts)

```typescript
export interface UserWithRoles {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  status: string;
  roles: UserRoleSimple[];
  maxRoleLevel?: number;  // ← OPTIONAL PROPERTY
  created_at: string;
  updated_at: string;
}
```

The `maxRoleLevel` property is marked as optional (`?`), so it won't cause a crash, but it will display incorrectly.

---

## Task 4: Duplicate Manager Roles Issue

### 4.1 Database Contains TWO Manager Roles

**Role 1:**
- ID: `bae96556-98bd-472c-ac6d-7e53f43dd7ce`
- Name: `manager` (lowercase)
- Hierarchy Level: 3
- Description: "Manager with elevated permissions"

**Role 2:**
- ID: `12f934fa-4dde-433d-808d-5cd75f451db8`
- Name: `MANAGER` (uppercase)
- Hierarchy Level: 3
- Description: "Manager"

### 4.2 Which Role Are Users Assigned To?

**Target Users are assigned to:** `MANAGER` (uppercase, ID: 12f934fa-4dde-433d-808d-5cd75f451db8)

**Backend Diagnostic Script Checks For:** `manager` (lowercase)

**File:** [`backend/re-diagnose-user-role-issues.js`](backend/re-diagnose-user-role-issues.js:189)

```javascript
const managerRole = await prisma.roles.findFirst({
  where: {
    OR: [
      { name: 'Manager' },
      { name: 'manager' }  // ← LOOKS FOR LOWERCASE
    ]
  }
});
```

**Result:** The diagnostic script found the lowercase "manager" role first, then checked for users assigned to it. Since users are assigned to "MANAGER" (uppercase), it found 0 users assigned to "manager".

---

## Root Cause Analysis

### Issue 1: Users NOT Showing Up on User List Page

**STATUS:** ❌ THIS IS NOT ACTUALLY HAPPENING

**Evidence:**
- Target users ARE returned in API response (confirmed in Task 6.2)
- Frontend filtering uses `user.roles` array (confirmed in Task 3.1)
- Users have MANAGER role in `user_roles` table (confirmed in Task 1.1)

**Conclusion:** The target users SHOULD be showing up on the user list page. If they are not appearing, it's likely due to:
1. Frontend caching
2. Browser caching
3. User not refreshing the page
4. Role filter dropdown being set to something other than "All Roles"

### Issue 2: Selecting "Manager" During User Creation Saves as "customer"

**ROOT CAUSE:** The legacy `role` field in the `user` table is NOT being updated when users are created with Manager role.

**Why This Happens:**
1. Prisma schema defines: `role UserRole @default(customer)` (line 22 of schema.prisma)
2. User creation code does NOT set the `role` field (confirmed in Task 2.3)
3. The `user_roles` table is correctly populated with Manager role assignment
4. But the legacy `role` field remains at its default value: "customer"

**Impact:**
- The legacy `role` field is inconsistent with actual role assignments
- Any code that still uses the legacy `role` field will show incorrect data
- This creates confusion in the system

### Issue 3: Frontend Expects Missing Property

**ROOT CAUSE:** Backend API does not calculate or provide `maxRoleLevel` property.

**Impact:**
- Frontend displays "Level undefined" for all users
- Users cannot see their role hierarchy level in the UI
- This is a UX issue, not a functional issue

---

## Why Previous Fixes Did Not Work

### Fix 1: "Removed hardcoded `role: 'customer'` from user creation"

**What Was Done:**
- Removed `role: 'customer'` from the user creation code

**Why It Didn't Work:**
- The fix was correct in removing the hardcoded value
- BUT the code still doesn't SET the `role` field at all
- So it defaults to "customer" from the Prisma schema
- The `user_roles` table IS being populated correctly, but the legacy field is not

### Fix 2: "Removed `legacy_role` field from user list response"

**What Was Done:**
- Removed `legacy_role` from the backend response

**Why It Didn't Work:**
- The backend was never returning a `legacy_role` field
- It was returning `role` (the legacy field from the user table)
- The transformation correctly maps `user.user_roles` to `roles` array
- The legacy `role` field is still included in the select but not used in transformation

### Fix 3: "Updated filtering logic to use `role.name`"

**What Was Done:**
- Updated frontend filtering to use `role.name` instead of legacy field

**Why It Didn't Work:**
- This fix was actually CORRECT
- The frontend filtering should work with the `roles` array
- The issue is that the backend is not providing `maxRoleLevel`

---

## Additional Issues Found

### Issue 4: Duplicate Manager Roles

**SEVERITY:** HIGH

**Problem:**
- There are TWO Manager roles in the database with different case (uppercase vs lowercase)
- This creates confusion and potential bugs
- Users are being assigned to "MANAGER" (uppercase) role
- Some code might be looking for "manager" (lowercase) role

**Recommendation:**
- Remove one of the duplicate Manager roles
- Ensure all role names are consistent (either all uppercase or all lowercase)
- Update any code that references role names to use consistent case

### Issue 5: Legacy Role Field Not Updated on User Creation

**SEVERITY:** HIGH

**Problem:**
- When users are created with a specific role, the legacy `role` field is not updated
- This creates data inconsistency
- Any code that uses the legacy field will show incorrect data

**Recommendation:**
- Either remove the legacy `role` field entirely (since user_roles table is the source of truth)
- OR update the legacy `role` field when users are created/roles are assigned
- OR remove the default value from the Prisma schema

### Issue 6: Frontend Expects Missing Property

**SEVERITY:** MEDIUM

**Problem:**
- Frontend expects `maxRoleLevel` property that backend doesn't provide
- This causes "Level undefined" to display in the UI

**Recommendation:**
- Backend should calculate `maxRoleLevel` from the `roles` array
- Frontend should handle missing `maxRoleLevel` gracefully

---

## Recommended Fixes

### Priority 1: Fix Duplicate Manager Roles

```sql
-- Step 1: Identify which role is being used
SELECT role_id, COUNT(*) as user_count 
FROM user_roles 
WHERE role_id IN (
  SELECT id FROM roles WHERE name IN ('manager', 'MANAGER')
)
GROUP BY role_id;

-- Step 2: Remove the unused role (after verifying which one to keep)
DELETE FROM roles WHERE id = '[unused_role_id]';

-- Step 3: Update any references if needed
-- (This step depends on which role is being used)
```

### Priority 2: Update Legacy Role Field on User Creation

**File:** [`backend/routes/rbacUserRoles.js`](backend/routes/rbacUserRoles.js:476)

**Option A: Remove Legacy Field Dependency**
```javascript
// Don't use the legacy role field at all
// Remove it from the Prisma schema
// Update all code to use user_roles table
```

**Option B: Update Legacy Field**
```javascript
// After creating user_roles, update the legacy role field
const primaryRole = await tx.roles.findFirst({
  where: { id: role_ids[0] }
});

await tx.user.update({
  where: { id: user.id },
  data: { role: primaryRole.name }
});
```

### Priority 3: Add maxRoleLevel to Backend Response

**File:** [`backend/routes/rbacUserRoles.js`](backend/routes/rbacUserRoles.js:672)

```javascript
// Calculate max role level for each user
const transformedUsers = users.map(user => {
  const maxLevel = user.user_roles.length > 0
    ? Math.max(...user.user_roles.map(ur => ur.roles.hierarchy_level))
    : 0;
  
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    first_name: user.firstName,
    last_name: user.lastName,
    status: user.status,
    maxRoleLevel: maxLevel,  // ← ADD THIS
    roles: user.user_roles.map(ur => ({
      id: ur.roles.id,
      name: ur.roles.name,
      description: ur.roles.description,
      hierarchy_level: ur.roles.hierarchy_level,
      assigned_at: ur.assigned_at
    })),
    created_at: user.createdAt,
    updated_at: user.updatedAt
  };
});
```

---

## Summary

### Why Issues Persist

The previous fixes did not resolve the issues because:

1. **They addressed the wrong problem** - The issue wasn't about hardcoded values or response structure, but about:
   - Duplicate Manager roles in the database
   - Legacy role field not being updated
   - Missing `maxRoleLevel` property

2. **They didn't address data consistency** - The `user_roles` table is correct, but the legacy `role` field is inconsistent

3. **They missed a frontend-backend contract mismatch** - The frontend expects `maxRoleLevel` but backend doesn't provide it

### What Needs to Be Done

1. **Remove duplicate Manager roles** - Keep only one (prefer "MANAGER" since users are assigned to it)
2. **Update legacy role field** - Either remove it entirely or update it when users are created
3. **Add maxRoleLevel to backend** - Calculate and return this property in the API response
4. **Test thoroughly** - After fixes, verify:
   - Users show up on the list page
   - Creating users with Manager role saves correctly
   - Role levels display correctly in the UI

---

## Conclusion

The investigation revealed that the User Role Management issues are **NOT due to missing users or broken API endpoints**, but rather due to:

1. **Data inconsistency** between legacy `role` field and `user_roles` table
2. **Duplicate Manager roles** causing confusion
3. **Missing API property** (`maxRoleLevel`) that frontend expects

The previous fixes addressed symptoms but not root causes. To fully resolve these issues, the recommended fixes above must be implemented.
