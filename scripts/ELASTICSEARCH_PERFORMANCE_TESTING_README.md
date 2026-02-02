# Elasticsearch Performance Testing Guide

This guide explains how to run performance and load tests for Elasticsearch to verify that queries complete within the 300ms performance target.

## Overview

The performance testing suite consists of two main scripts:

1. **Performance Testing Script** (`test-elasticsearch-performance.js`) - Tests various query types and measures response times
2. **Load Testing Script** (`test-elasticsearch-load.js`) - Simulates concurrent users and tests under increasing load

## Prerequisites

Before running the tests, ensure:

- Elasticsearch is running and accessible
- The backend services are properly configured
- Test data exists in Elasticsearch indices (products, categories, brands)
- Node.js is installed (v14 or higher recommended)

## Performance Testing Script

### Purpose

Tests various query types (search, aggregations, filters) and measures response times to validate that queries complete within the 300ms target.

### Usage

```bash
# Basic usage with default settings (50 iterations)
node scripts/test-elasticsearch-performance.js

# Run with custom number of iterations
node scripts/test-elasticsearch-performance.js --iterations 100

# Run with warmup phase
node scripts/test-elasticsearch-performance.js --warmup

# Generate JSON report instead of text
node scripts/test-elasticsearch-performance.js --report json

# Combined options
node scripts/test-elasticsearch-performance.js --iterations 100 --warmup --report json

# Show help
node scripts/test-elasticsearch-performance.js --help
```

### Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--iterations <number>` | `-i` | Number of iterations per test | 50 |
| `--warmup` | `-w` | Run warmup tests before actual tests | false |
| `--report <format>` | `-r` | Report format: `text` or `json` | text |
| `--help` | `-h` | Show help message | - |

### Test Types

The performance test runs the following tests:

1. **Basic Search** - Simple product search queries
   - Target: 300ms P95 response time

2. **Search with Filters** - Product search with price, category, and stock filters
   - Target: 300ms P95 response time

3. **Aggregations** - Product facets and aggregations
   - Target: 200ms P95 response time

4. **Get Product by ID** - Retrieve a single product by ID
   - Target: 50ms P95 response time

5. **Category Search** - Search for categories
   - Target: 300ms P95 response time

6. **Brand Search** - Search for brands
   - Target: 300ms P95 response time

7. **Large Result Set** - Search returning 100 results
   - Target: 300ms P95 response time

### Output

The script generates a performance report with:

- **Summary**: Total tests, passed/failed counts, success rate
- **Performance Targets**: Configured targets for each test type
- **Test Results**: Detailed statistics for each test including:
  - Number of iterations
  - Min, Max, Average response times
  - P50, P95, P99 percentiles
  - Pass/fail status against target
  - Any errors encountered
- **Overall Assessment**: Pass/fail summary and recommendations

### Report Location

Reports are saved to the `test-reports/` directory with filenames like:
- `elasticsearch-performance-2026-01-31T18-30-00.txt` (text format)
- `elasticsearch-performance-2026-01-31T18-30-00.json` (JSON format)

### Example Output

```
============================================================
ELASTICSEARCH PERFORMANCE TEST REPORT
============================================================

SUMMARY
------------------------------------------------------------
Start Time:     2026-01-31T18:30:00.000Z
End Time:       2026-01-31T18:35:00.000Z
Duration:       300000ms
Total Tests:    7
Passed:         7
Failed:         0
Success Rate:   100.00%

PERFORMANCE TARGETS
------------------------------------------------------------
Search Response Time:     300ms
Filter Response Time:     100ms
Aggregation Response Time: 200ms
Get By ID Response Time:  50ms

TEST RESULTS
------------------------------------------------------------

BASIC SEARCH
  Iterations:  50
  Min:         45ms
  Max:         180ms
  Average:     85.32ms
  P50:         82ms
  P95:         145ms
  P99:         168ms
  Target:      300ms
  Status:      ✓ PASSED

[... additional test results ...]

============================================================
OVERALL ASSESSMENT
============================================================
✓ ALL TESTS PASSED - Performance targets met!
============================================================
```

## Load Testing Script

### Purpose

Simulates concurrent users/requests and tests under increasing load to measure throughput and latency, identify performance bottlenecks, and validate the system can handle expected traffic.

### Usage

```bash
# Basic usage with default settings (10, 50, 100, 200 concurrent users)
node scripts/test-elasticsearch-load.js

# Run with custom concurrent levels
node scripts/test-elasticsearch-load.js --concurrent 20,50,100

# Run with custom duration per level
node scripts/test-elasticsearch-load.js --duration 60

# Generate JSON report
node scripts/test-elasticsearch-load.js --report json

# Combined options
node scripts/test-elasticsearch-load.js --concurrent 25,50,75,100 --duration 45 --report json

# Show help
node scripts/test-elasticsearch-load.js --help
```

### Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--concurrent <levels>` | `-c` | Comma-separated list of concurrent user levels | 10,50,100,200 |
| `--duration <seconds>` | `-d` | Duration per test level in seconds | 30 |
| `--report <format>` | `-r` | Report format: `text` or `json` | text |
| `--help` | `-h` | Show help message | - |

### Load Test Behavior

For each concurrent user level, the script:

1. **Ramps up users** over 5 seconds to simulate gradual load increase
2. **Simulates users** making various types of requests:
   - Basic product searches
   - Searches with filters
   - Aggregation queries
   - Category searches
   - Brand searches
3. **Collects metrics** including:
   - Total requests
   - Error count and rate
   - Throughput (requests per second)
   - Response time percentiles (P50, P95, P99)
