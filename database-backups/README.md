# Database Backup System for Smart Tech B2C E-commerce

## Overview

This comprehensive backup system provides automated database backup, restore, and monitoring capabilities for the Smart Tech B2C E-commerce application. It is designed to prevent data loss and ensure business continuity.

**Database**: smart_ecommerce_dev
**Container**: smarttech_postgres
**User**: smart_dev
**Location**: e:/Drive_D_Backup/Smart_Tech_B2C_Website_Redevelopment/database-backups

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [System Architecture](#system-architecture)
3. [Backup Scripts](#backup-scripts)
4. [Restore Scripts](#restore-scripts)
5. [Monitoring Scripts](#monitoring-scripts)
6. [Scheduling](#scheduling)
7. [Rotation Policy](#rotation-policy)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

---

## Quick Start

### Immediate Actions

To get started with the backup system:

1. **Run initial health check**
   ```bash
   cd database-backups
   health-check.bat
   ```

2. **Create your first backup**
   ```bash
   cd database-backups
   backup-daily.bat
   ```

3. **Set up automated scheduling** (recommended)
   - See [Scheduling](#scheduling) section below

4. **Test restore procedure**
   - Create a test backup
   - Restore it to a test database
   - Verify data integrity

### Essential Scripts

| Script | Purpose | Usage |
|---------|---------|--------|
| [`backup-daily.bat`](backup-daily.bat) | Creates daily database backups |
| [`backup-weekly.bat`](backup-weekly.bat) | Creates weekly database backups |
| [`backup-monthly.bat`](backup-monthly.bat) | Creates monthly database backups |
| [`backup-pre-migration.bat`](backup-pre-migration.bat) | Creates backup before migrations |
| [`backup-rotation.bat`](backup-rotation.bat) | Manages backup file rotation |
| [`validate-migration.bat`](validate-migration.bat) | Validates database after migrations |
| [`rollback-migration.bat`](rollback-migration.bat) | Rolls back from migration backup |
| [`emergency-restore.bat`](emergency-restore.bat) | Restores from any backup |
| [`health-check.bat`](health-check.bat) | Monitors database health |

---

## System Architecture

### Directory Structure

```
database-backups/
├── daily/                    # Daily backups (7 days retention)
│   ├── smart_ecommerce_dev_daily_YYYYMMDD_HHMMSS.sql.gz
│   └── ...
├── weekly/                   # Weekly backups (4 weeks retention)
│   ├── smart_ecommerce_dev_weekly_YYYYMMDD.sql.gz
│   └── ...
├── monthly/                   # Monthly backups (12 months retention)
│   ├── smart_ecommerce_dev_monthly_YYYYMM.sql.gz
│   └── ...
├── migration-backups/          # Pre-migration backups (30 days retention)
│   ├── [migration_name]_YYYYMMDD_HHMMSS.sql.gz
│   └── ...
├── emergency/                 # Emergency backups (5 files retention)
│   ├── smart_ecommerce_dev_emergency_YYYYMMDD_HHMMSS.sql.gz
│   └── ...
├── logs/                      # All operation logs
│   ├── backup-daily.log
│   ├── backup-weekly.log
│   ├── backup-monthly.log
│   ├── backup-rotation.log
│   ├── backup-pre-migration.log
│   ├── validate-migration.log
│   ├── rollback-migration.log
│   ├── emergency-restore.log
│   ├── health-check.log
│   ├── health-status.json
│   └── scheduler.log
├── RECOVERY_GUIDE.md          # Comprehensive recovery guide
├── BACKUP_AND_RESTORE_PROCEDURES.md  # Backup/restore procedures
├── MONITORING_DASHBOARD.md   # Monitoring setup guide
└── README.md                 # This file
```

### Backup Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Health Check (verify system is healthy)    │
│ 2. Create Backup (pg_dump + gzip)            │
│ 3. Verify Backup (integrity check)              │
│ 4. Rotate Old Backups (delete expired)         │
│ 5. Log Operation (record details)               │
└─────────────────────────────────────────────────────────┘
```

### Restore Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Stop Services (docker-compose down)         │
│ 2. Verify Backup (check integrity)               │
│ 3. Create Emergency Backup (current state)     │
│ 4. Drop Database (DROP DATABASE)                │
│ 5. Recreate Database (CREATE DATABASE)            │
│ 6. Restore Data (gunzip + psql)              │
│ 7. Verify Restore (check tables, data)           │
│ 8. Restart Services (docker-compose up)          │
│ 9. Final Verification (health check)            │
└─────────────────────────────────────────────────────────┘
```

---

## Backup Scripts

### Daily Backup Script

**File**: [`backup-daily.bat`](backup-daily.bat)
**Schedule**: 2:00 AM daily
**Retention**: 7 days
**Location**: `database-backups/daily/`

**Features**:
- ✅ Checks Docker container status
- ✅ Records current table count
- ✅ Creates compressed SQL dump
- ✅ Verifies backup integrity
- ✅ Rotates old backups (keeps last 7 days)
- ✅ Logs all operations
- ✅ Calculates disk usage

**Usage**:
```bash
# Manual execution
cd database-backups
backup-daily.bat

# Windows Task Scheduler (recommended)
schtasks /create /tn "SmartTech Daily DB Backup" /tr "02:00" /sc daily /mo ONCE /ri "CMD /c cd /d e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\database-backups && backup-daily.bat"
```

### Weekly Backup Script

**File**: [`backup-weekly.bat`](backup-weekly.bat)
**Schedule**: 3:00 AM every Sunday
**Retention**: 4 weeks
**Location**: `database-backups/weekly/`

**Features**:
- ✅ Checks Docker container status
- ✅ Records current table count
- ✅ Creates compressed SQL dump
- ✅ Verifies backup integrity
- ✅ Rotates old backups (keeps last 4 weeks)
- ✅ Logs all operations
- ✅ Calculates disk usage

**Usage**:
```bash
# Manual execution
cd database-backups
backup-weekly.bat

# Windows Task Scheduler (recommended)
schtasks /create /tn "SmartTech Weekly DB Backup" /tr "03:00" /sc weekly /d SUN /mo ONCE /ri "CMD /c cd /d e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\database-backups && backup-weekly.bat"
```

### Monthly Backup Script

**File**: [`backup-monthly.bat`](backup-monthly.bat)
**Schedule**: 4:00 AM on 1st of every month
**Retention**: 12 months
**Location**: `database-backups/monthly/`

**Features**:
- ✅ Checks Docker container status
- ✅ Records current table count
- ✅ Creates compressed SQL dump
- ✅ Verifies backup integrity
- ✅ Rotates old backups (keeps last 12 months)
- ✅ Logs all operations
- ✅ Calculates disk usage

**Usage**:
```bash
# Manual execution
cd database-backups
backup-monthly.bat

# Windows Task Scheduler (recommended)
schtasks /create /tn "SmartTech Monthly DB Backup" /tr "04:00" /sc monthly /d 1 /mo ONCE /ri "CMD /c cd /d e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\database-backups && backup-monthly.bat"
```

### Pre-Migration Backup Script

**File**: [`backup-pre-migration.bat`](backup-pre-migration.bat)
**Usage**: Run BEFORE any database migration
**Retention**: 30 days
**Location**: `database-backups/migration-backups/`

**Features**:
- ✅ Records migration name
- ✅ Gets current table count
- ✅ Lists all applied migrations
- ✅ Gets row counts for important tables
- ✅ Creates compressed SQL dump
- ✅ Verifies backup integrity
- ✅ Creates checksum for verification
- ✅ Generates summary file
- ✅ Rotates old migration backups (keeps last 30 days)

**Usage**:
```bash
# Before running a migration
cd database-backups
backup-pre-migration.bat add_user_roles

# Before running Prisma migration
cd database-backups
backup-pre-migration.bat prisma_migrate
```

**CRITICAL**: Always run this script before executing any database migration!

---

## Restore Scripts

### Emergency Restore Script

**File**: [`emergency-restore.bat`](emergency-restore.bat)
**Usage**: For complete database restore from any backup
**Location**: Any backup file

**Features**:
- ⚠️ Warns about complete data replacement
- ✅ Requires user confirmation
- ✅ Verifies backup file integrity
- ✅ Stops all services
- ✅ Creates emergency backup of current state
- ✅ Drops current database
- ✅ Recreates database
- ✅ Restores from backup file
- ✅ Verifies restore success
- ✅ Restarts all services
- ✅ Performs final verification

**Usage**:
```bash
cd database-backups
emergency-restore.bat daily\smart_ecommerce_dev_daily_20260119_020030.sql.gz
```

**Precautions**:
- This will COMPLETELY REPLACE current database
- All data changes after the backup will be LOST
- Creates emergency backup of current state first
- Requires manual confirmation

### Migration Rollback Script

**File**: [`rollback-migration.bat`](rollback-migration.bat)
**Usage**: For rolling back a specific migration
**Location**: Migration backup file

**Features**:
- ⚠️ Warns about complete data replacement
- ✅ Requires user confirmation
- ✅ Creates emergency backup of current state
- ✅ Stops application containers
- ✅ Drops current database
- ✅ Recreates database
- ✅ Restores from migration backup
- ✅ Verifies restore success
- ✅ Restarts application containers
- ✅ Offers to remove last migration record
- ✅ Creates summary

**Usage**:
```bash
cd database-backups
rollback-migration.bat migration-backups\add_user_roles_20260119_143022.sql.gz
```

---

## Monitoring Scripts

### Health Check Script

**File**: [`health-check.bat`](health-check.bat)
**Recommended Schedule**: Every 15 minutes
**Location**: `database-backups/logs/health-check.log`

**Features**:
- ✅ Checks Docker container status
- ✅ Checks database connection
- ✅ Verifies table count (expected: 40)
- ✅ Checks database size
- ✅ Monitors active connections
- ✅ Detects long-running queries
- ✅ Checks database locks
- ✅ Monitors disk usage
- ✅ Checks critical tables data
- ✅ Verifies migration status
- ✅ Checks replication status
- ✅ Generates JSON status file

**Usage**:
```bash
cd database-backups
health-check.bat

# View health status
type database-backups\logs\health-status.json
```

**Health Status File Format**:
```json
{
  "timestamp": "2026-01-19 13:00:00",
  "health_status": "healthy",
  "container_status": "running",
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

---

## Scheduling

### Windows Task Scheduler Setup

#### Daily Backup Task

```bash
# Create daily backup task
schtasks /create /tn "SmartTech Daily DB Backup" /tr "02:00" /sc daily /mo ONCE /ri "CMD /c cd /d e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\database-backups && backup-daily.bat >> database-backups\logs\scheduler.log 2>&1"
```

#### Weekly Backup Task

```bash
# Create weekly backup task
schtasks /create /tn "SmartTech Weekly DB Backup" /tr "03:00" /sc weekly /d SUN /mo ONCE /ri "CMD /c cd /d e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\database-backups && backup-weekly.bat >> database-backups\logs\scheduler.log 2>&1"
```

#### Monthly Backup Task

```bash
# Create monthly backup task
schtasks /create /tm "SmartTech Monthly DB Backup" /tr "04:00" /sc monthly /d 1 /mo ONCE /ri "CMD /c cd /d e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\database-backups && backup-monthly.bat >> database-backups\logs\scheduler.log 2>&1"
```

#### Health Check Task

```bash
# Create health check task (every 15 minutes)
schtasks /create /tn "SmartTech DB Health Check" /tr "*/15" /sc minute /mo ONCE /ri "CMD /c cd /d e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\database-backups && health-check.bat >> database-backups\logs\scheduler.log 2>&1"
```

### Managing Scheduled Tasks

```bash
# List all scheduled tasks
schtasks /query /fo LIST /v

# Delete a task
schtasks /delete /tn "Task Name"

# Disable a task
schtasks /change /tn "Task Name" /disable

# Enable a task
schtasks /change /tn "Task Name" /enable

# Run a task immediately
schtasks /run /tn "Task Name"
```

---

## Rotation Policy

### Daily Backups

- **Retention Period**: 7 days
- **Maximum Files**: 7
- **Naming Convention**: `smart_ecommerce_dev_daily_YYYYMMDD_HHMMSS.sql.gz`
- **Rotation Method**: Delete files older than 7 days
- **Storage Estimate**: ~7 files × ~50 MB = ~350 MB

### Weekly Backups

- **Retention Period**: 4 weeks (28 days)
- **Maximum Files**: 4
- **Naming Convention**: `smart_ecommerce_dev_weekly_YYYYMMDD.sql.gz`
- **Rotation Method**: Delete files older than 4 weeks
- **Storage Estimate**: ~4 files × ~100 MB = ~400 MB

### Monthly Backups

- **Retention Period**: 12 months (365 days)
- **Maximum Files**: 12
- **Naming Convention**: `smart_ecommerce_dev_monthly_YYYYMM.sql.gz`
- **Rotation Method**: Delete files older than 12 months
- **Storage Estimate**: ~12 files × ~150 MB = ~1.8 GB

### Migration Backups

- **Retention Period**: 30 days
- **Maximum Files**: 30
- **Naming Convention**: `[migration_name]_YYYYMMDD_HHMMSS.sql.gz`
- **Rotation Method**: Delete files older than 30 days
- **Storage Estimate**: ~30 files × ~60 MB = ~1.8 GB

### Emergency Backups

- **Retention Period**: 5 backups
- **Maximum Files**: 5
- **Naming Convention**: `smart_ecommerce_dev_emergency_YYYYMMDD_HHMMSS.sql.gz`
- **Rotation Method**: Delete oldest when creating new (keep 5 max)
- **Storage Estimate**: ~5 files × ~50 MB = ~250 MB

### Total Storage Estimate

- **Daily**: ~350 MB
- **Weekly**: ~400 MB
- **Monthly**: ~1.8 GB
- **Migration**: ~1.8 GB
- **Emergency**: ~250 MB
- **Total**: ~4.6 GB

---

## Best Practices

### Before Making Changes

1. **Always Create Pre-Migration Backup**
   ```bash
   cd database-backups
   backup-pre-migration.bat migration_name
   ```

2. **Test Changes in Development**
   - Apply changes to staging database first
   - Test thoroughly before production
   - Document all changes

3. **Review Migration Scripts**
   - Check for destructive operations
   - Verify data preservation
   - Test rollback procedures

### Backup Strategy

1. **Multiple Backup Levels**
   - **Daily**: For quick recovery from recent issues
   - **Weekly**: For recovery within the past month
   - **Monthly**: For long-term recovery
   - **Pre-migration**: For safe migration rollbacks

2. **Off-Site Storage**
   - Store backups outside Docker volumes
   - Use separate storage location
   - Consider cloud storage for critical backups

3. **Backup Verification**
   - Test backup integrity after creation
   - Verify backup can be restored
   - Monitor backup success rates

### Monitoring

1. **Regular Health Checks**
   ```bash
   # Schedule health checks
   # Windows Task Scheduler: Every 15 minutes
   health-check.bat
   ```

2. **Alert Configuration**
   - Set up alerts for:
     - Database connection failures
     - High error rates
     - Performance degradation
     - Disk space issues

3. **Log Review**
   - Review logs daily
   - Look for warning signs
   - Address issues proactively

### Access Control

1. **Limit Database Access**
   - Use least privilege principle
   - Restrict direct database access
   - Audit database modifications

2. **Change Management**
   - Require approval for schema changes
   - Document all modifications
   - Use version control for migrations

3. **Training**
   - Train team on backup procedures
   - Document recovery processes
   - Conduct regular drills

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Backup Script Fails

**Symptoms**:
- Script exits with error
- No backup file created
- Log shows errors

**Solutions**:

1. **Check Docker container status**
   ```bash
   docker ps | findstr smarttech_postgres
   ```

2. **Check disk space**
   ```bash
   dir database-backups
   ```

3. **Check database connection**
   ```bash
   docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "SELECT 1;"
   ```

4. **Review logs**
   ```bash
   type database-backups\logs\backup-daily.log
   ```

#### Issue: Restore Script Fails

**Symptoms**:
- Script exits with error
- Database is in inconsistent state
- Cannot connect to database

**Solutions**:

1. **Check backup file**
   ```bash
   # Verify file exists
   dir backup_file.sql.gz
   
   # Test integrity
   gunzip -t backup_file.sql.gz
   ```

2. **Check PostgreSQL container**
   ```bash
   docker ps | findstr smarttech_postgres
   docker logs smarttech_postgres --tail 50
   ```

3. **Check disk space**
   ```bash
   docker exec smarttech_postgres df -h /var/lib/postgresql/data
   ```

4. **Manual restore**
   ```bash
   # Drop database
   docker exec smarttech_postgres psql -U smart_dev -d postgres -c "DROP DATABASE IF EXISTS smart_ecommerce_dev;"
   
   # Recreate database
   docker exec smarttech_postgres psql -U smart_dev -d postgres -c "CREATE DATABASE smart_ecommerce_dev OWNER smart_dev;"
   
   # Restore
   docker exec -i smarttech_postgres bash -c "gunzip -c < /dev/stdin | psql -U smart_dev -d smart_ecommerce_dev" < backup_file.sql.gz
   ```

#### Issue: Health Check Shows Unhealthy

**Symptoms**:
- Health status is "unhealthy"
- Multiple checks failing
- Issues found count > 0

**Solutions**:

1. **Review health status file**
   ```bash
   type database-backups\logs\health-status.json
   ```

2. **Check detailed logs**
   ```bash
   type database-backups\logs\health-check.log
   ```

3. **Address specific issues**
   - Container down: Start Docker services
   - Database not ready: Check PostgreSQL logs
   - Missing tables: Run validation script
   - High connections: Check for connection leaks

#### Issue: Disk Space Running Low

**Symptoms**:
- Backup scripts fail
- Health check shows disk usage > 80%
- Cannot create new files

**Solutions**:

1. **Check disk space**
   ```bash
   dir database-backups
   docker exec smarttech_postgres df -h /var/lib/postgresql/data
   ```

2. **Clean up old backups**
   ```bash
   cd database-backups
   backup-rotation.bat
   ```

3. **Move backups to external storage**
   - Consider moving backups to external drive
   - Use cloud storage for critical backups
   - Implement backup archival

4. **Increase disk space**
   - Clean up unnecessary files
   - Remove old logs
   - Compress old backups

---

## Maintenance

### Regular Maintenance Tasks

#### Daily

1. **Review health check logs**
   ```bash
   type database-backups\logs\health-check.log | findstr /C:"FAIL:" /C:"WARN:"
   ```

2. **Check backup success**
   ```bash
   type database-backups\logs\backup-daily.log | findstr /C:"Backup created successfully"
   ```

3. **Monitor disk space**
   ```bash
   dir database-backups
   ```

#### Weekly

1. **Review all backup logs**
   ```bash
   type database-backups\logs\*.log | findstr /C:"ERROR:"
   ```

2. **Verify backup rotation**
   ```bash
   cd database-backups
   backup-rotation.bat
   ```

3. **Test restore procedure**
   - Create a test backup
   - Restore it to verify procedure works
   - Document any issues found

#### Monthly

1. **Review storage usage**
   ```bash
   dir database-backups /s
   ```

2. **Archive old backups**
   - Move backups older than 12 months to archive
   - Consider compressing archives
   - Document archive location

3. **Update documentation**
   - Review and update this README
   - Document any lessons learned
   - Update procedures based on experience

### Log Management

**Log Rotation Policy**:
- Keep last 100 lines for operation logs
- Keep last 200 lines for validation logs
- Keep last 300 lines for health check logs
- Archive logs older than 90 days

**Log Locations**:
- **Operation logs**: `database-backups/logs/`
- **Health status**: `database-backups/logs/health-status.json`
- **Scheduler log**: `database-backups/logs/scheduler.log`

---

## Documentation

### Additional Documentation

- **[Recovery Guide](RECOVERY_GUIDE.md)** - Comprehensive recovery procedures
- **[Backup and Restore Procedures](BACKUP_AND_RESTORE_PROCEDURES.md)** - Detailed backup/restore procedures
- **[Monitoring Dashboard](MONITORING_DASHBOARD.md)** - Monitoring setup and configuration
- **[.dockerignore](../.dockerignore)** - Volume protection configuration

### Quick Reference

#### Common Commands

```bash
# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Check database health
health-check.bat

# Create pre-migration backup
backup-pre-migration.bat migration_name

# Validate migration
validate-migration.bat

# Rollback migration
rollback-migration.bat backup_file.sql.gz

# Emergency restore
emergency-restore.bat backup_file.sql.gz

# View database logs
docker logs smarttech_postgres --tail 100

# Connect to database
docker exec -it smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev
```

### Important Contacts

- **Database Administrator**: [Add contact]
- **System Administrator**: [Add contact]
- **Application Developer**: [Add contact]

---

## Summary

This backup system provides:

✅ **Automated daily, weekly, and monthly backups**
✅ **Pre-migration backup capability**
✅ **Emergency restore procedures**
✅ **Database health monitoring**
✅ **Comprehensive logging**
✅ **Backup rotation with configurable retention**
✅ **Migration validation and rollback**
✅ **Detailed documentation**

### Key Features

- **Zero Data Loss**: Multiple backup levels ensure data is never lost
- **Quick Recovery**: Daily backups enable recovery from recent issues
- **Long-term Retention**: Monthly backups provide historical snapshots
- **Migration Safety**: Pre-migration backups prevent migration failures
- **Health Monitoring**: Proactive detection of issues
- **Comprehensive Logging**: All operations are logged for audit
- **Easy Recovery**: Simple scripts for restore operations
- **Volume Protection**: `.dockerignore` prevents accidental volume deletion

### Getting Started

1. Run [`health-check.bat`](health-check.bat) to verify system status
2. Run [`backup-daily.bat`](backup-daily.bat) to create your first backup
3. Set up Windows Task Scheduler for automated backups
4. Review the documentation in this directory

---

**Last Updated**: 2026-01-19
**Version**: 1.0
**Maintained By**: Database Administration Team
