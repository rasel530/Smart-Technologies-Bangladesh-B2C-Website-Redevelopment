# PostgreSQL Setup with Docker Compose

This document provides instructions for setting up PostgreSQL 15+ and pgAdmin using Docker Compose for the Smart Technologies Bangladesh B2C Website project.

## Prerequisites

- Docker Desktop installed and running on Windows
- Git Bash or Windows Terminal with Docker support

## Quick Start

1. **Start the services:**
   ```bash
   cd "D:\Smart Technologies Bangladesh B2C Website Redevelopment"
   docker-compose up -d
   ```

2. **Check the services are running:**
   ```bash
   docker-compose ps
   ```

3. **Access pgAdmin:**
   - URL: http://localhost:5050
   - Email: admin@smarttech.com
   - Password: admin123

4. **Connect to PostgreSQL directly:**
   - Host: localhost
   - Port: 5432
   - Database: smarttech_db
   - Username: smarttech_user
   - Password: smarttech_password_2024

## Service Details

### PostgreSQL
- **Version:** PostgreSQL 15 Alpine
- **Container Name:** smarttech_postgres
- **Port:** 5432 (mapped to host)
- **Database:** smarttech_db
- **User:** smarttech_user
- **Password:** smarttech_password_2024
- **Data Volume:** postgres_data (persistent storage)

### pgAdmin
- **Version:** Latest
- **Container Name:** smarttech_pgadmin
- **Port:** 5050 (mapped to host)
- **Default Email:** admin@smarttech.com
- **Default Password:** admin123
- **Data Volume:** pgadmin_data (persistent storage)

## Environment Variables

All configuration is managed through the `.env` file:

```bash
# PostgreSQL Configuration
POSTGRES_DB=smarttech_db
POSTGRES_USER=smarttech_user
POSTGRES_PASSWORD=smarttech_password_2024
POSTGRES_PORT=5432

# pgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@smarttech.com
PGADMIN_DEFAULT_PASSWORD=admin123
PGADMIN_PORT=5050
```

## Database Initialization

The database is automatically initialized with:
- UUID extension for generating unique identifiers
- pg_trgm extension for text search capabilities
- Proper privileges for the main user
- Initialization logging

Additional SQL scripts can be added to the `postgresql/init/` directory and will be executed on container startup.

## Useful Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# PostgreSQL logs
docker-compose logs postgres

# pgAdmin logs
docker-compose logs pgadmin

# All logs
docker-compose logs
```

### Access PostgreSQL container
```bash
docker-compose exec postgres psql -U smarttech_user -d smarttech_db
```

### Reset database (WARNING: This deletes all data)
```bash
docker-compose down -v
docker-compose up -d
```

## Backup and Restore

### Backup database
```bash
docker-compose exec postgres pg_dump -U smarttech_user smarttech_db > backup.sql
```

### Restore database
```bash
docker-compose exec -T postgres psql -U smarttech_user smarttech_db < backup.sql
```

## Development Workflow

1. Make changes to your application
2. Use pgAdmin at http://localhost:5050 to manage the database
3. Connect your application to `localhost:5432` with the credentials above
4. Use the initialization scripts for any database schema changes

## Security Notes

- Change default passwords in production
- Use environment-specific `.env` files
- Consider using Docker secrets for sensitive data
- Enable SSL connections in production

## Troubleshooting

### Port conflicts
If ports 5432 or 5050 are already in use, modify them in `docker-compose.yml`

### Permission issues
Ensure Docker Desktop has proper permissions on Windows

### Connection issues
Check if both containers are running: `docker-compose ps`
Verify network connectivity between containers