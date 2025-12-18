================================================================================
 REVIEW MANAGEMENT TEST EXECUTION REPORT 
================================================================================

EXECUTIVE SUMMARY:
===================
Execution Date: 12/17/2025, 1:10:24 AM
Total Test Suites: 7
Total Tests: 0
Passed: 0
Failed: 7
Skipped: 0
Success Rate: 0.00%
Total Duration: 106299ms
Average Test Duration: 0.00ms
Errors: 7
Warnings: 7

TEST SUITE DETAILS:
====================

bangladesh-review-fixtures.test.js:
  Status: failed
  Total Tests: 0
  Passed: 0
  Failed: 1
  Skipped: 0
  Duration: 19405.514ms
  Errors:
    - Command failed: npx jest bangladesh-review-fixtures.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./bangladesh-review-fixtures.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        12.015 s
Ran all test suites matching bangladesh-review-fixtures.test.js.


api-reviews-basic.test.js:
  Status: failed
  Total Tests: 0
  Passed: 0
  Failed: 1
  Skipped: 0
  Duration: 14593.6083ms
  Errors:
    - Command failed: npx jest api-reviews-basic.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-basic.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.556 s
Ran all test suites matching api-reviews-basic.test.js.


api-reviews-moderation.test.js:
  Status: failed
  Total Tests: 0
  Passed: 0
  Failed: 1
  Skipped: 0
  Duration: 14490.071799999998ms
  Errors:
    - Command failed: npx jest api-reviews-moderation.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-moderation.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        6.566 s
Ran all test suites matching api-reviews-moderation.test.js.


api-reviews-aggregation.test.js:
  Status: failed
  Total Tests: 0
  Passed: 0
  Failed: 1
  Skipped: 0
  Duration: 14302.786399999997ms
  Errors:
    - Command failed: npx jest api-reviews-aggregation.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-aggregation.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.389 s
Ran all test suites matching api-reviews-aggregation.test.js.


api-reviews-bangladesh.test.js:
  Status: failed
  Total Tests: 0
  Passed: 0
  Failed: 1
  Skipped: 0
  Duration: 15574.243299999995ms
  Errors:
    - Command failed: npx jest api-reviews-bangladesh.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-bangladesh.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.787 s
Ran all test suites matching api-reviews-bangladesh.test.js.


api-reviews-analytics.test.js:
  Status: failed
  Total Tests: 0
  Passed: 0
  Failed: 1
  Skipped: 0
  Duration: 13859.681100000002ms
  Errors:
    - Command failed: npx jest api-reviews-analytics.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-analytics.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.046 s
Ran all test suites matching api-reviews-analytics.test.js.


api-reviews-performance.test.js:
  Status: failed
  Total Tests: 0
  Passed: 0
  Failed: 1
  Skipped: 0
  Duration: 14051.5003ms
  Errors:
    - Command failed: npx jest api-reviews-performance.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-performance.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.216 s
Ran all test suites matching api-reviews-performance.test.js.


ERROR SUMMARY:
===============
1. bangladesh-review-fixtures.test.js: Command failed: npx jest bangladesh-review-fixtures.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./bangladesh-review-fixtures.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        12.015 s
Ran all test suites matching bangladesh-review-fixtures.test.js.

2. api-reviews-basic.test.js: Command failed: npx jest api-reviews-basic.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-basic.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.556 s
Ran all test suites matching api-reviews-basic.test.js.

3. api-reviews-moderation.test.js: Command failed: npx jest api-reviews-moderation.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-moderation.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        6.566 s
Ran all test suites matching api-reviews-moderation.test.js.

4. api-reviews-aggregation.test.js: Command failed: npx jest api-reviews-aggregation.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-aggregation.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.389 s
Ran all test suites matching api-reviews-aggregation.test.js.

5. api-reviews-bangladesh.test.js: Command failed: npx jest api-reviews-bangladesh.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-bangladesh.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.787 s
Ran all test suites matching api-reviews-bangladesh.test.js.

