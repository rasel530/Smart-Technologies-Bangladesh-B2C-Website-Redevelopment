# Notification Preferences 500 Error - Root Cause Analysis

## Summary
The endpoint `GET /api/v1/profile/preferences/notifications` is returning a 500 Internal Server Error due to **schema mismatch between Prisma schema and actual database**.

## Root Cause

### 1. Database Schema Mismatch

The actual database table `user_notification_preferences` has these columns:
- id
- userId
- emailNotifications
- smsNotifications
- whatsappNotifications
- **marketingCommunications** ✅ (exists in DB)
- newsletterSubscription
- notificationFrequency
- createdAt
- updatedAt

But the Prisma schema (`backend/prisma/schema.prisma` lines 394-411) expects:
- id
- userId
- emailNotifications
- smsNotifications
- whatsappNotifications
- **promotionalEmails** ❌ (NOT in DB)
- newsletterSubscription
- notificationFrequency
- createdAt
- updatedAt
- **pushNotifications** ❌ (NOT in DB)
- **orderUpdates** ❌ (NOT in DB)
- **securityAlerts** ❌ (NOT in DB)

### 2. Service Code Issues

In `backend/services/accountPreferences.service.js`, the [`getNotificationPreferences()`](backend/services/accountPreferences.service.js:331-349) method (lines 331-349) has TWO bugs:

**Bug 1: Wrong field name (line 339)**
```javascript
marketing: preferences.notificationPrefs.promotionalEmails,  // ❌ WRONG
```
- Database has: `marketingCommunications`
- Code tries to access: `promotionalEmails`
- This field doesn't exist in database

**Bug 2: Wrong field name (line 340)**
```javascript
newsletter: preferences.notificationPrefs.newsletter,  // ❌ WRONG
```
- Database has: `newsletterSubscription`
- Code tries to access: `newsletter`
- This field doesn't exist in database

## Error Flow

1. Frontend requests: `GET /api/v1/profile/preferences/notifications`
2. Route handler in [`backend/routes/userPreferences.js`](backend/routes/userPreferences.js:69-86) (lines 69-86) calls service
3. Service [`getNotificationPreferences()`](backend/services/accountPreferences.service.js:331-349) (lines 331-349) tries to query database
4. Prisma tries to access columns that don't exist: `promotionalEmails`, `pushNotifications`, `orderUpdates`, `securityAlerts`
5. **Prisma throws error**: "The column `user_notification_preferences.promotionalEmails` does not exist in current database"
6. Error is caught and returned as 500 Internal Server Error

## Evidence

From diagnostic script output:
```
ERROR: The column `user_notification_preferences.promotionalEmails` does not exist in current database.
```

## Required Fix

The fix requires TWO steps:

### Step 1: Update Prisma Schema to Match Database
Update `backend/prisma/schema.prisma` UserNotificationPreferences model (lines 394-411) to match actual database:

**Current (WRONG):**
```prisma
model UserNotificationPreferences {
  id                    String   @id @default(uuid())
  userId                String   @unique
  emailNotifications    Boolean  @default(true)
  smsNotifications      Boolean  @default(false)
  whatsappNotifications Boolean  @default(false)
  promotionalEmails     Boolean  @default(false)  ❌ Wrong name
  newsletterSubscription Boolean  @default(false)
  notificationFrequency  String   @default("immediate")
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  pushNotifications     Boolean? @default(true)  ❌ Missing in DB
  orderUpdates          Boolean? @default(true)  ❌ Missing in DB
  securityAlerts        Boolean? @default(true)  ❌ Missing in DB
  user                  User     @relation(...)
}
```

**Should be (CORRECT):**
```prisma
model UserNotificationPreferences {
  id                      String   @id @default(uuid())
  userId                  String   @unique
  emailNotifications      Boolean  @default(true)
  smsNotifications        Boolean  @default(false)
  whatsappNotifications   Boolean  @default(false)
  marketingCommunications Boolean  @default(false)  ✅ Correct name
  newsletterSubscription   Boolean  @default(false)
  notificationFrequency   String   @default("immediate")
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
  user                    User     @relation(...)
}
```

### Step 2: Fix Service Code Field Names
Update `backend/services/accountPreferences.service.js` [`getNotificationPreferences()`](backend/services/accountPreferences.service.js:331-349) method (lines 331-349):

**Current (WRONG - lines 335-344):**
```javascript
return {
  email: preferences.notificationPrefs.emailNotifications,
  sms: preferences.notificationPrefs.smsNotifications,
  whatsapp: preferences.notificationPrefs.whatsappNotifications,
  marketing: preferences.notificationPrefs.promotionalEmails,  ❌ WRONG
  newsletter: preferences.notificationPrefs.newsletter,  ❌ WRONG
  push: preferences.notificationPrefs.pushNotifications,  ❌ Missing in DB
  orderUpdates: preferences.notificationPrefs.orderUpdates,  ❌ Missing in DB
  securityAlerts: preferences.notificationPrefs.securityAlerts  ❌ Missing in DB
};
```

**Should be (CORRECT):**
```javascript
return {
  email: preferences.notificationPrefs.emailNotifications,
  sms: preferences.notificationPrefs.smsNotifications,
  whatsapp: preferences.notificationPrefs.whatsappNotifications,
  marketing: preferences.notificationPrefs.marketingCommunications,  ✅ CORRECT
  newsletter: preferences.notificationPrefs.newsletterSubscription,  ✅ CORRECT
  frequency: preferences.notificationPrefs.notificationFrequency
};
```

### Step 3: Regenerate Prisma Client
After updating schema:
```bash
cd backend
npx prisma generate
```

## Alternative Fix (Add Missing Columns to Database)

If the intention is to keep the Prisma schema as-is, then the database needs to be migrated to add the missing columns:

```sql
ALTER TABLE user_notification_preferences
ADD COLUMN pushNotifications BOOLEAN DEFAULT true,
ADD COLUMN orderUpdates BOOLEAN DEFAULT true,
ADD COLUMN securityAlerts BOOLEAN DEFAULT true;

-- Rename column
ALTER TABLE user_notification_preferences
RENAME COLUMN marketingCommunications TO promotionalEmails;
```

Then run:
```bash
cd backend
npx prisma db push
```

## Recommendation

**Recommended approach**: Update Prisma schema and service code to match the existing database structure. This is safer because:
1. Database already has data and is working for other endpoints
2. Less risk of data loss
3. Only code changes needed, no database schema changes

## Files to Modify

1. `backend/prisma/schema.prisma` - Lines 394-411 (UserNotificationPreferences model)
2. `backend/services/accountPreferences.service.js` - Lines 331-349 (getNotificationPreferences method)
3. `backend/services/accountPreferences.service.js` - Lines 146-219 (updateNotificationPreferences method - may also need fixes)

## Next Steps

1. Choose fix approach (update schema vs. update database)
2. Apply the fix
3. Test the endpoint
4. Verify all notification preference fields work correctly
