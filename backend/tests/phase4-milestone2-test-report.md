# Phase 4 Milestone 2 Integration Test Report

**Generated:** 2026-01-27T05:36:34.270Z
**Environment:** development

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 350 |
| Passed | 40 |
| Failed | 8 |
| Skipped | 0 |
| Pass Rate | 11.43% |
| Total Execution Time | 120.58m |

## Test Suites

### ✗ Bulk Operations Tests

- **Status:** failed
- **Execution Time:** 2.74s
- **Total Tests:** 70
- **Passed:** 14
- **Failed:** 1
- **Pass Rate:** 20.00%

### ✗ Backward Compatibility Tests

- **Status:** failed
- **Execution Time:** 2.67s
- **Total Tests:** 70
- **Passed:** 16
- **Failed:** 1
- **Pass Rate:** 22.86%

### ✗ Integration Tests

- **Status:** failed
- **Execution Time:** 10.22s
- **Total Tests:** 70
- **Passed:** 2
- **Failed:** 3
- **Pass Rate:** 2.86%

### ✗ Performance Tests

- **Status:** failed
- **Execution Time:** 3.94s
- **Total Tests:** 70
- **Passed:** 2
- **Failed:** 2
- **Pass Rate:** 2.86%

### ✗ Security Tests

- **Status:** failed
- **Execution Time:** 2.05s
- **Total Tests:** 70
- **Passed:** 6
- **Failed:** 1
- **Pass Rate:** 8.57%

## Failed Tests

### 1. Bulk Operations Tests should batch create products successfully

- **Suite:** Bulk Operations Tests
- **Error:** Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at console.value (node:internal/console/constructor:303:16)
    at console.log (node:internal/console/constructor:378:26)
    at console._log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:251:11)
    at console.log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:311:10)
    at log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\config.js:8:11)
    at Object.loadEnvironmentConfig (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\config.js:63:65)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at Runtime.requireModuleOrMock (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:964:21)
    at Object.require (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:5:27)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at Runtime.requireModuleOrMock (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:964:21)
    at Object.require (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\config\elasticsearch.js:9:27)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at Runtime.requireModuleOrMock (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:964:21)
    at Object.require (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\tests\phase4-milestone2-integration.test.js:19:33)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at jestAdapter (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-circus\build\runner.js:95:13)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at runTestInternal (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runner\build\index.js:275:16)
    at runTest (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runner\build\index.js:343:7); Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at Console.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\transports\console.js:87:23)
    at Console._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston-transport\modern.js:103:17)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at Console.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.ondata (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:629:20)
    at DerivedLogger.emit (node:events:524:28)
    at addChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:279:12)
    at readableAddChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:262:11)
    at DerivedLogger.Readable.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:228:10)
    at DerivedLogger.Transform.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:132:32)
    at DerivedLogger._transform (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:337:12)
    at DerivedLogger.Transform._read (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:166:10)
    at DerivedLogger.Transform._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:155:83)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at DerivedLogger.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:276:14)
    at DerivedLogger.<computed> [as info] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\create-logger.js:95:19)
    at LoggerService.info (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:512:21)
    at LoggerService.apply [as measureLogPerformance] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:141:32)
    at LoggerService.measureLogPerformance [as info] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:508:10)
    at ElasticsearchConfig.info [as checkHealth] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\config\elasticsearch.js:111:21)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
- **Stack Trace:**
``
[object Object],[object Object]
``

### 2. Backward Compatibility Tests should get all products (existing endpoint)