6. api-reviews-analytics.test.js: Command failed: npx jest api-reviews-analytics.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-analytics.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.046 s
Ran all test suites matching api-reviews-analytics.test.js.

7. api-reviews-performance.test.js: Command failed: npx jest api-reviews-performance.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-performance.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.216 s
Ran all test suites matching api-reviews-performance.test.js.


WARNING SUMMARY:
=================
1. bangladesh-review-fixtures.test.js: Environment issue detected: Command failed: npx jest bangladesh-review-fixtures.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./bangladesh-review-fixtures.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        12.015 s
Ran all test suites matching bangladesh-review-fixtures.test.js.

2. api-reviews-basic.test.js: Environment issue detected: Command failed: npx jest api-reviews-basic.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-basic.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.556 s
Ran all test suites matching api-reviews-basic.test.js.

3. api-reviews-moderation.test.js: Environment issue detected: Command failed: npx jest api-reviews-moderation.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-moderation.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        6.566 s
Ran all test suites matching api-reviews-moderation.test.js.

4. api-reviews-aggregation.test.js: Environment issue detected: Command failed: npx jest api-reviews-aggregation.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-aggregation.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.389 s
Ran all test suites matching api-reviews-aggregation.test.js.

5. api-reviews-bangladesh.test.js: Environment issue detected: Command failed: npx jest api-reviews-bangladesh.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-bangladesh.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.787 s
Ran all test suites matching api-reviews-bangladesh.test.js.

6. api-reviews-analytics.test.js: Environment issue detected: Command failed: npx jest api-reviews-analytics.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-analytics.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.046 s
Ran all test suites matching api-reviews-analytics.test.js.

