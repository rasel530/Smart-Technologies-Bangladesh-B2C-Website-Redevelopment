# Database Migration System Documentation

## Overview
This document outlines the database migration system for Smart Technologies Bangladesh B2C E-Commerce Platform using Prisma ORM with PostgreSQL.

## Migration Setup

### Prisma Configuration
- **Database Provider**: PostgreSQL 15+
- **Connection String**: Configured via `DATABASE_URL` environment variable
- **Schema File**: `prisma/schema.prisma`
- **Migration Directory**: `prisma/migrations/`
- **Lock File**: `prisma/migrations/migration_lock.toml`

### Migration Scripts
Available npm scripts for migration management:
```json
{
  "prisma:generate": "prisma generate",
  "prisma:push": "prisma db push",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio",
  "prisma:seed": "tsx prisma/seed.ts"
}
```

## Migration Workflow

### Development Workflow
1. **Schema Changes**: Modify `prisma/schema.prisma`
2. **Generate Migration**: Run `npm run prisma:migrate` to create migration files
3. **Review Migration**: Check generated SQL in `prisma/migrations/`
4. **Apply Migration**: Migration is automatically applied to development database
5. **Generate Types**: Prisma Client types are automatically regenerated

### Production Workflow
1. **Backup Database**: Create full database backup before migration
2. **Apply Migration**: Use `prisma migrate deploy` for production
3. **Verify Migration**: Check all tables and data integrity
4. **Update Application**: Restart application with new schema

## Current Migration Status

### Applied Migrations
- **Migration ID**: `20251214100515_init_schema`
- **Status**: ✅ Successfully Applied
- **Database**: PostgreSQL `smart_ecommerce_dev`
- **Tables Created**: 15 tables with proper relationships and constraints

### Migration Files Structure
```
prisma/migrations/
├── migration_lock.toml
└── 20251214100515_init_schema/
    └── migration.sql
```

## Seed Data System

### Seed Script Location
- **File**: `prisma/seed.ts`
- **Execution**: `npm run prisma:seed`

### Seed Data Categories
1. **Categories**: Electronics, Clothing, Home Appliances
2. **Brands**: Samsung, Apple
3. **Products**: Sample smartphones and laptops
4. **Users**: Admin and customer accounts
5. **Addresses**: Sample shipping and billing addresses
6. **Coupons**: Welcome discount and fixed amount coupons

### Seed Data Features
- **Idempotent Operations**: Uses `upsert` to handle existing data gracefully
- **Bangladesh-Specific**: Includes all 8 divisions and proper address structure
- **Error Handling**: Comprehensive try-catch blocks with proper logging
- **Type Safety**: Full TypeScript integration with Prisma types

## Rollback Procedures

### Reset Database
```bash
# Complete database reset (development only)
npm run prisma:migrate -- --reset --force
```

### Rollback to Previous Migration
```bash
# View migration history
npx prisma migrate status

# Rollback to specific migration (if needed)
npx prisma migrate reset --to <migration-name>
```

### Backup Strategies
1. **Pre-Migration Backup**: Always create database backup before major changes
2. **Migration File Backup**: Version control all migration files
3. **Data Backup**: Export critical data before destructive operations

## Environment Configuration

### Development Environment
- **Database**: `smart_ecommerce_dev`
- **Host**: `localhost:5432`
- **User**: `smart_dev`
- **Connection**: PostgreSQL via Docker Compose

### Production Environment
- **Database**: Configured via `DATABASE_URL`
- **SSL**: Required for production connections
- **Connection Pooling**: Configured for performance

## Troubleshooting

### Common Issues
1. **Migration Conflicts**: Resolve schema conflicts before applying
2. **Connection Issues**: Verify database connectivity
3. **Permission Errors**: Ensure proper database permissions
4. **Type Generation**: Run `prisma generate` after schema changes

### Debug Commands
```bash
# Check migration status
npx prisma migrate status

# Validate schema
npx prisma validate

# View database
npx prisma studio
```

## Best Practices

### Migration Development
1. **Descriptive Names**: Use clear, timestamped migration names
2. **Atomic Changes**: Each migration should be a single logical unit
3. **Backward Compatible**: Avoid breaking changes when possible
4. **Test Thoroughly**: Test migrations on staging before production

### Data Seeding
1. **Environment-Specific**: Different seeds for dev/staging/prod
2. **Incremental**: Design seeds to be runnable multiple times
3. **Validation**: Include data validation in seed scripts
4. **Performance**: Use batch operations for large datasets

## Security Considerations

### Database Security
- **Connection Encryption**: Use SSL in production
- **Access Control**: Limit database user permissions
- **Audit Logging**: Track all schema changes

### Migration Security
- **Review Changes**: Always review generated SQL
- **Test Rollbacks**: Verify rollback procedures work
- **Backup Verification**: Ensure backups are restorable

## Performance Optimization

### Migration Performance
- **Batch Operations**: Use transactions for multiple changes
- **Index Management**: Add indexes for query performance
- **Connection Pooling**: Configure appropriate pool sizes

### Database Performance
- **Query Analysis**: Use `EXPLAIN` for slow queries
- **Regular Maintenance**: Schedule regular database maintenance
- **Monitoring**: Set up database performance monitoring

## Version Control

### Migration Files
- **Git Tracking**: All migration files under version control
- **Change Documentation**: Document schema changes in commit messages
- **Branch Strategy**: Separate branches for major schema changes

### Schema Evolution
- **Backward Compatibility**: Maintain API compatibility
- **Deprecation Warnings**: Mark deprecated fields before removal
- **Migration Planning**: Plan multi-step schema changes

## Contact and Support

### Documentation Issues
- **Repository**: Check project repository for migration issues
- **Prisma Docs**: https://www.prisma.io/docs/
- **Database Admin**: Contact database administrator for production issues

### Emergency Procedures
- **Rollback Plan**: Have documented rollback procedures
- **Backup Contacts**: Know who to contact for data recovery
- **Service Downtime**: Plan for maintenance windows

---

**Last Updated**: December 15, 2024  
**Version**: 1.0  
**Status**: Production Ready  
**Next Review**: January 15, 2025