- **Suite:** Backward Compatibility Tests
- **Error:** Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at console.value (node:internal/console/constructor:303:16)
    at console.log (node:internal/console/constructor:378:26)
    at console._log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:251:11)
    at console.log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:311:10)
    at log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\config.js:8:11)
    at Object.loadEnvironmentConfig (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\config.js:63:65)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at Runtime.requireModuleOrMock (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:964:21)
    at Object.require (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:5:27)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at Runtime.requireModuleOrMock (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:964:21)
    at Object.require (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\config\elasticsearch.js:9:27)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at Runtime.requireModuleOrMock (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:964:21)
    at Object.require (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\tests\phase4-milestone2-integration.test.js:19:33)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at jestAdapter (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-circus\build\runner.js:95:13)
    at runTestInternal (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runner\build\index.js:275:16)
    at runTest (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runner\build\index.js:343:7); Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at Console.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\transports\console.js:87:23)
    at Console._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston-transport\modern.js:103:17)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at Console.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.ondata (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:629:20)
    at DerivedLogger.emit (node:events:524:28)
    at addChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:279:12)
    at readableAddChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:262:11)
    at DerivedLogger.Readable.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:228:10)
    at DerivedLogger.Transform.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:132:32)
    at DerivedLogger._transform (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:337:12)
    at DerivedLogger.Transform._read (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:166:10)
    at DerivedLogger.Transform._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:155:83)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at DerivedLogger.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:276:14)
    at DerivedLogger.<computed> [as info] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\create-logger.js:95:19)
    at LoggerService.info (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:512:21)
    at LoggerService.apply [as measureLogPerformance] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:141:32)
    at LoggerService.measureLogPerformance [as info] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:508:10)
    at ElasticsearchConfig.info [as checkHealth] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\config\elasticsearch.js:111:21)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
- **Stack Trace:**
``
[object Object],[object Object]
``

### 3. Integration Tests should trigger Elasticsearch indexing on product creation

- **Suite:** Integration Tests
- **Error:** Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at console.value (node:internal/console/constructor:303:16)
    at console.log (node:internal/console/constructor:378:26)
    at console._log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:251:11)
    at console.log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:311:10)
    at log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\config.js:8:11)
    at Object.loadEnvironmentConfig (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\config.js:63:65)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at Runtime.requireModuleOrMock (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:964:21)
    at Object.require (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:5:27)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at Runtime.requireModuleOrMock (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:964:21)
    at Object.require (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\config\elasticsearch.js:9:27)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at Runtime.requireModuleOrMock (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:964:21)
    at Object.require (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\tests\phase4-milestone2-integration.test.js:19:33)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at jestAdapter (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-circus\build\runner.js:95:13)
    at runTestInternal (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runner\build\index.js:275:16)
    at runTest (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runner\build\index.js:343:7); Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at Console.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\transports\console.js:87:23)
    at Console._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston-transport\modern.js:103:17)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at Console.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.ondata (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:629:20)
    at DerivedLogger.emit (node:events:524:28)
    at addChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:279:12)
    at readableAddChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:262:11)
    at DerivedLogger.Readable.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:228:10)
    at DerivedLogger.Transform.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:132:32)
    at DerivedLogger._transform (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:337:12)
    at DerivedLogger.Transform._read (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:166:10)
    at DerivedLogger.Transform._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:155:83)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at DerivedLogger.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:276:14)
    at DerivedLogger.<computed> [as info] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\create-logger.js:95:19)
    at LoggerService.info (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:512:21)
    at LoggerService.apply [as measureLogPerformance] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:141:32)
    at LoggerService.measureLogPerformance [as info] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:508:10)
    at ElasticsearchConfig.info [as checkHealth] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\config\elasticsearch.js:111:21)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
- **Stack Trace:**
``
[object Object],[object Object]
``

### 4. Integration Tests should trigger Elasticsearch reindexing on product update

