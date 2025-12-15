# Smart Technologies Bangladesh B2C Website Redevelopment

A modern, scalable e-commerce platform built with Next.js 14 and NestJS for Smart Technologies Bangladesh Ltd.

## 🏗️ Project Structure

This is a monorepo containing:

- **frontend/** - Next.js 14 frontend application with TypeScript and Tailwind CSS
- **backend/** - Node.js backend API with TypeScript
- **shared/** - Shared types and utilities
- **doc/** - Project documentation and requirements
- **infrastructure/** - Docker configurations and deployment scripts

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ with pnpm
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+
- Elasticsearch 8.11+

### Development Setup

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd "Smart Technologies Bangladesh B2C Website Redevelopment"
   ```

2. **Start infrastructure services:**
   ```bash
   docker-compose up -d
   ```

3. **Install dependencies:**
   ```bash
   # Frontend
   cd frontend
   pnpm install
   
   # Backend
   cd ../backend
   pnpm install
   
   # Shared
   cd ../shared
   pnpm install
   ```

4. **Start development servers:**
   ```bash
   # Frontend (port 3000)
   cd frontend
   pnpm dev
   
   # Backend (port 3001)
   cd backend
   pnpm start:dev
   ```

## 📋 Available Scripts

### Frontend
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

### Backend
- `pnpm start:dev` - Start development server with hot reload
- `pnpm build` - Build application
- `pnpm start:prod` - Start production server
- `pnpm test` - Run unit tests
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm lint` - Run ESLint

## 🏛️ Architecture

### Technology Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript, PostgreSQL, Redis
- **Search:** Elasticsearch
- **Containerization:** Docker, Docker Compose
- **Package Management:** pnpm

### Services

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Documentation:** http://localhost:3001/api/docs
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379
- **Elasticsearch:** http://localhost:9200
- **pgAdmin:** http://localhost:5050

## 📚 Documentation

- [Phase 1 Development Roadmap](./doc/roadmap/phase_1/phase_1_development_roadmap.md)
- [System Requirements Specification](./doc/SRS/)
- [User Requirements Document](./doc/URD/)
- [Technology Stack](./doc/technology_stack/)

## 🔧 Environment Variables

Create a `.env` file in the project root:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=smart_dev
DB_PASSWORD=smart_dev_password_2024
DB_NAME=smart_ecommerce_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_smarttech_2024

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Frontend
FRONTEND_URL=http://localhost:3000

# Backend
PORT=3001

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
```

## 🐳 Docker Development

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
pnpm test
```

### Backend Tests
```bash
cd backend
pnpm test
pnpm test:e2e
```

## 📦 Deployment

### Production Build
```bash
# Frontend
cd frontend
pnpm build

# Backend
cd backend
pnpm build
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary to Smart Technologies Bangladesh Ltd.

## 📞 Support

For support and questions, please contact the development team at:
- Email: project-team@smarttechnologies.bd
- Internal: Project management system

---

**Smart Technologies Bangladesh Ltd.**  
*Premier Technology Solutions Provider*
