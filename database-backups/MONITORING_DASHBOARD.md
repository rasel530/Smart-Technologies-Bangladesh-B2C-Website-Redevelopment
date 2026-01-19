# Database Monitoring Dashboard Guide

## Overview

This guide explains how to set up and use the database monitoring system for Smart Tech B2C E-commerce application.

**Database**: smart_ecommerce_dev
**Container**: smarttech_postgres
**User**: smart_dev

---

## Table of Contents

1. [Health Check System](#health-check-system)
2. [Monitoring Metrics](#monitoring-metrics)
3. [Dashboard Setup](#dashboard-setup)
4. [Alert Configuration](#alert-configuration)
5. [Log Analysis](#log-analysis)
6. [Performance Monitoring](#performance-monitoring)

---

## Health Check System

### Running Health Checks

**Script**: `health-check.bat`
**Recommended Schedule**: Every 15 minutes

**Execution**:
```bash
cd database-backups
health-check.bat
```

### Health Check Components

The health check script monitors the following components:

#### 1. Docker Container Status
- **What it checks**: Whether the PostgreSQL container is running
- **Expected result**: `running`
- **Health status**: `healthy` or `unhealthy`
- **Impact**: Critical - if container is down, all checks fail

#### 2. Database Connection
- **What it checks**: Whether the database is accepting connections
- **Expected result**: `ready`
- **Health status**: `ready` or `not_ready`
- **Impact**: Critical - if database is not ready, application cannot function

#### 3. Table Count
- **What it checks**: Number of tables in the database
- **Expected result**: 40 tables
- **Health status**: Pass if count matches
- **Impact**: High - missing tables indicate schema issues

#### 4. Database Size
- **What it checks**: Current size of the database
- **Expected result**: Growing slowly over time
- **Health status**: Pass if size is reasonable
- **Impact**: Medium - abnormal growth indicates issues

#### 5. Active Connections
- **What it checks**: Number of active database connections
- **Expected result**: < 100 connections
- **Health status**: Pass if count is normal
- **Impact**: Medium - high connections indicate performance issues

#### 6. Long-Running Queries
- **What it checks**: Queries running longer than 5 minutes
- **Expected result**: 0 queries
- **Health status**: Pass if no long queries
- **Impact**: Medium - long queries slow down the system

#### 7. Database Locks
- **What it checks**: Number of waiting locks
- **Expected result**: < 10 locks
- **Health status**: Pass if count is normal
- **Impact**: High - many locks indicate blocking issues

#### 8. Critical Tables Data
- **What it checks**: Row counts in critical tables
- **Expected result**: Non-zero for production tables
- **Health status**: Pass if tables have data
- **Impact**: High - empty critical tables indicate data loss

#### 9. Migration Status
- **What it checks**: Number of applied migrations
- **Expected result**: Consistent with schema
- **Health status**: Pass if migrations are applied
- **Impact**: High - missing migrations indicate schema drift

#### 10. Replication Status
- **What it checks**: Whether database is in recovery mode
- **Expected result**: `false` (normal mode)
- **Health status**: Pass if not in recovery
- **Impact**: Critical - recovery mode indicates issues

#### 11. Disk Usage
- **What it checks**: Available disk space on database volume
- **Expected result**: < 80% used
- **Health status**: Pass if usage is acceptable
- **Impact**: Critical - disk full prevents operations

---

## Monitoring Metrics

### Key Performance Indicators (KPIs)

#### Database Health Score

**Calculation**:
- Start with 100 points
- Subtract 10 points for each critical failure
- Subtract 5 points for each warning
- Subtract 2 points for each minor issue

**Score Interpretation**:
- **90-100**: Excellent - System is healthy
- **75-89**: Good - Minor issues present
- **60-74**: Fair - Several issues need attention
- **40-59**: Poor - Many issues require immediate action
- **0-39**: Critical - System is unstable

#### Backup Success Rate

**Calculation**:
- Successful backups / Total backup attempts × 100

**Target**: 99%+
**Alert Threshold**: < 95% for 3 consecutive days

#### Database Performance Metrics

**Query Performance**:
- Average query time: < 100ms (good), 100-500ms (fair), > 500ms (poor)
- Long-running queries: 0 (good), 1-5 (fair), > 5 (poor)
- Query throughput: > 100 queries/sec (good), 50-100 (fair), < 50 (poor)

**Connection Metrics**:
- Active connections: < 50 (good), 50-100 (fair), > 100 (poor)
- Connection pool usage: < 70% (good), 70-90% (fair), > 90% (poor)
- Failed connections: 0 (good), < 1% (fair), > 5% (poor)

**Storage Metrics**:
- Database size growth: < 10% per month (good), 10-20% (fair), > 20% (poor)
- Disk usage: < 60% (good), 60-80% (fair), > 80% (poor)
- Table bloat: < 5% (good), 5-10% (fair), > 10% (poor)

---

## Dashboard Setup

### Option 1: Simple Web Dashboard

Create a simple HTML dashboard to display health status:

**File**: `database-backups/dashboard.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Database Health Dashboard</title>
    <meta http-equiv="refresh" content="900">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .status { margin: 20px 0; padding: 20px; border-radius: 5px; }
        .healthy { background: #4CAF50; }
        .unhealthy { background: #f44336; }
        .warning { background: #ff9800; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .metric { padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric-value { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .metric-label { color: #666; }
        .logs { margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 5px; }
        .log-entry { padding: 10px; border-bottom: 1px solid #eee; }
        .timestamp { color: #999; font-size: 12px; }
        .error { color: #d32f2f; }
        .warning { color: #f57c00; }
        .success { color: #4CAF50; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Database Health Dashboard</h1>
            <p>Last Updated: <span id="lastUpdate">Loading...</span></p>
        </div>
        
        <div id="healthStatus" class="status">
            <h2>Loading...</h2>
        </div>
        
        <div class="metrics">
            <div class="metric">
                <h3>Container Status</h3>
                <div id="containerStatus" class="metric-value">Loading...</div>
            </div>
            
            <div class="metric">
                <h3>Database Status</h3>
                <div id="dbStatus" class="metric-value">Loading...</div>
            </div>
            
            <div class="metric">
                <h3>Table Count</h3>
                <div id="tableCount" class="metric-value">Loading...</div>
                <div class="metric-label">Expected: 40</div>
            </div>
            
            <div class="metric">
                <h3>Database Size</h3>
                <div id="dbSize" class="metric-value">Loading...</div>
            </div>
            
            <div class="metric">
                <h3>Active Connections</h3>
                <div id="activeConnections" class="metric-value">Loading...</div>
            </div>
            
            <div class="metric">
                <h3>Disk Usage</h3>
                <div id="diskUsage" class="metric-value">Loading...</div>
            </div>
        </div>
        
        <div class="logs">
            <h2>Recent Logs</h2>
            <div id="recentLogs">
                <div class="log-entry">Loading logs...</div>
            </div>
        </div>
    </div>
    
    <script>
        // Load health status from JSON file
        async function loadHealthStatus() {
            try {
                const response = await fetch('database-backups/logs/health-status.json');
                const data = await response.json();
                
                // Update timestamp
                document.getElementById('lastUpdate').textContent = data.timestamp;
                
                // Update health status
                const healthDiv = document.getElementById('healthStatus');
                if (data.health_status === 'healthy') {
                    healthDiv.className = 'status healthy';
                    healthDiv.innerHTML = '<h2>✓ System Healthy</h2>';
                } else {
                    healthDiv.className = 'status unhealthy';
                    healthDiv.innerHTML = '<h2>✗ System Unhealthy</h2><p>Issues found: ' + data.issues_found + '</p>';
                }
                
                // Update metrics
                document.getElementById('containerStatus').textContent = data.container_status;
                document.getElementById('dbStatus').textContent = data.database_status;
                document.getElementById('tableCount').textContent = data.table_count + ' / ' + data.expected_tables;
                document.getElementById('dbSize').textContent = data.database_size;
                document.getElementById('activeConnections').textContent = data.active_connections;
                document.getElementById('diskUsage').textContent = data.disk_used;
                
                // Color code table count
                const tableCountDiv = document.getElementById('tableCount');
                if (data.table_count === data.expected_tables) {
                    tableCountDiv.style.color = '#4CAF50';
                } else {
                    tableCountDiv.style.color = '#f44336';
                }
                
            } catch (error) {
                console.error('Failed to load health status:', error);
                document.getElementById('healthStatus').innerHTML = '<h2>✗ Error Loading Status</h2>';
            }
        }
        
        // Load on page load and refresh every 60 seconds
        loadHealthStatus();
        setInterval(loadHealthStatus, 60000);
    </script>
</body>
</html>
```

### Option 2: PowerShell Dashboard

Create a PowerShell script to display health status in console:

**File**: `database-backups/show-health.ps1`

```powershell
# Database Health Monitor
# Run this script to display current database health

$healthFile = "database-backups\logs\health-status.json"

if (Test-Path $healthFile) {
    $healthData = Get-Content $healthFile | ConvertFrom-Json
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "DATABASE HEALTH STATUS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Last Update: $($healthData.timestamp)" -ForegroundColor Yellow
    Write-Host "Health Status: $($healthData.health_status)" -ForegroundColor $(if ($healthData.health_status -eq 'healthy') { 'Green' } else { 'Red' })
    Write-Host "Issues Found: $($healthData.issues_found)" -ForegroundColor $(if ($healthData.issues_found -eq 0) { 'Green' } else { 'Yellow' })
    Write-Host ""
    
    Write-Host "DETAILED STATUS:" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    Write-Host "Container: $($healthData.container_status)" -ForegroundColor White
    Write-Host "Database: $($healthData.database_status)" -ForegroundColor White
    Write-Host "Tables: $($healthData.table_count) / $($healthData.expected_tables)" -ForegroundColor White
    Write-Host "Size: $($healthData.database_size)" -ForegroundColor White
    Write-Host "Connections: $($healthData.active_connections)" -ForegroundColor White
    Write-Host "Long Queries: $($healthData.long_queries)" -ForegroundColor White
    Write-Host "Locks: $($healthData.locks)" -ForegroundColor White
    Write-Host "Disk: $($healthData.disk_used) used, $($healthData.disk_available) available" -ForegroundColor White
    Write-Host "Migrations: $($healthData.migration_count)" -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    
    if ($healthData.issues_found -gt 0) {
        Write-Host ""
        Write-Host "ISSUES DETECTED:" -ForegroundColor Red
        $healthData.issues | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "ERROR: Health status file not found!" -ForegroundColor Red
    Write-Host "Run health-check.bat first to generate status." -ForegroundColor Yellow
}
```

### Option 3: Command Line Dashboard

Use the health check script directly:

```bash
# Run health check and view results
cd database-backups
health-check.bat

# View health status file
type database-backups\logs\health-status.json

# View recent logs
type database-backups\logs\health-check.log | more
```

---

## Alert Configuration

### Setting Up Email Alerts

#### Using PowerShell

```powershell
# Send email alert
$smtpServer = "smtp.gmail.com"
$smtpPort = 587
$smtpUser = "your-email@gmail.com"
$smtpPassword = "your-app-password"
$from = "database-monitor@yourdomain.com"
$to = "admin@yourdomain.com"

$subject = "Database Health Alert: Unhealthy System Detected"
$body = @"
Database health check has detected issues.

Health Status: Unhealthy
Issues Found: X

Please investigate immediately.

Timestamp: $(Get-Date)
"@

Send-MailMessage -SmtpServer $smtpServer -Port $smtpPort -From $from -To $to -Subject $subject -Body $body -Credential (New-Object System.Management.Automation.PSCredential -UserName $smtpUser -Password $smtpPassword)
```

### Alert Thresholds

Configure alerts for the following scenarios:

#### Critical Alerts (Immediate Notification Required)

- **Container Down**: Database container is not running
- **Database Unavailable**: Database is not accepting connections
- **Table Count Mismatch**: Expected 40 tables, found different count
- **Critical Tables Empty**: Users, products, or orders tables have zero rows
- **Disk Space Critical**: Disk usage > 90%

#### Warning Alerts (Investigate Within 24 Hours)

- **High Connection Count**: Active connections > 100
- **Long-Running Queries**: Queries running > 10 minutes
- **High Lock Count**: Waiting locks > 20
- **Disk Space Warning**: Disk usage > 80%
- **Backup Failure**: Last 3 backup attempts failed

#### Info Alerts (Monitor for Trends)

- **Database Growth**: Database size growing > 20% per month
- **Performance Degradation**: Average query time increasing
- **Migration Drift**: Applied migrations don't match schema

---

## Log Analysis

### Viewing Health Check Logs

```bash
# View recent health check results
type database-backups\logs\health-check.log | findstr /C:"HEALTH CHECK SUMMARY"

# View all health checks
type database-backups\logs\health-check.log | findstr /C:"CHECK [0-9]:"

# View issues only
type database-backups\logs\health-check.log | findstr /C:"FAIL:" /C:"WARN:" /C:"ERROR:"

# View last 10 health checks
powershell -Command "Get-Content 'database-backups\logs\health-check.log' | Select-Object -Last 50 | Select-String -Pattern 'HEALTH CHECK SUMMARY'"
```

### Analyzing Backup Logs

```bash
# View backup success rate
type database-backups\logs\backup-daily.log | findstr /C:"Backup created successfully" | find /c /v "" | find /c ".sql.gz"

# View backup failures
type database-backups\logs\backup-daily.log | findstr /C:"ERROR:" /C:"FAIL:"

# View backup sizes
type database-backups\logs\backup-daily.log | findstr /C:"Size:"

# Calculate average backup size
powershell -Command "
$content = Get-Content 'database-backups\logs\backup-daily.log'
$sizes = $content | Select-String -Pattern 'Size:' | ForEach-Object { 
    if ($_ -match '(\d+) MB') { [int]$matches[1] } 
}
if ($sizes.Count -gt 0) {
    $avg = ($sizes | Measure-Object -Average).Average
    Write-Host \"Average backup size: $([math]::Round($avg, 2)) MB\"
}
"
```

### Analyzing Restore Logs

```bash
# View restore operations
type database-backups\logs\emergency-restore.log | findstr /C:"Emergency Restore"

# View restore failures
type database-backups\logs\emergency-restore.log | findstr /C:"ERROR:" /C:"FAIL:"

# View successful restores
type database-backups\logs\emergency-restore.log | findstr /C:"Restore Completed Successfully"
```

---

## Performance Monitoring

### Database Performance Queries

#### Check Slow Queries

```sql
-- Find slow queries (longer than 1 second)
SELECT 
    pid,
    now() - query_start as duration,
    state,
    query,
    wait_event_type,
    wait_time
FROM pg_stat_activity 
WHERE state != 'idle' 
AND now() - query_start > interval '1 second'
ORDER BY duration DESC 
LIMIT 10;
```

#### Check Table Sizes

```sql
-- Get table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS total_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY total_bytes DESC
LIMIT 20;
```

#### Check Index Usage

```sql
-- Get index statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 10;
```

#### Check Bloat

```sql
-- Check for table bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_indexes_size(schemaname||'.'||tablename)) AS bloat_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY (pg_total_relation_size(schemaname||'.'||tablename) - pg_indexes_size(schemaname||'.'||tablename)) DESC
LIMIT 10;
```

### Monitoring Tools

#### pgAdmin

Use pgAdmin for visual monitoring:
1. Open pgAdmin at http://localhost:5050
2. Navigate to Dashboard
3. Monitor:
   - Database size
   - Active connections
   - Transaction rates
   - Query performance

#### Docker Stats

```bash
# View container resource usage
docker stats smarttech_postgres --no-stream

# View container logs
docker logs smarttech_postgres --tail 100

# View container health
docker inspect --format='{{.State.Health.Status}}' smarttech_postgres
```

---

## Quick Reference

### Health Status File Format

The `health-status.json` file contains:

```json
{
  "timestamp": "2026-01-19 13:00:00",
  "health_status": "healthy",
  "container_status": "running",
  "container_health": "healthy",
  "database_status": "ready",
  "table_count": 40,
  "expected_tables": 40,
  "database_size": "125 MB",
  "active_connections": 15,
  "long_queries": 0,
  "locks": 2,
  "disk_used": "45%",
  "disk_available": "55%",
  "migration_count": 8,
  "issues_found": 0,
  "issues": []
}
```

### Log File Locations

- **Health check log**: `database-backups/logs/health-check.log`
- **Health status JSON**: `database-backups/logs/health-status.json`
- **Backup logs**: `database-backups/logs/backup-*.log`
- **Restore logs**: `database-backups/logs/*restore*.log`
- **Rotation log**: `database-backups/logs/backup-rotation.log`

### Common Commands

```bash
# Run health check
health-check.bat

# View health status
type database-backups\logs\health-status.json

# View health check log
type database-backups\logs\health-check.log | more

# Monitor database in real-time
docker logs -f smarttech_postgres

# Check database connections
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active';"

# View slow queries
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "SELECT pid, now() - query_start as duration, state, query FROM pg_stat_activity WHERE state != 'idle' AND now() - query_start > interval '1 second' ORDER BY duration DESC LIMIT 10;"

# Check table sizes
docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

---

## Best Practices

1. **Monitor Regularly**
   - Run health checks every 15 minutes
   - Review logs daily
   - Analyze trends weekly

2. **Set Up Alerts**
   - Configure email notifications
   - Set appropriate thresholds
   - Test alert delivery

3. **Maintain Historical Data**
   - Keep logs for at least 90 days
   - Track performance trends
   - Document incidents

4. **Proactive Monitoring**
   - Monitor for early warning signs
   - Address issues before they become critical
   - Plan for capacity growth

5. **Document Findings**
   - Record all incidents
   - Document resolution steps
   - Update procedures based on lessons learned

---

**Last Updated**: 2026-01-19
**Version**: 1.0
**Maintained By**: Database Administration Team
