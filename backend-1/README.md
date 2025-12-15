# Smart Technologies Bangladesh B2C Backend

A production-ready NestJS backend API for Smart Technologies Bangladesh B2C E-Commerce platform.

## Features

- ✅ **Authentication & Authorization**: JWT-based auth with refresh tokens
- ✅ **Database Integration**: PostgreSQL with Prisma ORM
- ✅ **Logging System**: Winston with structured logging
- ✅ **Health Checks**: Comprehensive health monitoring
- ✅ **Security**: Helmet, CORS, Rate Limiting, Compression
- ✅ **API Documentation**: Swagger/OpenAPI 3.0
- ✅ **Error Handling**: Global exception filters
- ✅ **Graceful Shutdown**: Proper cleanup and recovery
- ✅ **Environment Configuration**: Flexible config management

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Application
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=smart_dev
DB_PASSWORD=smart_dev_password_2024
DB_NAME=smart_ecommerce_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_smarttech_2024
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=logs/app.log
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14

# Monitoring
MONITORING_ENABLED=true
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=30000

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-here

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=elastic_password
```

## Quick Start

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Initialize backend
cd backend
chmod +x scripts/startup.sh
./scripts/startup.sh
```

### Manual Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   ```

3. **Start Development Server**
   ```bash
   npm run start:dev
   ```

4. **Start Production Server**
   ```bash
   npm run build
   npm run start:prod
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/profile` - Get user profile (protected)

### Health Checks
- `GET /api/health` - Basic health status
- `GET /api/health/detailed` - Detailed system information
- `GET /api/health/readiness` - Kubernetes readiness probe
- `GET /api/health/liveness` - Kubernetes liveness probe

### Documentation
- Swagger UI: `http://localhost:3001/api/docs`
- OpenAPI JSON: `http://localhost:3001/api/docs-json`

## Monitoring & Logging

### Health Endpoints
- **Basic Health**: Returns service status, uptime, memory usage
- **Detailed Health**: Includes CPU, memory, database status
- **Kubernetes Probes**: Readiness and liveness endpoints

### Logging
- **Structured JSON**: All logs in JSON format with timestamps
- **Log Rotation**: Automatic rotation based on size and count
- **Error Tracking**: Separate error log file
- **Development**: Colored console output

### Metrics
- **Custom Metrics**: Available on port 9090 (when enabled)
- **Health Monitoring**: Configurable check intervals
- **Performance Tracking**: Memory and CPU usage

## Security Features

- **Helmet**: Security headers and CSP
- **CORS**: Configurable origin policies
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Compression**: Gzip compression with intelligent filtering
- **Input Validation**: Global validation pipes with whitelisting
- **JWT Security**: Secure token handling with expiration

## Database Features

- **Connection Pooling**: Configurable connection limits
- **Retry Logic**: Exponential backoff for failed operations
- **Health Monitoring**: Real-time connection status
- **Migrations**: Automatic schema management
- **Seed Data**: Sample data generation

## Development Workflow

1. **Code Changes**: Make changes to source code
2. **Type Checking**: TypeScript compilation checks
3. **Testing**: Run unit and integration tests
4. **Building**: Compile to JavaScript
5. **Deployment**: Use Docker or manual deployment

## Production Deployment

### Docker Deployment
```bash
# Build production image
docker build -t smarttech-backend .

# Run with production settings
docker run -p 3001:3001 --env-file .env smarttech-backend
```

### Manual Deployment
```bash
# Set production environment
export NODE_ENV=production

# Build application
npm run build

# Start with PM2 (recommended)
pm2 start dist/main.js --name "smarttech-backend"

# Or run directly
npm run start:prod
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in .env
   - Verify PostgreSQL is running
   - Check network connectivity

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Verify refresh token flow

3. **Port Already in Use**
   - Check if another process is using port 3001
   - Kill existing process: `lsof -ti:3001 | xargs kill -9`

4. **Memory Issues**
   - Monitor with health endpoints
   - Check log files for memory leaks
   - Adjust connection pool size

### Health Check Responses

#### Healthy Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": "45 minutes",
  "memory": {
    "used": "256 MB",
    "total": "512 MB"
  },
  "database": {
    "status": "connected"
  }
}
```

#### Unhealthy Response
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "error": "Database connection failed"
}
```

## Architecture

```
┌─────────────────┐
│   Client      │
├─────────────────┤
│   API Gateway  │
├─────────────────┤
│   Load Balancer│
├─────────────────┤
│   Backend      │
│  ┌─────────┐  │
│  │Auth     │  │
│  │Health   │  │
│  │Products │  │
│  │Orders   │  │
│  └─────────┘  │
│  ┌─────────┐  │
│  │Database │  │
│  │Redis    │  │
│  │Search    │  │
│  └─────────┘  │
└─────────────────┘
```

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation for API changes
4. Use semantic versioning for releases

## License

© 2024 Smart Technologies Bangladesh. All rights reserved.