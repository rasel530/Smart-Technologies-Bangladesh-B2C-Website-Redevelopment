# Windows Startup Scripts

This directory contains Windows batch scripts for managing the automatic startup of Smart Technologies Bangladesh B2C Website development services.

## Available Scripts

### 🚀 `startup-services.bat`
**Main startup script that starts all services:**
- Docker Desktop
- Ollama service
- Docker Compose services (PostgreSQL, Redis, Elasticsearch, Qdrant, PgAdmin, Backend, Frontend)

**Usage:**
```bash
# Run manually
startup-services.bat

# Or double-click the file
```

### 📦 `install-startup.bat`
**Installation script that sets up automatic startup:**
- Creates startup folder shortcut
- Sets up Task Scheduler entry
- Creates desktop shortcut for manual control

**Usage:**
```bash
# Run as Administrator
install-startup.bat
```

### 🛑 `stop-services.bat`
**Stops all running services gracefully:**
- Docker Compose services
- Ollama service
- Provides option to stop Docker Desktop

**Usage:**
```bash
stop-services.bat
```

### 📊 `service-status.bat`
**Checks and displays status of all services:**
- Docker Desktop status
- Docker Compose container status
- Ollama service status
- Port availability check
- System resource usage
- Service access URLs

**Usage:**
```bash
service-status.bat
```

### 📊 `service-status-minimal.bat`
**Simplified status checker (recommended for use):**
- Docker Desktop status
- Docker Compose container status
- Ollama service status
- Service access URLs

**Usage:**
```bash
service-status-minimal.bat
```

### 🗑️ `uninstall-startup.bat`
**Removes automatic startup configuration:**
- Removes startup folder shortcut
- Deletes Task Scheduler entry
- Removes desktop shortcut

**Usage:**
```bash
# Run as Administrator
uninstall-startup.bat
```

## Quick Start

### 1. First Time Setup
1. Ensure Docker Desktop and Ollama are installed
2. Right-click `install-startup.bat` → "Run as administrator"
3. Reboot your computer to test automatic startup

### 2. Manual Control
- **Start services**: Double-click desktop shortcut or run `startup-services.bat`
- **Check status**: Run `service-status.bat`
- **Stop services**: Run `stop-services.bat`

### 3. Remove Auto-Startup
- Run `uninstall-startup.bat` as administrator

## Service Ports

| Service | Port | Access URL |
|---------|------|------------|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| Elasticsearch | 9200 | http://localhost:9200 |
| Qdrant | 6333 | http://localhost:6333 |
| PgAdmin | 5050 | http://localhost:5050 |

## Troubleshooting

### Common Issues

1. **"Access Denied" errors**
   - Run scripts as Administrator
   - Check Windows User Account Control (UAC) settings

2. **Docker Desktop not starting**
   - Ensure Docker Desktop is installed correctly
   - Check WSL2 is enabled in Windows Features
   - Run Docker Desktop manually first to complete setup

3. **Port conflicts**
   - Use `service-status.bat` to identify conflicts
   - Stop other applications using the same ports
   - Modify ports in `docker-compose.yml` if needed

4. **Services not starting automatically**
   - Check Task Scheduler: `schtasks /query /tn "SmartTech-Services"`
   - Verify startup folder shortcut exists
   - Check Windows Event Viewer for errors

### Debug Mode

To debug startup issues:
1. Open Command Prompt as Administrator
2. Navigate to project root
3. Run `scripts\windows\startup-services.bat` manually
4. Observe error messages and output

### Log Locations

- **Docker Desktop**: System tray → Dashboard → Logs
- **Docker Compose**: `docker-compose logs -f` in project directory
- **Windows Event Viewer**: Windows Logs → Application

## Advanced Usage

### Custom Startup Order
Edit `startup-services.bat` to modify:
- Wait times between services
- Service startup sequence
- Add custom services

### Environment Configuration
Create `.env` file in project root:
```bash
FRONTEND_PORT=3000
BACKEND_PORT=3001
REDIS_PORT=6379
QDRANT_PORT=6333
REDIS_PASSWORD=your_redis_password
```

### Resource Management
- Configure Docker Desktop memory limits
- Monitor system resources with `service-status.bat`
- Adjust container restart policies in `docker-compose.yml`

## Security Notes

- Scripts run with user privileges
- Database credentials stored in `docker-compose.yml`
- Consider using environment variables for sensitive data
- Regularly update Docker images and dependencies

## Support

For additional help:
1. Check `WINDOWS_AUTO_STARTUP_GUIDE.md` for detailed documentation
2. Run `service-status.bat` to diagnose issues
3. Review individual service logs
4. Consult service-specific documentation