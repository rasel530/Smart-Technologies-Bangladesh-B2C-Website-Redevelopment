# Database Recovery Guide

## Table of Contents
1. [Emergency Recovery Procedures](#emergency-recovery-procedures)
2. [Common Recovery Scenarios](#common-recovery-scenarios)
3. [Step-by-Step Recovery Instructions](#step-by-step-recovery-instructions)
4. [Verification After Recovery](#verification-after-recovery)
5. [Prevention Best Practices](#prevention-best-practices)

---

## Emergency Recovery Procedures

### Immediate Actions Required

When you encounter data loss or database corruption, follow these immediate steps:

1. **STOP ALL APPLICATIONS**
   ```bash
   docker-compose down
   ```
   This prevents further data corruption and allows for safe recovery.

2. **ASSESS THE SITUATION**
   - Identify the type of data loss (corruption, accidental deletion, migration failure)
   - Determine when the issue occurred
   - Check available backups

3. **CHOOSE RECOVERY METHOD**
   - Use `emergency-restore.bat` for complete database restore
   - Use `rollback-migration.bat` for migration-specific rollback
   - Use manual SQL restore for partial recovery

---

## Common Recovery Scenarios

### Scenario 1: Migration Failure

**Symptoms:**
- Migration script failed or was interrupted
- Application shows errors related to missing tables or columns
- Database is in inconsistent state

**Recovery Steps:**

1. **Identify the failed migration**
   ```bash
   # Check migration history
   docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "SELECT * FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;"
   ```

2. **Find the pre-migration backup**
   ```bash
   # List migration backups
   dir database-backups\migration-backups\*.sql.gz
   ```

3. **Rollback using the script**
   ```bash
   cd database-backups
   rollback-migration.bat migration-backups\pre_migration_YYYYMMDD_HHMMSS.sql.gz
   ```

4. **Verify rollback**
   ```bash
   # Run validation
   validate-migration.bat
   ```

5. **Test application**
   - Start the application
   - Test critical functionality (login, create order, view products)
   - Monitor logs for errors

### Scenario 2: Accidental Data Deletion

**Symptoms:**
- Important data is missing
- Records were accidentally deleted
- Tables show unexpected row counts

**Recovery Steps:**

1. **Identify when data was deleted**
   - Check application logs
   - Review database activity logs
   - Determine approximate time of deletion

2. **Select appropriate backup**
   - Use the most recent backup BEFORE the deletion
   - Check backup timestamps in `database-backups/daily/`
   - If needed, use weekly or monthly backups

3. **Restore using emergency-restore script**
   ```bash
   cd database-backups
   emergency-restore.bat daily\smart_ecommerce_dev_daily_YYYYMMDD_HHMMSS.sql.gz
   ```

4. **Verify restored data**
   - Check row counts match expectations
   - Verify critical records are present
   - Test application functionality

5. **Consider partial restore** (if only specific tables affected)
   ```sql
   -- Restore specific table from backup
   pg_restore -U smart_dev -d smart_ecommerce_dev -t users backup.sql
   ```

### Scenario 3: Database Corruption

**Symptoms:**
- Application shows database errors
- Queries fail or return incorrect results
- Database reports integrity issues

**Recovery Steps:**

1. **Identify corruption type**
   ```bash
   # Check database health
   health-check.bat
   ```

2. **Select last known good backup**
   - Use the most recent backup that passed integrity checks
   - Check backup logs for successful creation
   - Verify backup file integrity

3. **Restore from backup**
   ```bash
   cd database-backups
   emergency-restore.bat [backup_file.sql.gz]
   ```

4. **Run database diagnostics**
   ```bash
   # Check for corruption indicators
   docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "
   SELECT 
       schemaname,
       tablename,
       n_dead_tup as dead_rows
   FROM pg_stat_user_tables 
   WHERE schemaname = 'public' 
   ORDER BY n_dead_tup DESC;
   "
   ```

5. **Consider vacuum and analyze**
   ```bash
   # Clean up database
   docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "VACUUM FULL ANALYZE;"
   ```

### Scenario 4: Complete Data Loss

**Symptoms:**
- All tables are empty
- Database volume was accidentally deleted
- Container was recreated without volume mount

**Recovery Steps:**

1. **Stop all containers**
   ```bash
   docker-compose down
   ```

2. **Check Docker volumes**
   ```bash
   # List all volumes
   docker volume ls
   ```

3. **Verify volume exists**
   ```bash
   # Check postgres_data volume
   docker volume inspect postgres_data
   ```

4. **Restore from most recent backup**
   ```bash
   cd database-backups
   emergency-restore.bat daily\smart_ecommerce_dev_daily_YYYYMMDD_HHMMSS.sql.gz
   ```

5. **Verify all data is restored**
   ```bash
   # Check table counts
   docker exec smarttech_postgres psql -U smart_dev -d smart_ecommerce_dev -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
   ```

6. **Update volume protection**
   - Review `.dockerignore` file
   - Ensure volumes are properly protected
   - Document volume backup procedures

---

## Step-by-Step Recovery Instructions

### Step 1: Assessment

Before attempting recovery, gather information:

1. **Check current database state**
   ```bash
   # Run health check
   health-check.bat
   ```

2. **Review logs**
   ```bash
   # Check application logs
   docker-compose logs backend --tail 100
   
   # Check database logs
   docker logs smarttech_postgres --tail 100
   ```

3. **Identify the issue**
   - What data is missing or corrupted?
   - When did the issue occur?
   - What changes were made recently?

### Step 2: Backup Selection

Choose the appropriate backup:

1. **List available backups**
   ```bash
   # Daily backups
   dir database-backups\daily\*.sql.gz /o-d
   
   # Weekly backups
   dir database-backups\weekly\*.sql.gz /o-d
   
   # Monthly backups
   dir database-backups\monthly\*.sql.gz /o-d
   ```

2. **Verify backup integrity**
   ```bash
   # Test backup file
   gunzip -t backup_file.sql.gz
   ```

3. **Select backup based on scenario**
   - **Most recent daily**: For recent data loss
   - **Most recent weekly**: For issues within the past week
   - **Most recent monthly**: For older issues or complete restore
   - **Pre-migration backup**: For migration failures

### Step 3: Recovery Execution

1. **Stop all services**
   ```bash
   docker-compose down
   ```

2. **Run recovery script**
   ```bash
   # For complete database restore
   emergency-restore.bat [backup_file.sql.gz]
   
   # For migration rollback
   rollback-migration.bat [backup_file.sql.gz]
   ```

3. **Monitor recovery process**
   - Watch for errors in the console
   - Note any warnings
   - Verify completion messages

### Step 4: Verification

1. **Run health check**
   ```bash
   health-check.bat
   ```

2. **Validate database**
   ```bash
   validate-migration.bat
   ```

3. **Test application**
   - Start the application: `docker-compose up -d`
   - Test login functionality
   - Test critical features
   - Monitor for errors

### Step 5: Post-Recovery Actions

1. **Document the recovery**
   - Note the issue and cause
   - Record the recovery steps taken
   - Document the backup used

2. **Update monitoring**
   - Increase monitoring frequency
   - Set up alerts for similar issues
   - Review backup schedule

3. **Prevent recurrence**
   - Update procedures
   - Add safeguards
   - Train team members

---

## Verification After Recovery

### Database Integrity Checks

1. **Table Count Verification**
   ```sql
   SELECT COUNT(*) as table_count
   FROM information_schema.tables
   WHERE table_schema = 'public';
   ```
   Expected: 40 tables

2. **Critical Tables Check**
   ```sql
   SELECT tablename
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('users', 'products', 'orders', 'categories', 'brands');
   ```
   All should be present.

3. **Row Count Verification**
   ```sql
   SELECT 
       tablename,
       n_live_tup as row_count
   FROM pg_stat_user_tables
   WHERE schemaname = 'public'
   ORDER BY n_live_tup DESC
   LIMIT 10;
   ```
   Verify critical tables have expected row counts.

4. **Foreign Key Integrity**
   ```sql
   SELECT COUNT(*) as broken_fks
   FROM pg_constraint
   WHERE contype = 'f'
   AND NOT EXISTS (
       SELECT 1 FROM pg_class
       WHERE pg_class.oid = pg_constraint.conrelid
   );
   ```
   Should be 0.

5. **Index Verification**
   ```sql
   SELECT COUNT(*) as missing_indexes
   FROM pg_constraint
   WHERE contype = 'f'
   AND NOT EXISTS (
       SELECT 1 FROM pg_index
       WHERE pg_index.indrelid = pg_constraint.conrelid
   );
   ```
   Should be 0.

### Application Functionality Tests

1. **User Authentication**
   - Test user login
   - Test user registration
   - Test password reset

2. **Core Features**
   - Test product browsing
   - Test cart functionality
   - Test order creation
   - Test search functionality

3. **Admin Functions**
   - Test admin login
   - Test product management
   - Test order management
   - Test user management

4. **Performance**
   - Check page load times
   - Monitor query performance
   - Verify no slow queries

### Log Monitoring

Monitor logs for 24-48 hours after recovery:

```bash
# Application logs
docker-compose logs -f backend

# Database logs
docker logs -f smarttech_postgres

# All services
docker-compose logs -f
```

Look for:
- Connection errors
- Query failures
- Missing table/column errors
- Performance degradation
- Application crashes

---

## Prevention Best Practices

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

## Contact Information

### For Critical Issues

If you encounter issues beyond your capability to resolve:

1. **Document the issue**
   - Take screenshots of errors
   - Copy log files
   - Note exact steps taken

2. **Preserve evidence**
   - Don't modify the system further
   - Keep the failed state intact
   - Save all relevant logs

3. **Seek assistance**
   - Review this guide thoroughly
   - Check backup logs
   - Consider professional database recovery services

### Emergency Contacts

- **System Administrator**: [Add contact]
- **Database Administrator**: [Add contact]
- **Application Developer**: [Add contact]

---

## Quick Reference

### Common Commands

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

### File Locations

- **Daily backups**: `database-backups/daily/`
- **Weekly backups**: `database-backups/weekly/`
- **Monthly backups**: `database-backups/monthly/`
- **Migration backups**: `database-backups/migration-backups/`
- **Emergency backups**: `database-backups/emergency/`
- **Logs**: `database-backups/logs/`

### Important Notes

1. **Always test backups before relying on them**
2. **Never skip the pre-migration backup step**
3. **Keep emergency backups for at least 7 days**
4. **Document all recovery procedures**
5. **Monitor the system closely after recovery**
6. **Update this guide with lessons learned**

---

## Appendix: Backup File Naming Convention

### Daily Backups
```
smart_ecommerce_dev_daily_YYYYMMDD_HHMMSS.sql.gz
Example: smart_ecommerce_dev_daily_20260119_020030.sql.gz
```

### Weekly Backups
```
smart_ecommerce_dev_weekly_YYYYMMDD.sql.gz
Example: smart_ecommerce_dev_weekly_20260119.sql.gz
```

### Monthly Backups
```
smart_ecommerce_dev_monthly_YYYYMM.sql.gz
Example: smart_ecommerce_dev_monthly_202601.sql.gz
```

### Migration Backups
```
migration_name_YYYYMMDD_HHMMSS.sql.gz
Example: add_user_roles_20260119_143022.sql.gz
```

### Emergency Backups
```
smart_ecommerce_dev_emergency_YYYYMMDD_HHMMSS.sql.gz
Example: smart_ecommerce_dev_emergency_20260119_150045.sql.gz
```

---

**Last Updated**: 2026-01-19
**Version**: 1.0
**Maintained By**: Database Administration Team
