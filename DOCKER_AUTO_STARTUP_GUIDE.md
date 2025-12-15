# Docker Desktop Auto-Startup Guide
## Smart Technologies Bangladesh B2C Website

This comprehensive guide provides step-by-step instructions for setting up automatic startup of Docker Desktop containers when your PC starts.

## Overview

The automatic startup system includes:
- **Docker Desktop** - Container platform
- **Docker Compose Services**:
  - PostgreSQL (port 5432)
  - Redis (port 6379)
  - Elasticsearch (port 9200)
  - Qdrant (port 6333)
  - PgAdmin (port 5050)
  - Backend API (port 3001)
  - Frontend (port 3000)

## Files Created

| File | Purpose |
|------|---------|
| `scripts/windows/startup-services-enhanced.bat` | Enhanced startup script with error handling |
| `scripts/windows/docker-desktop-autostart.bat` | Docker Desktop auto-start configuration |
| `scripts/windows/health-monitor-working.bat` | Comprehensive health monitoring script |
| `scripts/windows/health-monitor-simple.bat` | Simple health monitoring script |
| `scripts/windows/install-startup.bat` | Installation script |
| `scripts/windows/stop-services.bat` | Service stop script |
| `scripts/windows/service-status.bat` | Status checker script |

## Quick Start (Recommended)

For most users, the quick installation method is recommended:

### Step 1: Install Auto-Startup
1. **Right-click** on `scripts\windows\install-startup.bat`
2. **Select "Run as administrator"**
3. **Follow the on-screen instructions**

This will automatically:
- Configure Docker Desktop to start with Windows
- Create Task Scheduler entry
- Create startup folder shortcut
- Create desktop shortcut for manual control

### Step 2: Test the Installation
1. **Restart your computer** or **log out and log back in**
2. Services should start automatically
3. If issues occur, run the desktop shortcut: "SmartTech-Services"

## Manual Installation (Advanced)

If you prefer manual configuration, follow these steps:

### Step 1: Configure Docker Desktop Auto-Start
1. **Open Docker Desktop**
2. Go to **Settings** → **General**
3. **Enable "Start Docker Desktop when you log in"**
4. **Apply** changes

### Step 2: Create Windows Task Scheduler Entry
1. Open **Task Scheduler** (search in Start menu)
2. Click **"Create Task"** in the right panel
3. Set the following:
   - **Name**: `SmartTech-Services`
   - **Trigger**: `At log on`
   - **Action**: `Start a program`
   - **Program/script**: `[path to project]\scripts\windows\startup-services-enhanced.bat`
   - **Start in**: `[project directory]`
4. **Check** "Run with highest privileges"

### Step 3: Create Startup Folder Shortcut
1. Press **Win + R**
2. Type: `shell:startup`
3. Press **Enter**
4. Create shortcut:
   - **Target**: `[path to project]\scripts\windows\startup-services-enhanced.bat`
   - **Start in**: `[project directory]`
   - **Name**: `SmartTech-Services`

## Service Management

### Starting Services Manually
```batch
# Double-click this file or run from command line
scripts\windows\startup-services-enhanced.bat
```

### Stopping Services Manually
```batch
# Run this to stop all services gracefully
scripts\windows\stop-services.bat
```

### Checking Service Status
```batch
# Quick status check
scripts\windows\service-status.bat

# Comprehensive health monitoring
scripts\windows\health-monitor-simple.bat
```

### Viewing Logs
```batch
# View real-time logs for all services
docker-compose logs -f
```

### Restarting Specific Services
```batch
# Restart a specific service (replace 'servicename')
docker-compose restart servicename
```

## Service Access URLs

Once services are running, you can access:

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:3001 | - |
| PgAdmin | http://localhost:5050 | Email: admin@smarttech.com, Password: admin123 |
| Elasticsearch | http://localhost:9200 | - |
| Qdrant | http://localhost:6333 | - |

## Troubleshooting

### Common Issues and Solutions

#### Docker Desktop Not Starting
**Problem**: Docker Desktop doesn't start automatically
**Solutions**:
1. Check if Docker Desktop is installed correctly
2. Verify Windows Subsystem for Linux (WSL2) is enabled
3. Run Docker Desktop manually once to complete initial setup
4. Check Windows Event Viewer for Docker errors

#### Services Not Starting
**Problem**: Docker containers fail to start
**Solutions**:
1. Run `scripts\windows\startup-services-enhanced.bat` manually to see error messages
2. Check Docker Desktop is running: `docker version`
3. Verify `docker-compose.yml` exists in project root
4. Check for port conflicts with other applications

