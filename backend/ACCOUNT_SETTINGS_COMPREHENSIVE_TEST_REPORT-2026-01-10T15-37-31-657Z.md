# Account Settings Comprehensive Test Report

**Generated:** 2026-01-10T15:37:31.660Z

## Test Summary

- **Total Tests:** 11
- **Passed:** 10 ✅
- **Failed:** 1 ❌
- **Success Rate:** 90.91%

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
9. POST /api/v1/profile/account/2fa/enable
10. GET /api/v1/profile/account/2fa/status
11. POST /api/v1/profile/account/2fa/disable

## Detailed Results

### Notification Preferences

| Test Name | Status | Details |
|-----------|--------|---------|
| GET /api/v1/profile/preferences/notifications | ✅ PASS | Status: 200 | Data: {"success":true,"data":{"preferences":{"id":"def525ab-1890-4ac4-a79d-f0cf7244b12b","userId":"8d19c63... |
| PUT /api/v1/profile/preferences/notifications | ✅ PASS | Status: 200 | Data: {"success":true,"data":{"preferences":{"id":"def525ab-1890-4ac4-a79d-f0cf7244b12b","userId":"8d19c63... |

### Communication Preferences

| Test Name | Status | Details |
|-----------|--------|---------|
| GET /api/v1/profile/preferences/communication | ✅ PASS | Status: 200 | Data: {"success":true,"data":{"preferences":{"id":"57e00ad0-0a83-4a6d-b518-fb2570af0165","userId":"8d19c63... |
| PUT /api/v1/profile/preferences/communication | ✅ PASS | Status: 200 | Data: {"success":true,"data":{"preferences":{"id":"57e00ad0-0a83-4a6d-b518-fb2570af0165","userId":"8d19c63... |

### Privacy Settings

| Test Name | Status | Details |
|-----------|--------|---------|
| GET /api/v1/profile/preferences/privacy | ✅ PASS | Status: 200 | Data: {"success":true,"data":{"settings":{"id":"f4bd5060-733d-464c-b49d-4a285041cef7","userId":"8d19c632-8... |
| PUT /api/v1/profile/preferences/privacy | ✅ PASS | Status: 200 | Data: {"success":true,"data":{"settings":{"id":"f4bd5060-733d-464c-b49d-4a285041cef7","userId":"8d19c632-8... |

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
| POST /api/v1/profile/account/2fa/enable | ✅ PASS | Status: 200 | Data: {"success":true,"message":"Two-factor authentication enabled successfully.","messageBn":"দুই-ফ্যাক্ট... |
| GET /api/v1/profile/account/2fa/status | ✅ PASS | Status: 200 | Data: {"success":true,"data":{"enabled":false,"method":null}}... |
| POST /api/v1/profile/account/2fa/disable | ✅ PASS | Status: 200 | Data: {"success":true,"message":"Two-factor authentication disabled successfully.","messageBn":"দুই-ফ্যাক্... |

## Issues Found

### GET /api/v1/profile/account/deletion/status
- **Category:** Account Management
- **Error:** Status 500
- **Response Status:** 500
- **Response Data:** `{"error":"Failed to get deletion status","message":"\nInvalid `this.prisma.user.findUnique()` invocation in\n/app/services/accountDeletion.service.js:284:43\n\n  281  */\n  282 async getDeletionStatus(userId) {\n  283   try {\n→ 284     const user = await this.prisma.user.findUnique({\n            where: {\n              id: \"8d19c632-8cb2-41d5-b779-b22d64e4fa2b\"\n            },\n            select: {\n            ~~~~~~\n              id: true,\n              email: true,\n              firstName: true,\n              lastName: true,\n              accountStatus: true,\n              deletionRequestedAt: true,\n              deletedAt: true,\n              deletionReason: true,\n              orders: {\n                where: {\n                  status: {\n                    notIn: [\n                      \"DELIVERED\",\n                      \"CANCELLED\",\n                      \"REFUNDED\"\n                    ]\n                  }\n                },\n                select: {\n                  id: true,\n                  orderNumber: true,\n                  status: true\n                }\n              }\n            },\n            include: {\n            ~~~~~~~\n              accountDeletionRequests: {\n                where: {\n                  status: \"pending\"\n                },\n                orderBy: {\n                  requestedAt: \"desc\"\n                },\n                take: 1\n              }\n            }\n          })\n\nPlease either use `include` or `select`, but not both at the same time.","messageBn":"ডিলিশন স্ট্যাটাস পাওতে ব্যর্থ হয়েছে"}`

