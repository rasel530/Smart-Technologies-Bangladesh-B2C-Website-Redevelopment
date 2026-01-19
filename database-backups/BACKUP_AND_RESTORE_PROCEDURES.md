# Database Backup and Restore Procedures

## Overview

This document provides detailed procedures for creating and restoring PostgreSQL database backups for the Smart Tech B2C E-commerce application.

**Database**: smart_ecommerce_dev
**Container**: smarttech_postgres
**User**: smart_dev
**Location**: e:/Drive_D_Backup/Smart_Tech_B2C_Website_Redevelopment/database-backups

---

## Table of Contents

1. [Backup Procedures](#backup-procedures)
2. [Restore Procedures](#restore-procedures)
3. [Backup Schedule](#backup-schedule)
4. [Backup Rotation Policy](#backup-rotation-policy)
5. [Troubleshooting](#troubleshooting)

---

## Backup Procedures

### Automated Backups

#### Daily Backup

**Script**: `backup-daily.bat`
**Schedule**: 2:00 AM daily
**Retention**: 7 days
**Location**: `database-backups/daily/`

**Execution**:
```bash
# Manual execution
cd database-backups
backup-daily.bat

# Windows Task Scheduler (recommended)
schtasks /create /tn "Daily Database Backup" /tr "02:00" /sc daily /mo ONCE /ri "CMD /c cd /d e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\database-backups && backup-daily.bat"
```

**What it does**:
1. Checks if Docker container is running
2. Records current table count
3. Creates compressed SQL dump
4. Verifies backup integrity
5. Rotates old backups (keeps last 7 days)
6. Logs all operations
7. Calculates disk usage

**Output files**:
```
smart_ecommerce_dev_daily_20260119_020030.sql.gz
```

#### Weekly Backup

**Script**: `backup-weekly.bat`
**Schedule**: 3:00 AM every Sunday
**Retention**: 4 weeks
**Location**: `database-backups/weekly/`

**Execution**:
```bash
# Manual execution
cd database-backups
backup-weekly.bat

# Windows Task Scheduler (recommended)
schtasks /create /tn "Weekly Database Backup" /tr "03:00" /sc weekly /d SUN /mo ONCE /ri "CMD /c cd /d e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\database-backups && backup-weekly.bat"
```

**What it does**:
1. Checks if Docker container is running
2. Records current table count
3. Creates compressed SQL dump
4. Verifies backup integrity
5. Rotates old backups (keeps last 4 weeks)
6. Logs all operations
7. Calculates disk usage

**Output files**:
```
smart_ecommerce_dev_weekly_20260119.sql.gz
```

#### Monthly Backup

**Script**: `backup-monthly.bat`
**Schedule**: 4:00 AM on the 1st of every month
**Retention**: 12 months
**Location**: `database-backups/monthly/`

**Execution**:
```bash
# Manual execution
cd database-backups
backup-monthly.bat

# Windows Task Scheduler (recommended)
schtasks /create /tn "Monthly Database Backup" /tr "04:00" /sc monthly /d 1 /mo ONCE /ri "CMD /c cd /d e:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment\database-backups && backup-monthly.bat"
```

**What it does**:
1. Checks if Docker container is running
2. Records current table count
3. Creates compressed SQL dump
4. Verifies backup integrity
5. Rotates old backups (keeps last 12 months)
6. Logs all operations
7. Calculates disk usage

**Output files**:
```
smart_ecommerce_dev_monthly_202601.sql.gz
```

### Pre-Migration Backup

**Script**: `backup-pre-migration.bat`
**Usage**: Run BEFORE any database migration
**Retention**: 30 days
**Location**: `database-backups/migration-backups/`

**Execution**:
```bash
# Before running a migration
cd database-backups
backup-pre-migration.bat add_user_roles

# Before running Prisma migration
cd database-backups
backup-pre-migration.bat prisma_migrate
```

**What it does**:
1. Records migration name
2. Gets current table count
3. Lists all applied migrations
4. Gets row counts for important tables
5. Creates compressed SQL dump
6. Verifies backup integrity
7. Creates checksum for verification
8. Generates summary file
9. Rotates old migration backups (keeps last 30 days)

**Output files**:
```
add_user_roles_20260119_143022.sql.gz
add_user_roles_20260119_143022_summary.txt
```

### Manual Backup

For ad-hoc backups, use the following command:

```bash
# Create a manual backup
docker exec smarttech_postgres pg_dump -U smart_dev -d smart_ecommerce_dev --no-owner --no-acl --format=plain | gzip > manual_backup_YYYYMMDD_HHMMSS.sql.gz
```

---

## Restore Procedures

### Emergency Restore

**Script**: `emergency-restore.bat`
**Usage**: For complete database restore from any backup
**Location**: Any backup file

**Execution**:
```bash
cd database-backups
emergency-restore.bat daily\smart_ecommerce_dev_daily_20260119_020030.sql.gz
```

**What it does**:
1. Warns about complete data replacement
2. Requires user confirmation
3. Verifies backup file integrity
4. Stops all services
5. Creates emergency backup of current state
6. Drops current database
7. Recreates database
8. Restores from backup file
9. Verifies restore success
10. Restarts all services
11. Performs final verification

**Precautions**:
- This will COMPLETELY REPLACE current database
- All data changes after the backup will be LOST
- Creates emergency backup of current state first
- Requires manual confirmation

### Migration Rollback

**Script**: `rollback-migration.bat`
**Usage**: For rolling back a specific migration
**Location**: Migration backup file

**Execution**:
```bash
cd database-backups
rollback-migration.bat migration-backups\add_user_roles_20260119_143022.sql.gz
```

**What it does**:
1. Warns about complete data replacement
2. Requires user confirmation
3. Creates emergency backup of current state
4. Stops application containers
5. Drops current database
6. Recreates database
7. Restores from migration backup
8. Verifies restore success
9. Restarts application containers
10. Offers to remove last migration record
11. Creates summary

**Precautions**:
- This will rollback the specific migration
- All changes after that migration will be lost
- Creates emergency backup first
- Requires manual confirmation

### Manual Restore

For manual restore operations:

```bash
# 1. Stop services
docker-compose down

# 2. Start only PostgreSQL
docker-compose up -d postgres

# 3. Wait for PostgreSQL to be ready
timeout /t 10

# 4. Drop existing database
docker exec smarttech_postgres psql -U smart_dev -d postgres -c "DROP DATABASE IF EXISTS smart_ecommerce_dev;"

# 5. Recreate database
docker exec smarttech_postgres psql -U smart_dev -d postgres -c "CREATE DATABASE smart_ecommerce_dev OWNER smart_dev;"

# 6. Restore from backup
docker exec -i smarttech_postgres bash -c "gunzip -c < /dev/stdin | psql -U smart_dev -d smart_ecommerce_dev" < backup_file.sql.gz

# 7. Restart all services
docker-compose up -d
```

---

## Backup Schedule

### Recommended Schedule

| Backup Type | Frequency | Time | Retention | Location |
|-------------|----------|------|------------|----------|
| Daily | Every day at 2:00 AM | 7 days | `database-backups/daily/` |
| Weekly | Every Sunday at 3:00 AM | 4 weeks | `database-backups/weekly/` |
| Monthly | 1st of month at 4:00 AM | 12 months | `database-backups/monthly/` |
| Pre-Migration | Before each migration | 30 days | `database-backups/migration-backups/` |

### Setting Up Windows Task Scheduler

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

## Backup Rotation Policy

### Daily Backups

- **Retention Period**: 7 days
- **Maximum Files**: 7
- **Naming Convention**: `smart_ecommerce_dev_daily_YYYYMMDD_HHMMSS.sql.gz`
- **Rotation Method**: Delete files older than 7 days

**Example**:
```
Current daily backups (7 files):
- smart_ecommerce_dev_daily_20260119_020030.sql.gz
- smart_ecommerce_dev_daily_20260118_020030.sql.gz
- smart_ecommerce_dev_daily_20260117_020030.sql.gz
- smart_ecommerce_dev_daily_20260116_020030.sql.gz
- smart_ecommerce_dev_daily_20260115_020030.sql.gz
- smart_ecommerce_dev_daily_20260114_020030.sql.gz
- smart_ecommerce_dev_daily_20260113_020030.sql.gz
- smart_ecommerce_dev_daily_20260112_020030.sql.gz

Old backups (deleted):
- smart_ecommerce_dev_daily_20260111_020030.sql.gz (older than 7 days)
```

### Weekly Backups

- **Retention Period**: 4 weeks (28 days)
- **Maximum Files**: 4
- **Naming Convention**: `smart_ecommerce_dev_weekly_YYYYMMDD.sql.gz`
- **Rotation Method**: Delete files older than 4 weeks

**Example**:
```
Current weekly backups (4 files):
- smart_ecommerce_dev_weekly_20260119.sql.gz
- smart_ecommerce_dev_weekly_20260112.sql.gz
- smart_ecommerce_dev_weekly_20260105.sql.gz
- smart_ecommerce_dev_weekly_20251229.sql.gz

Old backups (deleted):
- smart_ecommerce_dev_weekly_20251222.sql.gz (older than 4 weeks)
```

### Monthly Backups

- **Retention Period**: 12 months (365 days)
- **Maximum Files**: 12
- **Naming Convention**: `smart_ecommerce_dev_monthly_YYYYMM.sql.gz`
- **Rotation Method**: Delete files older than 12 months

**Example**:
```
Current monthly backups (12 files):
- smart_ecommerce_dev_monthly_202601.sql.gz
- smart_ecommerce_dev_monthly_202512.sql.gz
- smart_ecommerce_dev_monthly_202411.sql.gz
- smart_ecommerce_dev_monthly_202410.sql.gz
- smart_ecommerce_dev_monthly_202409.sql.gz
- smart_ecommerce_dev_monthly_202408.sql.gz
- smart_ecommerce_dev_monthly_202407.sql.gz
- smart_ecommerce_dev_monthly_202406.sql.gz
- smart_ecommerce_dev_monthly_202405.sql.gz
- smart_ecommerce_dev_monthly_202404.sql.gz
- smart_ecommerce_dev_monthly_202403.sql.gz
- smart_ecommerce_dev_monthly_202402.sql.gz

Old backups (deleted):
- smart_ecommerce_dev_monthly_202401.sql.gz (older than 12 months)
```

### Migration Backups

- **Retention Period**: 30 days
- **Maximum Files**: 30
- **Naming Convention**: `[migration_name]_YYYYMMDD_HHMMSS.sql.gz`
- **Rotation Method**: Delete files older than 30 days

### Emergency Backups

- **Retention Period**: 5 backups
- **Maximum Files**: 5
- **Naming Convention**: `smart_ecommerce_dev_emergency_YYYYMMDD_HHMMSS.sql.gz`
- **Rotation Method**: Delete oldest when creating new (keep 5 max)

---

## Troubleshooting

### Backup Issues

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

#### Issue: Backup File is Corrupted

**Symptoms**:
- Integrity check fails
- Cannot restore from backup
- File size is unusually small

**Solutions**:

1. **Test backup integrity**
   ```bash
   gunzip -t backup_file.sql.gz
   ```

2. **Use older backup**
   - Check weekly or monthly backups
   - Use pre-migration backup if available

3. **Recreate backup**
   - Run backup script again
   - Verify new backup integrity

### Restore Issues

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

#### Issue: Data Missing After Restore

**Symptoms**:
- Expected records are missing
- Tables show incorrect row counts
- Application shows errors

**Solutions**:

1. **Verify correct backup was used**
   - Check backup timestamp
   - Review backup summary file
   - Verify backup file size

2. **Check restore logs**
   ```bash
   type database-backups\logs\emergency-restore.log
   ```

3. **Validate database**
   ```bash
   cd database-backups
   validate-migration.bat
   ```

4. **Use different backup**
   - Try older backup if available
   - Use weekly or monthly backup

### Performance Issues

#### Issue: Slow Backup Creation

**Symptoms**:
- Backup takes longer than expected
- Script appears to hang
- High CPU or memory usage

**Solutions**:

1. **Check database size**
   ```bash
   docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "SELECT pg_size_pretty(pg_database_size('smart_ecommerce_dev'));"
   ```

2. **Check active connections**
   ```bash
   docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active';"
   ```

3. **Check for long-running queries**
   ```bash
   docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "
   SELECT pid, now() - query_start as duration, state, query 
   FROM pg_stat_activity 
   WHERE state != 'idle' 
   AND now() - query_start > interval '5 minutes' 
   ORDER BY duration DESC 
   LIMIT 5;
   "
   ```

4. **Optimize database**
   ```bash
   docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "VACUUM FULL ANALYZE;"
   ```

---

## Best Practices

### Before Running Backups

1. **Verify system is healthy**
   ```bash
   health-check.bat
   ```

2. **Ensure adequate disk space**
   - Check available space
   - Monitor disk usage
   - Clean up old files if needed

3. **Stop non-critical operations**
   - Avoid large data imports during backup
   - Pause batch operations
   - Schedule maintenance windows

4. **Notify stakeholders**
   - Send notification before backup
   - Inform of expected downtime
   - Provide estimated completion time

### After Running Backups

1. **Verify backup success**
   - Check log files for errors
   - Verify backup file exists
   - Test backup integrity

2. **Monitor disk space**
   - Track backup growth
   - Plan for storage expansion
   - Clean up old files

3. **Review backup logs**
   - Check for warnings
   - Identify recurring issues
   - Optimize backup process

4. **Test restore procedure**
   - Periodically test restore
   - Verify backup integrity
   - Document restore time

### Security Considerations

1. **Protect backup files**
   - Restrict file access permissions
   - Store backups securely
   - Encrypt sensitive backups

2. **Secure database credentials**
   - Use environment variables
   - Don't hardcode passwords
   - Rotate credentials regularly

3. **Audit backup access**
   - Log who accesses backups
   - Review access logs regularly
   - Implement access controls

---

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Backup Success Rate**
   - Target: 99%+ success rate
   - Alert if below 95%

2. **Backup Duration**
   - Track backup completion time
   - Alert if significantly longer than normal
   - Baseline: Daily (~5 min), Weekly (~10 min), Monthly (~20 min)

3. **Disk Space**
   - Monitor backup directory size
   - Alert if > 80% capacity
   - Plan for expansion

4. **Database Health**
   - Run health checks regularly
   - Monitor error rates
   - Track performance metrics

### Setting Up Alerts

1. **Email Notifications**
   - Configure SMTP server
   - Set up alert recipients
   - Define alert thresholds

2. **Log Monitoring**
   - Review logs daily
   - Set up log aggregation
   - Implement log rotation

3. **Health Check Automation**
   - Schedule regular health checks
   - Set up automated alerts
   - Define escalation procedures

---

## Appendix: Quick Reference

### Script Locations

- **Daily backup**: `database-backups/backup-daily.bat`
- **Weekly backup**: `database-backups/backup-weekly.bat`
- **Monthly backup**: `database-backups/backup-monthly.bat`
- **Pre-migration backup**: `database-backups/backup-pre-migration.bat`
- **Backup rotation**: `database-backups/backup-rotation.bat`
- **Migration validation**: `database-backups/validate-migration.bat`
- **Migration rollback**: `database-backups/rollback-migration.bat`
- **Emergency restore**: `database-backups/emergency-restore.bat`
- **Health check**: `database-backups/health-check.bat`

### Log Locations

- **Daily backup log**: `database-backups/logs/backup-daily.log`
- **Weekly backup log**: `database-backups/logs/backup-weekly.log`
- **Monthly backup log**: `database-backups/logs/backup-monthly.log`
- **Rotation log**: `database-backups/logs/backup-rotation.log`
- **Pre-migration log**: `database-backups/logs/backup-pre-migration.log`
- **Validation log**: `database-backups/logs/validate-migration.log`
- **Rollback log**: `database-backups/logs/rollback-migration.log`
- **Emergency restore log**: `database-backups/logs/emergency-restore.log`
- **Health check log**: `database-backups/logs/health-check.log`
- **Scheduler log**: `database-backups/logs/scheduler.log`

### Important Contacts

- **Database Administrator**: [Add contact]
- **System Administrator**: [Add contact]
- **Application Developer**: [Add contact]

---

**Last Updated**: 2026-01-19
**Version**: 1.0
**Maintained By**: Database Administration Team