- **Suite:** Integration Tests
- **Error:** Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at Console.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\transports\console.js:87:23)
    at Console._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston-transport\modern.js:103:17)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at Console.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.ondata (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:629:20)
    at DerivedLogger.emit (node:events:524:28)
    at addChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:279:12)
    at readableAddChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:262:11)
    at DerivedLogger.Readable.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:228:10)
    at DerivedLogger.Transform.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:132:32)
    at DerivedLogger._transform (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:337:12)
    at DerivedLogger.Transform._read (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:166:10)
    at DerivedLogger.Transform._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:155:83)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at DerivedLogger.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:276:14)
    at DerivedLogger.<computed> [as error] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\create-logger.js:95:19)
    at LoggerService.error (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:532:21)
    at LoggerService.apply [as measureLogPerformance] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:141:32)
    at LoggerService.measureLogPerformance [as error] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:528:10)
    at ProductIndexingService.error [as indexProduct] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\elasticsearch\productIndexingService.js:189:21)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at Object.<anonymous> (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\tests\phase4-milestone2-integration.test.js:1727:7); Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at Console.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\transports\console.js:87:23)
    at Console._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston-transport\modern.js:103:17)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at Console.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.ondata (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:629:20)
    at DerivedLogger.emit (node:events:524:28)
    at addChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:279:12)
    at readableAddChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:262:11)
    at DerivedLogger.Readable.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:228:10)
    at DerivedLogger.Transform.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:132:32)
    at DerivedLogger._transform (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:337:12)
    at DerivedLogger.Transform._read (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:166:10)
    at DerivedLogger.Transform._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:155:83)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at DerivedLogger.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:276:14)
    at DerivedLogger.<computed> [as error] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\create-logger.js:95:19)
    at LoggerService.error (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:532:21)
    at LoggerService.apply [as measureLogPerformance] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:141:32)
    at LoggerService.measureLogPerformance [as error] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:528:10)
    at ProductIndexingService.error [as updateProduct] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\elasticsearch\productIndexingService.js:504:21)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at Object.<anonymous> (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\tests\phase4-milestone2-integration.test.js:1736:7)
- **Stack Trace:**
``
[object Object],[object Object]
``

### 5. Integration Tests should remove from Elasticsearch on product deletion

- **Suite:** Integration Tests
- **Error:** Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at Console.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\transports\console.js:87:23)
    at Console._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston-transport\modern.js:103:17)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at Console.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.ondata (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:629:20)
    at DerivedLogger.emit (node:events:524:28)
    at addChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:279:12)
    at readableAddChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:262:11)
    at DerivedLogger.Readable.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:228:10)
    at DerivedLogger.Transform.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:132:32)
    at DerivedLogger._transform (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:337:12)
    at DerivedLogger.Transform._read (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:166:10)
    at DerivedLogger.Transform._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:155:83)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at DerivedLogger.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:276:14)
    at DerivedLogger.<computed> [as error] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\create-logger.js:95:19)
    at LoggerService.error (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:532:21)
    at LoggerService.apply [as measureLogPerformance] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:141:32)
    at LoggerService.measureLogPerformance [as error] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:528:10)
    at ProductIndexingService.error [as indexProduct] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\elasticsearch\productIndexingService.js:189:21)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at Object.<anonymous> (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\tests\phase4-milestone2-integration.test.js:1765:7); Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at Console.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\transports\console.js:87:23)
    at Console._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston-transport\modern.js:103:17)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at Console.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.ondata (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:629:20)
    at DerivedLogger.emit (node:events:524:28)
    at addChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:279:12)
    at readableAddChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:262:11)
    at DerivedLogger.Readable.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:228:10)
    at DerivedLogger.Transform.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:132:32)
    at DerivedLogger._transform (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:337:12)
    at DerivedLogger.Transform._read (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:166:10)
    at DerivedLogger.Transform._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:155:83)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at DerivedLogger.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:276:14)
    at DerivedLogger.<computed> [as warn] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\create-logger.js:95:19)
    at LoggerService.warn (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:522:21)
    at LoggerService.apply [as measureLogPerformance] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:141:32)
    at LoggerService.measureLogPerformance [as warn] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:518:10)
    at ProductIndexingService.warn [as deleteProduct] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\elasticsearch\productIndexingService.js:423:23)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at Object.<anonymous> (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\tests\phase4-milestone2-integration.test.js:1773:7)
- **Stack Trace:**
``
[object Object],[object Object]
``

### 6. Performance Tests bulk create performance (100 items < 10s)

- **Suite:** Performance Tests
- **Error:** Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at console.value (node:internal/console/constructor:303:16)
    at console.log (node:internal/console/constructor:378:26)
    at console._log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:251:11)
    at console.log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:311:10)
    at Object.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\tests\phase4-milestone2-integration.test.js:1884:13); Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at console.value (node:internal/console/constructor:303:16)
    at console.log (node:internal/console/constructor:378:26)
    at console._log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:251:11)
    at console.log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:311:10)
    at Object.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\tests\phase4-milestone2-integration.test.js:1904:13)