#### Port Conflicts
**Problem**: Services show "not listening" on their ports
**Solutions**:
1. Check if other applications are using ports 3000, 3001, 5432, 6379, 9200, 6333, 5050
2. Use `netstat -an | find ":port"` to identify conflicting applications
3. Stop conflicting applications or change ports in `docker-compose.yml`

#### High Memory Usage
**Problem**: System runs slowly after startup
**Solutions**:
1. Check Docker Desktop memory allocation in Settings → Resources
2. Monitor system resources with Task Manager
3. Consider increasing system RAM or closing unused applications

#### Build Failures
**Problem**: Backend/Frontend containers fail to build
**Solutions**:
1. Check Node.js version compatibility
2. Verify all dependencies in `package.json`
3. Clear Docker cache: `docker system prune -f`
4. Rebuild containers: `docker-compose up --build`

## Advanced Configuration

### Custom Environment Variables
Create `.env` file in project root for custom configuration:

```bash
# Service Ports
FRONTEND_PORT=3000
BACKEND_PORT=3001
REDIS_PORT=6379
QDRANT_PORT=6333
QDRANT_GRPC_PORT=6334

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=smart_dev
DB_PASSWORD=your_secure_password
DB_NAME=smart_ecommerce_dev

# Redis Configuration
REDIS_PASSWORD=your_redis_password
REDIS_MAXMEMORY=512mb
REDIS_MAXCLIENTS=10000

# Elasticsearch Configuration
ELASTICSEARCH_NODE=http://elasticsearch:9200

# Application Configuration
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key
```

### Resource Limits
In `docker-compose.yml`, you can add resource constraints:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
```

## Security Considerations

### Database Security
- Change default passwords in production
- Use environment variables instead of hardcoded credentials
- Enable SSL/TLS for external connections
- Regular security updates for all images

### Network Security
- Use Docker networks to isolate services
- Configure firewall rules for required ports only
- Avoid exposing database ports to external networks

## Performance Optimization

### Startup Time Reduction
- Use SSD storage for better I/O performance
- Allocate sufficient RAM to Docker Desktop (4GB+ recommended)
- Consider using `restart: unless-stopped` in docker-compose.yml
- Enable Docker Desktop's "Start on login" feature

### Resource Monitoring
- Regularly check Docker Desktop resource usage
- Monitor container health with built-in health checks
- Set up alerts for high resource usage
- Use `docker stats` for real-time monitoring

## Maintenance

### Regular Updates
1. **Update Docker Desktop** regularly through the application
2. **Update base images**: `docker-compose pull`
3. **Update application**: Pull latest code and rebuild
4. **Security patches**: Apply security updates promptly

### Backup Strategy
1. **Database backups**: Regular PostgreSQL dumps
2. **Configuration backups**: Version control for docker-compose.yml
3. **Data backups**: Important user-generated content
4. **Application logs**: Rotate and archive log files

## Removal

### Disabling Auto-Startup
If you need to disable automatic startup:

1. **Task Scheduler**:
   ```cmd
   schtasks /delete /tn "SmartTech-Services" /f
   ```

2. **Startup Folder**:
   ```cmd
   del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SmartTech-Services.lnk"
   ```

3. **Docker Desktop Settings**:
   - Open Docker Desktop
   - Go to Settings → General
   - Uncheck "Start Docker Desktop when you log in"

## Support

### Getting Help
For issues not covered in this guide:
1. Check the log files in the `logs/` directory
2. Review Docker Desktop logs in the application
3. Consult the troubleshooting section above
4. Check the GitHub repository for known issues

### Community Resources
- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose Documentation**: https://docs.docker.com/compose/
- **Windows Task Scheduler**: https://docs.microsoft.com/en-us/windows/desktop/task-scheduler/

---

## Quick Reference Commands

```batch
# Start all services
scripts\windows\startup-services-enhanced.bat

# Stop all services
scripts\windows\stop-services.bat

# Check service status
scripts\windows\service-status.bat

# Health monitoring
scripts\windows\health-monitor-simple.bat
```

---

**Version**: 1.0  
**Last Updated**: December 14, 2025  
**Compatible with**: Windows 10/11, Docker Desktop 4.0+

This guide ensures your Smart Technologies Bangladesh B2C website development environment starts automatically and reliably every time you turn on your PC.