# Account Settings Comprehensive Test Report

**Generated:** 2026-01-10T15:31:35.674Z

## Test Summary

- **Total Tests:** 11
- **Passed:** 2 ✅
- **Failed:** 9 ❌
- **Success Rate:** 18.18%

## Endpoints Tested

### Preference Routes (6 endpoints)
1. GET /api/v1/profile/preferences/notifications
2. PUT /api/v1/profile/preferences/notifications
3. GET /api/v1/profile/preferences/communication
4. PUT /api/v1/profile/preferences/communication
5. GET /api/v1/profile/preferences/privacy
6. PUT /api/v1/profile/preferences/privacy

### Data Export Routes (1 endpoint)
7. GET /api/v1/profile/data/export

### Account Management Routes (1 endpoint)
8. GET /api/v1/profile/account/deletion/status

### 2FA Routes (3 endpoints)
9. POST /api/v1/profile/2fa/enable
10. GET /api/v1/profile/2fa/status
11. POST /api/v1/profile/2fa/disable

## Detailed Results

### Notification Preferences

| Test Name | Status | Details |
|-----------|--------|---------|
| GET /api/v1/profile/preferences/notifications | ❌ FAIL | Status: 200 | Data: {"success":true,"data":{"preferences":{"id":"def525ab-1890-4ac4-a79d-f0cf7244b12b","userId":"8d19c63... | Error: Incorrect response format - expected data.settings |
| PUT /api/v1/profile/preferences/notifications | ❌ FAIL | Status: 200 | Data: {"success":true,"data":{"preferences":{"id":"def525ab-1890-4ac4-a79d-f0cf7244b12b","userId":"8d19c63... | Error: Incorrect response format |

### Communication Preferences

| Test Name | Status | Details |
|-----------|--------|---------|
| GET /api/v1/profile/preferences/communication | ❌ FAIL | Status: 200 | Data: {"success":true,"data":{"preferences":{"id":"57e00ad0-0a83-4a6d-b518-fb2570af0165","userId":"8d19c63... | Error: Incorrect response format |
| PUT /api/v1/profile/preferences/communication | ❌ FAIL | Status: 200 | Data: {"success":true,"data":{"preferences":{"id":"57e00ad0-0a83-4a6d-b518-fb2570af0165","userId":"8d19c63... | Error: Incorrect response format |

### Privacy Settings

| Test Name | Status | Details |
|-----------|--------|---------|
| GET /api/v1/profile/preferences/privacy | ✅ PASS | Status: 200 | Data: {"success":true,"data":{"settings":{"id":"f4bd5060-733d-464c-b49d-4a285041cef7","userId":"8d19c632-8... |
| PUT /api/v1/profile/preferences/privacy | ❌ FAIL | Status: 400 | Data: {"error":"Validation failed","details":[{"type":"field","value":"public","msg":"Invalid profile visi... | Error: Status 400 |

### Data Export

| Test Name | Status | Details |
|-----------|--------|---------|
| GET /api/v1/profile/data/export | ✅ PASS | Status: 200 | Data: {"success":true,"data":{"exports":[]}}... |

### Account Management

| Test Name | Status | Details |
|-----------|--------|---------|
| GET /api/v1/profile/account/deletion/status | ❌ FAIL | Status: 500 | Data: {"error":"Failed to get deletion status","message":"\nInvalid `this.prisma.user.findUnique()` invoca... | Error: Status 500 |

### 2FA

| Test Name | Status | Details |
|-----------|--------|---------|
| POST /api/v1/profile/2fa/enable | ❌ FAIL | Status: 404 | Data: {"error":"Route not found","message":"The requested route POST /api/v1/profile/2fa/enable was not fo... | Error: Status 404 |
| GET /api/v1/profile/2fa/status | ❌ FAIL | Status: 404 | Data: {"error":"Route not found","message":"The requested route GET /api/v1/profile/2fa/status was not fou... | Error: Status 404 |
| POST /api/v1/profile/2fa/disable | ❌ FAIL | Status: 404 | Data: {"error":"Route not found","message":"The requested route POST /api/v1/profile/2fa/disable was not f... | Error: Status 404 |

## Issues Found

### GET /api/v1/profile/preferences/notifications
- **Category:** Notification Preferences
- **Error:** Incorrect response format - expected data.settings
- **Response Status:** 200
- **Response Data:** `{"success":true,"data":{"preferences":{"id":"def525ab-1890-4ac4-a79d-f0cf7244b12b","userId":"8d19c632-8cb2-41d5-b779-b22d64e4fa2b","emailNotifications":true,"smsNotifications":false,"whatsappNotifications":true,"marketingCommunications":true,"newsletterSubscription":true,"notificationFrequency":"immediate","createdAt":"2026-01-10T15:31:35.383Z","updatedAt":"2026-01-10T15:31:35.383Z"}}}`

### PUT /api/v1/profile/preferences/notifications
- **Category:** Notification Preferences
- **Error:** Incorrect response format
- **Response Status:** 200
- **Response Data:** `{"success":true,"data":{"preferences":{"id":"def525ab-1890-4ac4-a79d-f0cf7244b12b","userId":"8d19c632-8cb2-41d5-b779-b22d64e4fa2b","emailNotifications":true,"smsNotifications":false,"whatsappNotifications":true,"marketingCommunications":true,"newsletterSubscription":true,"notificationFrequency":"immediate","createdAt":"2026-01-10T15:31:35.383Z","updatedAt":"2026-01-10T15:31:35.383Z"}}}`

### GET /api/v1/profile/preferences/communication
- **Category:** Communication Preferences
- **Error:** Incorrect response format
- **Response Status:** 200
- **Response Data:** `{"success":true,"data":{"preferences":{"id":"57e00ad0-0a83-4a6d-b518-fb2570af0165","userId":"8d19c632-8cb2-41d5-b779-b22d64e4fa2b","preferredLanguage":"en","preferredTimezone":"UTC","preferredContactMethod":"email","marketingConsent":false,"dataSharingConsent":false,"createdAt":"2026-01-10T15:31:35.434Z","updatedAt":"2026-01-10T15:31:35.434Z"}}}`

### PUT /api/v1/profile/preferences/communication
- **Category:** Communication Preferences
- **Error:** Incorrect response format
- **Response Status:** 200
- **Response Data:** `{"success":true,"data":{"preferences":{"id":"57e00ad0-0a83-4a6d-b518-fb2570af0165","userId":"8d19c632-8cb2-41d5-b779-b22d64e4fa2b","preferredLanguage":"en","preferredTimezone":"UTC","preferredContactMethod":"email","marketingConsent":false,"dataSharingConsent":false,"createdAt":"2026-01-10T15:31:35.434Z","updatedAt":"2026-01-10T15:31:35.434Z"}}}`

### PUT /api/v1/profile/preferences/privacy
- **Category:** Privacy Settings
- **Error:** Status 400
- **Response Status:** 400
- **Response Data:** `{"error":"Validation failed","details":[{"type":"field","value":"public","msg":"Invalid profile visibility value","path":"profileVisibility","location":"body"}]}`

### GET /api/v1/profile/account/deletion/status
- **Category:** Account Management
- **Error:** Status 500
- **Response Status:** 500
- **Response Data:** `{"error":"Failed to get deletion status","message":"\nInvalid `this.prisma.user.findUnique()` invocation in\n/app/services/accountDeletion.service.js:284:43\n\n  281  */\n  282 async getDeletionStatus(userId) {\n  283   try {\n→ 284     const user = await this.prisma.user.findUnique({\n            where: {\n              id: \"8d19c632-8cb2-41d5-b779-b22d64e4fa2b\"\n            },\n            select: {\n            ~~~~~~\n              id: true,\n              email: true,\n              firstName: true,\n              lastName: true,\n              accountStatus: true,\n              deletionRequestedAt: true,\n              deletedAt: true,\n              deletionReason: true,\n              orders: {\n                where: {\n                  status: {\n                    notIn: [\n                      \"DELIVERED\",\n                      \"CANCELLED\",\n                      \"REFUNDED\"\n                    ]\n                  }\n                },\n                select: {\n                  id: true,\n                  orderNumber: true,\n                  status: true\n                }\n              }\n            },\n            include: {\n            ~~~~~~~\n              accountDeletionRequests: {\n                where: {\n                  status: \"pending\"\n                },\n                orderBy: {\n                  requestedAt: \"desc\"\n                },\n                take: 1\n              }\n            }\n          })\n\nPlease either use `include` or `select`, but not both at the same time.","messageBn":"ডিলিশন স্ট্যাটাস পাওতে ব্যর্থ হয়েছে"}`

### POST /api/v1/profile/2fa/enable
- **Category:** 2FA
- **Error:** Status 404
- **Response Status:** 404
- **Response Data:** `{"error":"Route not found","message":"The requested route POST /api/v1/profile/2fa/enable was not found","messageBn":"অনুরোধকৃত রুট POST /api/v1/profile/2fa/enable পাওয়া যায়নি","path":"/api/v1/profile/2fa/enable","method":"POST","timestamp":"2026-01-10T15:31:35.663Z","availableEndpoints":{"auth":"/api/v1/auth","users":"/api/v1/users","profile":"/api/v1/profile","oauth":"/api/v1/oauth","products":"/api/v1/products","categories":"/api/v1/categories","brands":"/api/v1/brands","orders":"/api/v1/orders","cart":"/api/v1/cart","wishlist":"/api/v1/wishlist","reviews":"/api/v1/reviews","coupons":"/api/v1/coupons","user":"/api/v1/user","sessions":"/api/v1/sessions","health":"/api/v1/health","docs":"/api-docs"}}`

### GET /api/v1/profile/2fa/status
- **Category:** 2FA
- **Error:** Status 404
- **Response Status:** 404
- **Response Data:** `{"error":"Route not found","message":"The requested route GET /api/v1/profile/2fa/status was not found","messageBn":"অনুরোধকৃত রুট GET /api/v1/profile/2fa/status পাওয়া যায়নি","path":"/api/v1/profile/2fa/status","method":"GET","timestamp":"2026-01-10T15:31:35.666Z","availableEndpoints":{"auth":"/api/v1/auth","users":"/api/v1/users","profile":"/api/v1/profile","oauth":"/api/v1/oauth","products":"/api/v1/products","categories":"/api/v1/categories","brands":"/api/v1/brands","orders":"/api/v1/orders","cart":"/api/v1/cart","wishlist":"/api/v1/wishlist","reviews":"/api/v1/reviews","coupons":"/api/v1/coupons","user":"/api/v1/user","sessions":"/api/v1/sessions","health":"/api/v1/health","docs":"/api-docs"}}`

### POST /api/v1/profile/2fa/disable
- **Category:** 2FA
- **Error:** Status 404
- **Response Status:** 404
- **Response Data:** `{"error":"Route not found","message":"The requested route POST /api/v1/profile/2fa/disable was not found","messageBn":"অনুরোধকৃত রুট POST /api/v1/profile/2fa/disable পাওয়া যায়নি","path":"/api/v1/profile/2fa/disable","method":"POST","timestamp":"2026-01-10T15:31:35.670Z","availableEndpoints":{"auth":"/api/v1/auth","users":"/api/v1/users","profile":"/api/v1/profile","oauth":"/api/v1/oauth","products":"/api/v1/products","categories":"/api/v1/categories","brands":"/api/v1/brands","orders":"/api/v1/orders","cart":"/api/v1/cart","wishlist":"/api/v1/wishlist","reviews":"/api/v1/reviews","coupons":"/api/v1/coupons","user":"/api/v1/user","sessions":"/api/v1/sessions","health":"/api/v1/health","docs":"/api-docs"}}`