- **Stack Trace:**
``
[object Object],[object Object]
``

### 7. Performance Tests bulk update performance (100 items < 10s)

- **Suite:** Performance Tests
- **Error:** Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at console.value (node:internal/console/constructor:303:16)
    at console.log (node:internal/console/constructor:378:26)
    at console._log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:251:11)
    at console.log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:311:10)
    at Object.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\tests\phase4-milestone2-integration.test.js:1940:13)
- **Stack Trace:**
``
[object Object]
``

### 8. Security Tests should prevent SQL injection in product queries

- **Suite:** Security Tests
- **Error:** Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at console.value (node:internal/console/constructor:303:16)
    at console.log (node:internal/console/constructor:378:26)
    at console._log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:251:11)
    at console.log (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\console\build\index.js:311:10)
    at log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\config.js:8:11)
    at Object.loadEnvironmentConfig (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\config.js:63:65)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at Runtime.requireModuleOrMock (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:964:21)
    at Object.require (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:5:27)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at Runtime.requireModuleOrMock (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:964:21)
    at Object.require (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\config\elasticsearch.js:9:27)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at Runtime.requireModuleOrMock (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:964:21)
    at Object.require (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\tests\phase4-milestone2-integration.test.js:19:33)
    at Runtime._execModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:1268:24)
    at Runtime._loadModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:944:12)
    at Runtime.requireModule (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runtime\build\index.js:832:12)
    at jestAdapter (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-circus\build\runner.js:95:13)
    at runTestInternal (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runner\build\index.js:275:16)
    at runTest (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\jest-runner\build\index.js:343:7); Error: EPIPE: broken pipe, write
    at Socket._write (node:internal/net:61:18)
    at writeOrBuffer (node:internal/streams/writable:572:12)
    at _write (node:internal/streams/writable:501:10)
    at Socket.Writable.write (node:internal/streams/writable:510:10)
    at Socket.stream.write (e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\@jest\reporters\build\index.js:1626:7)
    at Console.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\transports\console.js:87:23)
    at Console._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston-transport\modern.js:103:17)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at Console.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.ondata (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:629:20)
    at DerivedLogger.emit (node:events:524:28)
    at addChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:279:12)
    at readableAddChunk (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:262:11)
    at DerivedLogger.Readable.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_readable.js:228:10)
    at DerivedLogger.Transform.push (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:132:32)
    at DerivedLogger._transform (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:337:12)
    at DerivedLogger.Transform._read (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:166:10)
    at DerivedLogger.Transform._write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_transform.js:155:83)
    at doWrite (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:390:139)
    at writeOrBuffer (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:381:5)
    at DerivedLogger.Writable.write (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\readable-stream\lib\_stream_writable.js:302:11)
    at DerivedLogger.log (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\logger.js:276:14)
    at DerivedLogger.<computed> [as info] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\node_modules\winston\lib\winston\create-logger.js:95:19)
    at LoggerService.info (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:512:21)
    at LoggerService.apply [as measureLogPerformance] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:141:32)
    at LoggerService.measureLogPerformance [as info] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\services\logger.js:508:10)
    at ElasticsearchConfig.info [as checkHealth] (E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\backend\config\elasticsearch.js:111:21)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
- **Stack Trace:**
``
[object Object],[object Object]
``

## Performance Metrics

| Metric | Value |
|--------|-------|
| Search Response Time (P95) | N/A |
| Bulk Create Performance | N/A |
| Bulk Update Performance | N/A |
| Bulk Delete Performance | N/A |
| Elasticsearch Indexing Performance | N/A |

## Backward Compatibility

- **Status:** FAIL
- **Regressions Found:** 1

## Recommendations

Based on the test results, the following actions are recommended:

1. **Address Backward Compatibility Issues:** 1 regressions were found. Review and fix the affected endpoints.

2. **Optimize Performance:** Some performance tests failed. Review the slow operations and optimize them.

3. **Security Hardening:** Security tests failed. Review authentication and authorization mechanisms.

4. **Review Failed Tests:** Each failed test above should be reviewed and fixed.

