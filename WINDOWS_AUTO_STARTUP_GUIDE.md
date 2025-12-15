# Windows Automatic Startup Guide
## Smart Technologies Bangladesh B2C Website

This guide provides comprehensive instructions for setting up automatic startup of Docker Desktop, Ollama, Qdrant, and other development services when you turn on your computer.

## Overview

The automatic startup system includes:
- **Docker Desktop** - Container platform
- **Ollama** - AI/ML model service
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
| `scripts/windows/startup-services.bat` | Main startup script |
| `scripts/windows/install-startup.bat` | Installation script |
| `scripts/windows/stop-services.bat` | Service stop script |
| `scripts/windows/service-status.bat` | Status checker script |

## Installation Steps

### 1. Prerequisites

Ensure the following are installed:
- **Docker Desktop** - Download from [docker.com](https://www.docker.com/products/docker-desktop)
- **Ollama** - Download from [ollama.ai](https://ollama.ai/download)
- **Git** - Required for some operations

### 2. Install Automatic Startup

1. **Run as Administrator**:
   - Right-click on `scripts/windows/install-startup.bat`
   - Select "Run as administrator"

2. **What the installer does**:
   - Creates startup shortcut in Windows startup folder
   - Creates Task Scheduler entry as backup method
   - Creates desktop shortcut for manual control

### 3. Verify Installation

After installation, you should see:
- Desktop shortcut: "SmartTech-Services"
- Startup folder entry
- Task Scheduler entry named "SmartTech-Services"

## Usage

### Automatic Startup
Services will start automatically when you log into Windows.

### Manual Control

#### Start Services
- Double-click the desktop shortcut "SmartTech-Services"
- Or run `scripts/windows/startup-services.bat`

#### Stop Services
- Run `scripts/windows/stop-services.bat`

#### Check Status
- Run `scripts/windows/service-status.bat`
- This shows detailed status of all services

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

### Common Issues

#### 1. Docker Desktop Not Starting
- Ensure Docker Desktop is installed correctly
- Check Windows Subsystem for Linux (WSL2) is enabled
- Run Docker Desktop manually first to complete initial setup

#### 2. Ollama Service Issues
- Verify Ollama is installed and in system PATH
- Check if Ollama is already running: `tasklist | find "ollama.exe"`

#### 3. Port Conflicts
- Use the status checker to identify port conflicts
- Modify `docker-compose.yml` if you need different ports

#### 4. Permission Issues
- Ensure scripts run with appropriate permissions
- Check Windows Defender/Firewall settings

### Debug Mode

To debug startup issues:
1. Open Command Prompt as Administrator
2. Navigate to project directory
3. Run `scripts/windows/startup-services.bat` manually
4. Check error messages

### Logs and Monitoring

- Docker Desktop: System tray → Dashboard
- Docker Compose: `docker-compose logs -f`
- Ollama: `ollama logs` (if available)

## Advanced Configuration

### Customizing Startup Order

Edit `scripts/windows/startup-services.bat` to modify:
- Wait times between services
- Service startup order
- Additional services

### Environment Variables

Create `.env` file in project root with:
```bash
FRONTEND_PORT=3000
BACKEND_PORT=3001
REDIS_PORT=6379
QDRANT_PORT=6333
QDRANT_GRPC_PORT=6334
REDIS_PASSWORD=redis_smarttech_2024
```

### Resource Management

To limit resource usage:
1. Open Docker Desktop settings
2. Go to Resources → Advanced
3. Adjust memory and CPU limits
4. Consider using `restart: unless-stopped` in docker-compose.yml

## Security Considerations

- Services run with your user privileges
- Database passwords are stored in docker-compose.yml
- Consider using environment variables for sensitive data
- Regularly update Docker images and dependencies

## Performance Optimization

### Startup Time Reduction
- Use SSD storage for better I/O performance
- Allocate sufficient RAM to Docker Desktop
- Consider using `restart: unless-stopped` instead of `always`

### Resource Monitoring
- Use the status checker script regularly
- Monitor Docker Desktop resource usage
- Set up alerts for high resource consumption

## Removal

To remove automatic startup:

1. **Delete startup shortcut**:
   ```
   del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SmartTech-Services.lnk"
   ```

2. **Remove Task Scheduler entry**:
   ```
   schtasks /delete /tn "SmartTech-Services" /f
   ```

3. **Delete desktop shortcut** (optional)

## Support

For issues:
1. Check this guide first
2. Run the status checker script
3. Review individual service logs
4. Consult service-specific documentation

## Version History

- v1.0 - Initial setup with Docker Desktop, Ollama, and Docker Compose services
- Includes comprehensive monitoring and control scripts
- Windows-specific optimizations and error handling