7. api-reviews-performance.test.js: Environment issue detected: Command failed: npx jest api-reviews-performance.test.js --verbose --detectOpenHandles --forceExit --testTimeout=30000
FAIL ./api-reviews-performance.test.js
  ● Test suite failed to run

    Cannot find module 'redis' from 'tests/jest.setup.js'

    [0m [90m 69 |[39m
     [90m 70 |[39m [90m// Mock Redis[39m
    [31m[1m>[22m[39m[90m 71 |[39m jest[33m.[39mmock([32m'redis'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 72 |[39m   createClient[33m:[39m jest[33m.[39mfn(() [33m=>[39m ({
     [90m 73 |[39m     connect[33m:[39m jest[33m.[39mfn()[33m.[39mmockResolvedValue()[33m,[39m
     [90m 74 |[39m     on[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/jest.setup.js:71:6)

Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\middleware\auth.js: Missing semicolon. (162:11)

[0m [90m 160 |[39m
 [90m 161 |[39m       [90m// JWT token rotation and refresh mechanism[39m
[31m[1m>[22m[39m[90m 162 |[39m       [36masync[39m rotateToken(req[33m,[39m res) {
 [90m     |[39m            [31m[1m^[22m[39m
 [90m 163 |[39m         [36mtry[39m {
 [90m 164 |[39m           [36mconst[39m { refreshToken } [33m=[39m req[33m.[39mbody[33m;[39m
 [90m 165 |[39m           [0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.semicolon (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6920:10)
    at Parser.parseExpressionStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13361:10)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12975:19)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseArrowExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12149:10)
    at Parser.parseAsyncArrowFromCallExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11328:10)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11258:27)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at Parser.parseExpressionBase (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10848:23)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12495:16)
    at Parser.parseExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10844:17)
    at Parser.parseReturnStatement (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13218:28)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12874:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseStatementListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12823:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:61)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseBlock (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13373:10)
    at Parser.parseFunctionBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12174:24)
    at Parser.parseFunctionBodyAndFinish (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12160:10)
    at Parser.parseMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12118:31)
    at Parser.pushClassMethod (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13803:30)
    at Parser.parseClassMemberWithIsStatic (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13691:12)
    at Parser.parseClassMember (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13639:10)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13593:14
    at Parser.withSmartMixTopicForbiddingContext (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12477:14)
    at Parser.parseClassBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13575:10)
    at Parser.parseClass (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13550:22)
    at Parser.parseStatementContent (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12870:21)
    at Parser.parseStatementLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12843:17)
    at Parser.parseModuleItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12820:17)
    at Parser.parseBlockOrModuleBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13392:36)
    at Parser.parseBlockBody (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:13385:10)
    at Parser.parseProgram (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12698:10)
Failed to collect coverage from E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js
ERROR: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
STACK: SyntaxError: E:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\routes\cart.js: Unexpected token, expected "," (125:76)

[0m [90m 123 |[39m       [36mconst[39m newQuantity [33m=[39m existingItem[33m.[39mquantity [33m+[39m quantity[33m;[39m
 [90m 124 |[39m       [36mconst[39m unitPrice [33m=[39m variantId 
[31m[1m>[22m[39m[90m 125 |[39m         [33m?[39m ([36mawait[39m prisma[33m.[39mproductVariant[33m.[39mfindUnique({ where[33m:[39m { id[33m:[39m variantId }))[33m.[39mprice
 [90m     |[39m                                                                             [31m[1m^[22m[39m
 [90m 126 |[39m         [33m:[39m parseFloat(product[33m.[39mregularPrice)[33m;[39m
 [90m 127 |[39m       
 [90m 128 |[39m       [36mconst[39m updatedItem [33m=[39m [36mawait[39m prisma[33m.[39mcartItem[33m.[39mupdate({[0m
    at constructor (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:367:19)
    at Parser.raise (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6624:19)
    at Parser.unexpected (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6644:16)
    at Parser.expect (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:6924:12)
    at Parser.parseObjectLike (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11894:14)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11403:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseExprListItem (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12249:18)
    at Parser.parseCallExpressionArguments (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11316:22)
    at Parser.parseCoverCallAndAsyncArrowHead (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11250:29)
    at Parser.parseSubscript (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11184:19)
    at Parser.parseSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11158:19)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11149:17)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseAwait (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12352:28)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11079:25)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseMaybeAssignAllowInOrVoidPattern (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12567:17)
    at Parser.parseParenAndDistinguishExpression (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11747:28)
    at Parser.parseExprAtom (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11395:23)
    at Parser.parseExprSubscripts (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11145:23)
    at Parser.parseUpdate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11130:21)
    at Parser.parseMaybeUnary (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:11110:23)
    at Parser.parseMaybeUnaryOrPrivate (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10963:61)
    at Parser.parseExprOps (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10968:23)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10945:23)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
    at e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:39
    at Parser.allowInAnd (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:12500:12)
    at Parser.parseMaybeAssignAllowIn (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10864:17)
    at Parser.parseConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10955:30)
    at Parser.parseMaybeConditional (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10949:17)
    at Parser.parseMaybeAssign (e:\Drive D Backup\Smart Technologies Bangladesh B2C Website Redevelopment\backend\node_modules\@babel\parser\lib\index.js:10895:21)
Jest: Coverage data for ./routes/cart.js was not found.
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        7.216 s
Ran all test suites matching api-reviews-performance.test.js.


BANGLADESH-SPECIFIC INSIGHTS:
==============================
Cultural Context:
  - Tests include Bangladesh cultural context and language support
  - Coverage areas: Bengali language, Regional preferences, Festival patterns

Market Specific:
  - Tests cover Bangladesh market-specific scenarios
  - Coverage areas: Price sensitivity, Brand loyalty, Regional variations

Performance:
  - Performance tests handle Bangladesh-specific load patterns
  - Coverage areas: High traffic periods, Festival season load

RECOMMENDATIONS:
================
1. [HIGH] Improve test success rate by fixing failing tests
2. [HIGH] Address environment and dependency issues
3. [MEDIUM] Review and address warning conditions
4. [LOW] Consider adding more comprehensive test coverage
5. [LOW] Enhance Bangladesh-specific test scenarios

Report generated by: Smart Technologies Bangladesh Review Test Runner
Generated on: 2025-12-16T19:10:24.502Z
================================================================================