4. **Validates against targets**:
   - Max P95 response time: 300ms
   - Max error rate: 1%
   - Min throughput: 100 req/s

### Output

The load test generates a comprehensive report with:

- **Summary**: Total requests, errors, passed/failed levels
- **Performance Targets**: Configured targets for load testing
- **Test Results by Level**: Detailed metrics for each concurrent level
- **Performance Bottlenecks**: Identified issues with recommendations
- **Overall Assessment**: Pass/fail summary and capacity estimation

### Report Location

Reports are saved to the `test-reports/` directory with filenames like:
- `elasticsearch-load-2026-01-31T18-30-00.txt` (text format)
- `elasticsearch-load-2026-01-31T18-30-00.json` (JSON format)

### Example Output

```
============================================================
ELASTICSEARCH LOAD TEST REPORT
============================================================

SUMMARY
------------------------------------------------------------
Start Time:        2026-01-31T18:30:00.000Z
End Time:          2026-01-31T18:32:30.000Z
Total Duration:    150.00s
Test Levels:       4
Total Requests:    1500
Total Errors:      5
Passed Levels:     3
Failed Levels:     1

PERFORMANCE TARGETS
------------------------------------------------------------
Max P95 Response Time: 300ms
Max Error Rate:       1%
Min Throughput:       100 req/s

TEST RESULTS BY LEVEL
------------------------------------------------------------

10 Concurrent Users
  Duration:           30.5s
  Total Requests:     150
  Errors:             0
  Error Rate:         0.00%
  Throughput:         4.92 req/s
  Min Duration:       42ms
  Max Duration:       156ms
  Avg Duration:       85.45ms
  P50 Duration:       82ms
  P95 Duration:       138ms
  P99 Duration:       152ms
  Status:             ✓ PASSED

[... additional level results ...]

============================================================
PERFORMANCE BOTTLENECKS
============================================================

[WARNING] 200 Concurrent Users
  Type:           high_latency
  Issue:          P95 latency (385ms) exceeds target at 200 concurrent users
  Recommendation: Consider optimizing queries, adding more Elasticsearch nodes, or increasing hardware resources

============================================================
OVERALL ASSESSMENT
============================================================
✗ 1 LOAD LEVEL(S) FAILED
  System can handle up to 100 concurrent users.
  See bottlenecks section for recommendations.

Estimated Capacity: 100 concurrent users
============================================================
```

## Interpreting Results

### Performance Test Results

- **P95 Response Time**: 95% of queries complete within this time. This is the primary metric for the 300ms target.
- **P99 Response Time**: 99% of queries complete within this time. Indicates worst-case performance.
- **Average Response Time**: Mean response time across all iterations.
- **Min/Max**: Minimum and maximum response times observed.

### Load Test Results

- **Throughput**: Number of requests processed per second. Higher is better.
- **Error Rate**: Percentage of failed requests. Should be below 1%.
- **P95 Response Time**: 95% of requests complete within this time at the given concurrency level.
- **Capacity Estimation**: Maximum number of concurrent users the system can handle while meeting targets.

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Ensure Elasticsearch is running: `docker ps | grep elasticsearch`
   - Check connection settings in `.env` file
   - Verify network connectivity

2. **No Test Data**
   - Run the setup script first: `node scripts/test-elasticsearch-setup.js`
   - Or use the API test script: `node scripts/test-elasticsearch-api.js`

3. **Slow Performance**
   - Check Elasticsearch cluster health: Use the admin panel or API
   - Review index settings and mappings
   - Consider adding more hardware resources
   - Check for long-running queries in the logs

4. **High Error Rates**
   - Review Elasticsearch logs for errors
   - Check memory and CPU usage
   - Verify index health status
   - Check connection pool settings

## Best Practices

1. **Run tests regularly** as part of CI/CD pipeline
2. **Run warmup tests** before actual tests to warm up caches
3. **Test with realistic data** that matches production
4. **Monitor system resources** during load tests (CPU, memory, disk I/O)
5. **Compare results over time** to track performance trends
6. **Investigate performance regressions** immediately
7. **Document test results** for future reference

## Performance Targets Summary

| Metric | Target | Description |
|--------|--------|-------------|
| Search P95 Response Time | 300ms | 95% of search queries should complete within 300ms |
| Filter Response Time | 100ms | Filter queries should be faster than full-text search |
| Aggregation Response Time | 200ms | Aggregation queries have a 200ms target |
| Get By ID Response Time | 50ms | Direct lookups should be very fast |
| Max Error Rate | 1% | Error rate should not exceed 1% |
| Min Throughput | 100 req/s | System should handle at least 100 requests per second |

## Additional Resources

- Elasticsearch Client Service: [`backend/services/elasticsearch/client.js`](../backend/services/elasticsearch/client.js)
- Search Service: [`backend/services/elasticsearch/searchService.js`](../backend/services/elasticsearch/searchService.js)
- Performance Monitor: [`backend/services/elasticsearch/performanceMonitor.js`](../backend/services/elasticsearch/performanceMonitor.js)
- Admin Elasticsearch Panel: [`frontend/src/app/admin/elasticsearch/page.tsx`](../frontend/src/app/admin/elasticsearch/page.tsx)

## Support

For issues or questions about performance testing:

1. Check the test report files in `test-reports/` for detailed error messages
2. Review Elasticsearch logs for any errors during tests
3. Consult the Elasticsearch documentation for optimization tips
4. Contact the development team for assistance
