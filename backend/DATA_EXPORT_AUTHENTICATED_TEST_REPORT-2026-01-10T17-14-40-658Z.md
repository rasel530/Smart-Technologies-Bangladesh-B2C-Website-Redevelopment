# Data Export Authenticated Test Report

**Generated:** 2026-01-10T17:14:40.661Z

## Test Summary

- **Total Tests:** 12
- **Passed:** 11
- **Failed:** 1
- **Success Rate:** 91.67%

## User Creation

- **Status:** ✅ SUCCESS
- **Message:** User already exists
- **User ID:** db4017df-a883-47fa-976e-173beb9f586d

## Login

- **Status:** ✅ SUCCESS
- **User ID:** db4017df-a883-47fa-976e-173beb9f586d
- **Token:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiO...

## Verification of Partial/Failed Fixes

| Fix | Status |
|-----|--------|
| Data Export Null Checks | ✅ FULLY VERIFIED |
| Data Export Download Functionality | ✅ FULLY VERIFIED |
| Data Export CSV Generation | ❌ FAILED |

## Overall Status

❌ SOME FIXES FAILED

## Detailed Test Results

### Data Export

| Test Name | Status | Details |
|-----------|--------|---------|
| Get data exports returns 200 OK | ✅ PASS |  |
| Exports array is properly handled | ✅ PASS |  |
| No "exportItem is undefined" error | ✅ PASS |  |
| Create export request returns 200 OK | ✅ PASS |  |
| Export request has exportId | ✅ PASS |  |
| Export request has status | ✅ PASS |  |
| Export request has exportToken | ✅ PASS |  |
| Download export returns 200 OK | ✅ PASS |  |
| Download URL is provided | ✅ PASS |  |
| Expires at is provided | ✅ PASS |  |
| CSV file is generated correctly | ❌ FAIL |  |
| No "res is not defined" error | ✅ PASS |  |

