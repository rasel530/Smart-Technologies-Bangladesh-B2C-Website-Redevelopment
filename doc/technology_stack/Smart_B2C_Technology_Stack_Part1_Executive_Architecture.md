# Smart Technologies B2C E-Commerce Platform
## Comprehensive Technology Stack Specification
### Part 1: Executive Summary & Core Architecture

**Document Version:** 2.0  
**Date:** November 29, 2024  
**Project:** Smart Technologies Bangladesh B2C E-Commerce Website  
**Prepared For:** Smart Technologies (BD) Ltd.  
**Prepared By:** Enterprise Solutions Department

---

## Table of Contents - Part 1

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack Overview](#2-technology-stack-overview)
3. [Architecture Decisions & Rationale](#3-architecture-decisions--rationale)
4. [Core System Architecture](#4-core-system-architecture)
5. [Development Environment Requirements](#5-development-environment-requirements)

---

# 1. Executive Summary

## 1.1 Document Purpose

This comprehensive technology stack specification provides detailed technical guidance for implementing the Smart Technologies B2C e-commerce platform. It addresses the specific requirements outlined in the Software Requirements Specification (SRS) and User Requirements Document (URD), ensuring 100% compliance with all functional and non-functional requirements.

## 1.2 Project Context

**Business Overview:**
- **Company:** Smart Technologies (Bangladesh) Ltd.
- **Established:** 1998
- **Annual Revenue:** BDT 1,500+ Crore
- **Employees:** 200+
- **Distribution Network:** 64 districts
- **Product Portfolio:** 100+ brands, 10,000+ SKUs

**Project Scope:**
- Redevelop existing basic website (smart-bd.com) into full-featured B2C e-commerce platform
- Timeline: 12 months development and deployment
- Budget: BDT 15-20 Crore
- Expected ROI: 400% over 36 months

**Strategic Objectives:**
1. Capture direct-to-consumer market (90M+ internet users in Bangladesh)
2. Compete effectively with Daraz, Chaldal, and other e-commerce platforms
3. Build direct customer relationships and brand loyalty
4. Enable data-driven marketing and personalization
5. Achieve Year 1 target: 50,000+ users, BDT 50 Crore revenue

## 1.3 Technology Stack Selection Criteria

The technology stack has been selected based on:

1. **Performance Requirements:**
   - Sub-2-second page loads (desktop)
   - Sub-3-second page loads (mobile)
   - Support for 10,000+ concurrent users
   - Handle 50,000+ peak concurrent users

2. **Scalability Requirements:**
   - Horizontal scaling capability
   - Support for 50,000+ SKUs
   - 500,000+ registered users capacity
   - 1,000,000+ orders per year

3. **Bangladesh-Specific Needs:**
   - Mobile-first design (70%+ mobile traffic)
   - Local payment gateways (bKash, Nagad, SSLCommerz)
   - Bengali language support
   - Low-bandwidth optimization

4. **Integration Requirements:**
   - Seamless ERP integration (UniERP Odoo 13)
   - Payment gateway APIs
   - SMS/Email services
   - Logistics provider APIs

5. **Development Environment:**
   - Local development on Linux desktop
   - VS Code IDE compatibility
   - Own cloud server deployment

6. **Cost Efficiency:**
   - Open-source technologies preferred
   - No licensing costs
   - Efficient resource utilization

---

# 2. Technology Stack Overview

## 2.1 Complete Stack At-a-Glance

### Frontend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Next.js | 14.0.4+ | React framework with SSR/SSG/ISR |
| **UI Library** | React | 18.2+ | Component-based UI development |
| **Language** | TypeScript | 5.3+ | Type-safe JavaScript development |
| **CSS Framework** | Tailwind CSS | 3.4+ | Utility-first CSS framework |
| **Component Library** | shadcn/ui | Latest | Pre-built accessible components |
| **UI Components** | Radix UI | Latest | Headless UI primitives |
| **Icons** | Lucide React | Latest | Modern icon system |
| **Forms** | React Hook Form | 7.48+ | Performant form handling |
| **Validation** | Zod | 3.22+ | TypeScript-first schema validation |
| **State Management** | Zustand | 4.4+ | Lightweight state management |
| **Server State** | TanStack Query | 5.0+ | Data fetching & caching |
| **Animations** | Framer Motion | 10.16+ | Production-ready animations |
| **HTTP Client** | Axios | 1.6+ | Promise-based HTTP client |

### Backend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 20 LTS | JavaScript runtime environment |
| **Framework** | NestJS | 10.0+ | Enterprise Node.js framework |
| **Language** | TypeScript | 5.3+ | Type-safe backend development |
| **API Style** | RESTful | - | API architecture pattern |
| **API Documentation** | Swagger/OpenAPI | 3.0 | Auto-generated API docs |
| **Authentication** | Passport.js | 0.7+ | Authentication middleware |
| **JWT** | @nestjs/jwt | 10.2+ | JWT token management |
| **Password Hashing** | bcrypt | 5.1+ | Secure password hashing |
| **Validation** | class-validator | 0.14+ | DTO validation |
| **Transformation** | class-transformer | 0.5+ | Object transformation |

### Database & Data Layer

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Primary Database** | PostgreSQL | 15.0+ | Relational database (ACID) |
| **ORM** | Prisma | 5.7+ | Type-safe database client |
| **Caching** | Redis | 7.2+ | In-memory caching layer |
| **Cache Client** | ioredis | 5.3+ | Node.js Redis client |
| **Search Engine** | Elasticsearch | 8.11+ | Full-text search & analytics |
| **Search Client** | @elastic/elasticsearch | 8.11+ | Elasticsearch Node.js client |
| **File Storage** | MinIO | Latest | S3-compatible object storage |

### DevOps & Infrastructure

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **OS (Development)** | Ubuntu | 22.04 LTS | Local development environment |
| **OS (Production)** | Ubuntu Server | 22.04 LTS | Production server OS |
| **Container Platform** | Docker | 24.0+ | Containerization |
| **Container Orchestration** | Docker Compose | 2.23+ | Multi-container orchestration |
| **Web Server** | Nginx | 1.24+ | Reverse proxy & load balancer |
| **Process Manager** | PM2 | 5.3+ | Node.js process management |
| **Version Control** | Git | 2.40+ | Source code management |
| **Repository Platform** | GitHub/GitLab | - | Code hosting & CI/CD |
| **CI/CD** | GitHub Actions | - | Automated deployment pipeline |

### Monitoring & Logging

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Application Monitoring** | PM2 Monitoring | Built-in | Process & app monitoring |
| **Log Management** | Winston | 3.11+ | Structured logging |
| **Log Aggregation** | Loki + Grafana | Latest | Log collection & visualization |
| **Metrics** | Prometheus | Latest | Time-series metrics database |
| **Visualization** | Grafana | Latest | Metrics & logs dashboards |
| **Error Tracking** | Sentry (Optional) | Latest | Error monitoring & tracking |
| **Uptime Monitoring** | UptimeRobot | - | External uptime monitoring |

### Security Tools

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **SSL/TLS** | Let's Encrypt | - | Free SSL certificates |
| **Firewall** | UFW | - | Uncomplicated Firewall |
| **DDoS Protection** | Cloudflare | - | CDN & DDoS mitigation |
| **WAF** | Cloudflare WAF | - | Web Application Firewall |
| **Security Scanning** | OWASP ZAP | Latest | Vulnerability scanning |
| **Dependency Scanning** | Snyk | Latest | Dependency vulnerability checks |

### Testing Tools

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Unit Testing** | Jest | 29.7+ | JavaScript testing framework |
| **E2E Testing** | Playwright | 1.40+ | End-to-end testing |
| **API Testing** | Supertest | 6.3+ | HTTP assertion library |
| **Load Testing** | K6 | Latest | Load & performance testing |
| **Code Coverage** | Istanbul/nyc | Latest | Code coverage reporting |

## 2.2 Technology Stack Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Desktop    │  │   Tablet     │  │    Mobile    │           │
│  │   Browser    │  │   Browser    │  │   Browser    │           │
│  │              │  │              │  │              │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
┌──────────────────────────┬─┴─┬──────────────────────────────────┐
│                   CLOUDFLARE CDN                                 │
│              (DDoS Protection, WAF, SSL)                         │
└──────────────────────────┬───┬──────────────────────────────────┘
                           │   │
┌──────────────────────────┴───┴──────────────────────────────────┐
│                    FRONTEND LAYER                                │
│              ┌──────────────────────────┐                        │
│              │      Next.js 14+         │                        │
│              │      React 18+           │                        │
│              │      TypeScript 5.3+     │                        │
│              │      Tailwind CSS 3.4+   │                        │
│              └──────────┬───────────────┘                        │
│                         │ API Calls                              │
└─────────────────────────┼────────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────────┐
│                    NGINX REVERSE PROXY                           │
│              (Load Balancer, SSL Termination)                    │
└─────────────────────────┼────────────────────────────────────────┘
                          │
┌─────────────────────────┴────────────────────────────────────────┐
│                    BACKEND LAYER (API)                           │
│              ┌──────────────────────────┐                        │
│              │      NestJS 10+          │                        │
│              │      Node.js 20 LTS      │                        │
│              │      TypeScript 5.3+     │                        │
│              │      Prisma ORM 5.7+     │                        │
│              └──────┬────────┬──────────┘                        │
└─────────────────────┼────────┼──────────────────────────────────┘
                      │        │
        ┌─────────────┘        └─────────────┐
        │                                     │
┌───────┴──────────┐              ┌──────────┴───────────┐
│  DATABASE LAYER  │              │   CACHE & SEARCH     │
│                  │              │                      │
│  PostgreSQL 15+  │              │  Redis 7.2+          │
│                  │              │  Elasticsearch 8.11+ │
│  ┌────────────┐  │              │                      │
│  │   Prisma   │  │              │                      │
│  │    ORM     │  │              │                      │
│  └────────────┘  │              │                      │
└──────────────────┘              └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   INTEGRATION LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  UniERP  │  │ Payment  │  │ Courier  │  │  SMS/    │        │
│  │  (Odoo)  │  │ Gateways │  │   APIs   │  │  Email   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   MONITORING LAYER                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │    PM2   │  │Prometheus│  │  Grafana │  │   Loki   │        │
│  │ Monitor  │  │          │  │          │  │          │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

# 3. Architecture Decisions & Rationale

## 3.1 Frontend Architecture: Next.js 14+ with App Router

### Decision: Next.js over Alternative Frameworks

**Considered Alternatives:**
- Create React App (CRA)
- Gatsby
- Remix
- Vue.js/Nuxt.js
- Angular

**Why Next.js Won:**

1. **Superior SEO Performance (Critical for E-Commerce)**
   - Server-Side Rendering (SSR) for dynamic content
   - Static Site Generation (SSG) for static pages
   - Incremental Static Regeneration (ISR) for product pages
   - **Result:** Google can index all products immediately, improving organic traffic

2. **Performance Out-of-the-Box**
   - Automatic code splitting (smaller bundles)
   - Image optimization (`next/image` component)
   - Font optimization
   - Lazy loading of components
   - **Result:** Achieves sub-2-second page loads required by SRS

3. **Developer Experience**
   - File-based routing (intuitive, less code)
   - Fast Refresh (instant feedback during development)
   - TypeScript support built-in
   - API routes for backend-for-frontend pattern
   - **Result:** Faster development, fewer bugs

4. **Production-Ready Features**
   - Built-in production optimizations
   - Edge functions support
   - Middleware for request processing
   - Built-in analytics
   - **Result:** Production-ready without extensive configuration

5. **App Router (Next.js 13+)**
   - React Server Components (smaller bundle sizes)
   - Streaming rendering (faster perceived performance)
   - Improved data fetching
   - Better layouts and nested routing
   - **Result:** Future-proof architecture

**Alignment with SRS Requirements:**
- ✅ Mobile-first responsive design
- ✅ SEO-friendly (SSR/SSG)
- ✅ High performance (<2s page loads)
- ✅ Scalability (10,000+ concurrent users)
- ✅ Easy to maintain (clean code structure)

## 3.2 Backend Architecture: Node.js with NestJS

### Decision: NestJS over Alternative Frameworks

**Considered Alternatives:**
- Express.js (raw)
- Fastify
- Koa.js
- Django (Python)
- Laravel (PHP)
- Spring Boot (Java)

**Why NestJS Won:**

1. **JavaScript/TypeScript Full-Stack Consistency**
   - Same language (TypeScript) for frontend and backend
   - Shared types and interfaces
   - Code reuse between layers
   - **Result:** Developer efficiency, fewer context switches

2. **Enterprise-Grade Architecture**
   - Modular structure (scalable codebase)
   - Dependency injection (testable code)
   - Built-in design patterns (clean architecture)
   - **Result:** Maintainable, scalable codebase

3. **Excellent Async I/O Performance**
   - Node.js event loop (handles many concurrent connections)
   - Perfect for I/O-heavy e-commerce operations
   - Non-blocking operations
   - **Result:** Can handle 10,000+ concurrent users requirement

4. **Rich Built-in Features**
   - Authentication/Authorization (Passport.js integration)
   - Validation (class-validator)
   - Caching
   - Rate limiting
   - Swagger documentation (auto-generated)
   - **Result:** Less time building infrastructure, more time on features

5. **TypeScript First**
   - Type safety throughout the codebase
   - Better IDE support (autocomplete, refactoring)
   - Catches errors at compile time
   - **Result:** Fewer runtime errors, better code quality

6. **Testing Support**
   - Built-in testing utilities
   - Easy mocking and dependency injection
   - Unit and E2E testing support
   - **Result:** High test coverage, confident deployments

**Alignment with SRS Requirements:**
- ✅ RESTful API architecture
- ✅ Secure authentication/authorization
- ✅ High performance (<500ms API response times)
- ✅ Scalable (horizontal scaling)
- ✅ Well-documented APIs (Swagger)

## 3.3 Database Architecture: PostgreSQL 15+

### Decision: PostgreSQL over Alternative Databases

**Considered Alternatives:**
- MySQL
- MongoDB
- MariaDB
- MS SQL Server
- Oracle Database

**Why PostgreSQL Won:**

1. **ACID Compliance (Critical for E-Commerce)**
   - Atomicity, Consistency, Isolation, Durability
   - Ensures data integrity for orders and payments
   - Prevents data corruption
   - **Result:** Reliable transaction processing

2. **Advanced Features for E-Commerce**
   - JSONB support (flexible product attributes)
   - Full-text search (basic search without Elasticsearch)
   - Array types (tags, categories)
   - Range types (price ranges)
   - **Result:** Rich data modeling capabilities

3. **Performance at Scale**
   - Efficient query optimizer
   - Partitioning support (for large tables like orders)
   - Parallel query execution
   - **Result:** Fast queries even with millions of records

4. **Open Source & Cost-Effective**
   - No licensing fees (vs. Oracle, MS SQL)
   - Large community support
   - Enterprise features without enterprise cost
   - **Result:** Cost savings, vendor independence

5. **Replication & High Availability**
   - Streaming replication (read replicas)
   - Point-in-time recovery
   - Logical replication
   - **Result:** 99.9% uptime target achievable

6. **Extension Ecosystem**
   - pg_trgm (fuzzy text search)
   - PostGIS (if needed for location features)
   - pgcrypto (encryption)
   - **Result:** Extensible platform

**Alignment with SRS Requirements:**
- ✅ Data integrity (ACID)
- ✅ Support for 500,000+ users
- ✅ Handle 1M+ orders per year
- ✅ Fast queries (<100ms)
- ✅ Reliable backups

## 3.4 Caching Strategy: Redis 7+

### Decision: Redis for Caching Layer

**Why Redis:**

1. **Sub-millisecond Response Times**
   - In-memory data store
   - Perfect for session storage, product catalog cache
   - **Result:** Dramatically faster page loads

2. **Rich Data Structures**
   - Strings, Hashes, Lists, Sets, Sorted Sets
   - Perfect for shopping cart, wishlists, real-time features
   - **Result:** Flexible caching strategies

3. **Persistence Options**
   - RDB snapshots
   - AOF (Append-Only File)
   - **Result:** Cache survives server restarts

4. **Pub/Sub for Real-Time Features**
   - Stock updates
   - Order notifications
   - **Result:** Real-time user experience

5. **Industry Standard**
   - Proven at scale (used by Twitter, GitHub, Stack Overflow)
   - Large community
   - **Result:** Reliable, well-documented

**Alignment with SRS Requirements:**
- ✅ Page load time <2 seconds
- ✅ Handle 10,000+ concurrent users
- ✅ Real-time features (order updates)

## 3.5 Search Engine: Elasticsearch 8+

### Decision: Elasticsearch for Product Search

**Why Elasticsearch over Database Full-Text Search:**

1. **Superior Search Capabilities**
   - Typo-tolerant search (fuzzy matching)
   - Autocomplete/suggestions
   - Multi-field search (name, description, specifications)
   - **Result:** Better user search experience

2. **Faceted Search**
   - Dynamic filters (brand, price, category)
   - Aggregations for filter counts
   - **Result:** Rich filtering experience

3. **Performance at Scale**
   - Optimized for search workloads
   - Handles 10,000+ SKUs efficiently
   - **Result:** Fast search even with large catalog

4. **Relevance Tuning**
   - Configurable scoring
   - Boosting fields (exact name matches rank higher)
   - **Result:** Relevant search results

5. **Analytics Capabilities**
   - Search analytics (popular queries)
   - Click-through tracking
   - **Result:** Business insights

**Alignment with SRS Requirements:**
- ✅ Advanced search & filtering
- ✅ Autocomplete
- ✅ Search response time <300ms
- ✅ Support for 50,000+ products

## 3.6 Development Environment: Linux (Ubuntu 22.04)

### Decision: Linux for Development

**Why Linux (Ubuntu 22.04 LTS):**

1. **Production Parity**
   - Production servers run Ubuntu Server
   - Develop in same environment as production
   - **Result:** Fewer "works on my machine" issues

2. **Superior Development Tools**
   - Native Docker support
   - Better terminal/CLI tools
   - Package management (apt)
   - **Result:** Efficient development workflow

3. **Open Source Ecosystem**
   - All tools are free
   - Large community
   - **Result:** Cost savings, community support

4. **Performance**
   - Less resource overhead than Windows
   - Better for running multiple services (PostgreSQL, Redis, Elasticsearch)
   - **Result:** Faster development machine

5. **VS Code Integration**
   - Excellent VS Code support on Linux
   - Remote development features
   - **Result:** Professional development experience

**Alignment with Requirements:**
- ✅ As specified: Linux OS, VS Code, local servers
- ✅ Production parity
- ✅ Cost-effective

---

# 4. Core System Architecture

## 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Next.js Frontend App                        │  │
│  │                                                            │  │
│  │  • Server Components (RSC)                                │  │
│  │  • Client Components (Interactive)                        │  │
│  │  • API Routes (BFF Pattern)                               │  │
│  │  • Static Pages (SSG)                                     │  │
│  │  • Dynamic Pages (SSR/ISR)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTP/HTTPS
┌───────────────────────────┴──────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Nginx Reverse Proxy                      │  │
│  │                                                            │  │
│  │  • SSL Termination                                        │  │
│  │  • Load Balancing                                         │  │
│  │  • Request Routing                                        │  │
│  │  • Rate Limiting                                          │  │
│  │  • Static File Serving                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               NestJS Backend Application                  │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   Products   │  │    Orders    │  │    Users     │   │  │
│  │  │    Module    │  │    Module    │  │   Module     │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │    Cart      │  │  Payments    │  │     Auth     │   │  │
│  │  │   Module     │  │    Module    │  │   Module     │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   Search     │  │Notifications │  │  Analytics   │   │  │
│  │  │   Module     │  │    Module    │  │   Module     │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────┬────────┬───────────┬──────────────┬───────────┬─────────┘
        │        │           │              │           │
┌───────┴────┐ ┌─┴─────┐ ┌──┴──────┐ ┌────┴─────┐ ┌───┴────────┐
│            │ │       │ │         │ │          │ │            │
│ PostgreSQL │ │ Redis │ │Elastic- │ │  MinIO   │ │ External   │
│   (DB)     │ │(Cache)│ │ search  │ │ (Files)  │ │   APIs     │
│            │ │       │ │ (Search)│ │          │ │            │
└────────────┘ └───────┘ └─────────┘ └──────────┘ └────────────┘
```

## 4.2 Detailed Component Architecture

### Frontend Architecture (Next.js App Router)

```
smart-ecommerce-frontend/
├── app/
│   ├── (marketing)/              # Marketing pages group
│   │   ├── page.tsx              # Homepage
│   │   ├── about/
│   │   │   └── page.tsx          # About page
│   │   ├── contact/
│   │   │   └── page.tsx          # Contact page
│   │   └── layout.tsx            # Marketing layout
│   │
│   ├── (shop)/                   # Shopping pages group
│   │   ├── products/
│   │   │   ├── page.tsx          # Product listing
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx      # Product details
│   │   │   └── loading.tsx       # Loading state
│   │   │
│   │   ├── categories/
│   │   │   └── [category]/
│   │   │       └── page.tsx      # Category page
│   │   │
│   │   ├── brands/
│   │   │   └── [brand]/
│   │   │       └── page.tsx      # Brand page
│   │   │
│   │   ├── cart/
│   │   │   └── page.tsx          # Shopping cart
│   │   │
│   │   ├── checkout/
│   │   │   ├── page.tsx          # Checkout flow
│   │   │   ├── shipping/
│   │   │   ├── payment/
│   │   │   └── confirmation/
│   │   │
│   │   └── layout.tsx            # Shop layout
│   │
│   ├── (account)/                # User account group
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── register/
│   │   │   └── page.tsx          # Registration
│   │   ├── profile/
│   │   │   └── page.tsx          # User profile
│   │   ├── orders/
│   │   │   ├── page.tsx          # Order history
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Order details
│   │   │
│   │   └── layout.tsx            # Account layout
│   │
│   ├── api/                      # API routes (BFF pattern)
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth endpoints
│   │   ├── products/
│   │   │   └── route.ts          # Product API proxy
│   │   └── cart/
│   │       └── route.ts          # Cart API proxy
│   │
│   ├── layout.tsx                # Root layout
│   ├── error.tsx                 # Error boundary
│   ├── not-found.tsx             # 404 page
│   └── loading.tsx               # Root loading
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   │
│   ├── product/                  # Product components
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductDetail.tsx
│   │   └── ProductFilter.tsx
│   │
│   └── cart/                     # Cart components
│       ├── CartItem.tsx
│       ├── CartSummary.tsx
│       └── MiniCart.tsx
│
├── lib/
│   ├── api/                      # API clients
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   └── auth.ts
│   │
│   ├── hooks/                    # Custom hooks
│   │   ├── useCart.ts
│   │   ├── useAuth.ts
│   │   └── useProducts.ts
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── cartStore.ts
│   │   └── authStore.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── helpers.ts
│   │
│   └── types/                    # TypeScript types
│       ├── product.ts
│       ├── order.ts
│       └── user.ts
│
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── styles/
    └── globals.css               # Global styles (Tailwind)
```

### Backend Architecture (NestJS Modules)

```
smart-ecommerce-backend/
├── src/
│   ├── main.ts                   # Application entry point
│   │
│   ├── app.module.ts             # Root module
│   │
│   ├── common/                   # Shared utilities
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── middlewares/
│   │
│   ├── config/                   # Configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── elasticsearch.config.ts
│   │   └── app.config.ts
│   │
│   ├── modules/
│   │   ├── auth/                 # Authentication module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   │
│   │   ├── users/                # Users module
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── products/             # Products module
│   │   │   ├── products.module.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── product.entity.ts
│   │   │   │   ├── category.entity.ts
│   │   │   │   └── brand.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-product.dto.ts
│   │   │       └── update-product.dto.ts
│   │   │
│   │   ├── orders/               # Orders module
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── order.entity.ts
│   │   │   │   └── order-item.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-order.dto.ts
│   │   │       └── update-order.dto.ts
│   │   │
│   │   ├── cart/                 # Shopping cart module
│   │   │   ├── cart.module.ts
│   │   │   ├── cart.controller.ts
│   │   │   └── cart.service.ts
│   │   │
│   │   ├── payments/             # Payment processing module
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   └── gateways/
│   │   │       ├── sslcommerz.service.ts
│   │   │       ├── bkash.service.ts
│   │   │       └── nagad.service.ts
│   │   │
│   │   ├── search/               # Search module (Elasticsearch)
│   │   │   ├── search.module.ts
│   │   │   ├── search.controller.ts
│   │   │   └── search.service.ts
│   │   │
│   │   ├── notifications/        # Notifications module
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── email/
│   │   │   │   └── email.service.ts
│   │   │   └── sms/
│   │   │       └── sms.service.ts
│   │   │
│   │   └── integrations/         # External integrations
│   │       ├── erp/
│   │       │   └── erp.service.ts    # UniERP integration
│   │       └── logistics/
│   │           └── courier.service.ts
│   │
│   └── prisma/
│       ├── schema.prisma         # Prisma schema
│       └── migrations/           # Database migrations
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── package.json
```

## 4.3 Data Flow Architecture

### Request Flow: User Browses Product

```
1. User Request
   └─> Browser (http://smart-bd.com/products/laptop-hp-15)

2. DNS Resolution
   └─> Cloudflare DNS

3. CDN Layer
   └─> Cloudflare CDN (cache check)
       ├─> Cache HIT: Return cached HTML
       └─> Cache MISS: Forward to origin

4. Load Balancer
   └─> Nginx (SSL termination, routing)

5. Frontend Server (Next.js)
   └─> SSR/ISR (Server-Side Rendering or Incremental Static Regeneration)
       └─> Fetch data from Backend API

6. Backend API (NestJS)
   └─> Products Controller
       └─> Products Service
           ├─> Check Redis Cache
           │   ├─> Cache HIT: Return cached data
           │   └─> Cache MISS: Query database
           │
           └─> PostgreSQL (via Prisma ORM)
               └─> SELECT product WHERE slug = 'laptop-hp-15'

7. Response Assembly
   └─> NestJS formats JSON response
       └─> Next.js renders HTML
           └─> Nginx adds headers
               └─> Cloudflare caches response
                   └─> Browser receives HTML

8. Browser Rendering
   └─> Parse HTML
       └─> Load CSS (Tailwind)
           └─> Execute JavaScript (React hydration)
               └─> Interactive page ready
```

### Request Flow: User Adds to Cart

```
1. User Action
   └─> Clicks "Add to Cart" button

2. Frontend (React)
   └─> Event Handler
       └─> Call API: POST /api/cart/add
           └─> Include: productId, quantity, userId/sessionId

3. Next.js API Route (BFF)
   └─> Validate request
       └─> Forward to Backend: POST /api/v1/cart/add

4. Backend API (NestJS)
   └─> Cart Controller
       └─> @UseGuards(JwtAuthGuard) // Auth check
           └─> Cart Service
               └─> Add item to cart
                   ├─> If user logged in:
                   │   └─> PostgreSQL: INSERT/UPDATE cart_items
                   │
                   └─> If guest user:
                       └─> Redis: HSET session:cart:xyz {...}

5. Response
   └─> Return updated cart: { items: [...], total: 1500 }
       └─> Frontend updates UI
           └─> Cart icon badge updates
               └─> Success toast notification
```

### Request Flow: User Completes Checkout

```
1. User submits order
   └─> POST /api/checkout

2. Backend Order Processing
   └─> Begin Transaction (PostgreSQL)
       ├─> Create Order record
       ├─> Create Order Items records
       ├─> Reserve inventory (UPDATE products SET stock = stock - qty)
       ├─> Clear cart
       └─> COMMIT transaction

3. Payment Processing
   └─> If payment method = bKash:
       └─> Call bKash API
           └─> Create payment session
               └─> Return payment URL

4. Redirect User
   └─> Redirect to bKash payment page

5. Payment Callback
   └─> bKash calls webhook: POST /api/payments/bkash/callback
       └─> Verify payment signature
           └─> If payment successful:
               ├─> Update order status: PAID
               ├─> Send confirmation email
               ├─> Send confirmation SMS
               ├─> Sync order to ERP (UniERP)
               └─> Redirect user to success page
           └─> If payment failed:
               ├─> Update order status: FAILED
               ├─> Release inventory
               └─> Redirect user to failure page
```

---

# 5. Development Environment Requirements

## 5.1 Hardware Requirements

### Minimum Specifications (Development Machine)

**CPU:**
- Processor: 4-core Intel Core i5 or AMD Ryzen 5 (or better)
- Recommended: 6-core or 8-core for running multiple services

**RAM:**
- Minimum: 16GB
- Recommended: 32GB
- Required for: Running PostgreSQL, Redis, Elasticsearch, Node.js, and browser simultaneously

**Storage:**
- Type: SSD (NVMe recommended)
- Capacity: 100GB free space minimum
- Required for: Code, databases, node_modules, Docker images

**Network:**
- Broadband internet connection
- Minimum: 10 Mbps download/upload
- Required for: Package downloads, API testing, cloud deployments

## 5.2 Software Requirements

### Operating System

**Required: Linux Ubuntu 22.04 LTS (Jammy Jellyfish)**

**Why Ubuntu 22.04 LTS:**
- Long-term support until April 2027
- Production server will run Ubuntu Server 22.04
- Stable, well-documented
- Large community support

**Installation:**
```bash
# Download Ubuntu 22.04 LTS from:
# https://ubuntu.com/download/desktop

# Verify installation
lsb_release -a
# Output should show: Ubuntu 22.04.x LTS
```

### Development Tools

**Required Tools:**

1. **Git (Version Control)**
```bash
sudo apt update
sudo apt install git -y

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@smart-bd.com"

# Verify
git --version  # Should show: git version 2.34+
```

2. **VS Code (IDE)**
```bash
# Download from: https://code.visualstudio.com/
# Or install via snap:
sudo snap install --classic code

# Verify
code --version
```

**Required VS Code Extensions:**
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **TypeScript and JavaScript** (ms-vscode.vscode-typescript-next)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **Prisma** (Prisma.prisma)
- **GitLens** (eamodio.gitlens)
- **REST Client** (humao.rest-client)
- **Docker** (ms-azuretools.vscode-docker)

3. **Node.js 20 LTS**
```bash
# Using NVM (Node Version Manager) - RECOMMENDED
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

# Restart terminal or run:
source ~/.bashrc

# Install Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show: v20.x.x
npm --version   # Should show: 10.x.x
```

4. **pnpm (Package Manager)**
```bash
npm install -g pnpm

# Verify
pnpm --version  # Should show: 8.x.x
```

5. **Docker (Containerization)**
```bash
# Install Docker
sudo apt install docker.io -y

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (avoid sudo)
sudo usermod -aG docker $USER

# Logout and login again, then verify
docker --version  # Should show: Docker version 24.x.x
docker run hello-world  # Should run successfully
```

6. **Docker Compose**
```bash
# Install Docker Compose
sudo apt install docker-compose -y

# Verify
docker-compose --version  # Should show: docker-compose version 1.29+
```

## 5.3 Local Development Servers

### PostgreSQL 15+ (Local Database)

**Installation:**
```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update and install
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15 -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
sudo -u postgres psql --version  # Should show: psql (PostgreSQL) 15.x
```

**Setup Development Database:**
```bash
# Switch to postgres user
sudo -u postgres psql

# In psql shell:
CREATE DATABASE smart_ecommerce;
CREATE USER smart_user WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE smart_ecommerce TO smart_user;
\q

# Test connection
psql -U smart_user -d smart_ecommerce -h localhost
```

### Redis 7+ (Local Cache)

**Installation:**
```bash
# Add Redis repository
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

# Install Redis
sudo apt update
sudo apt install redis -y

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli --version  # Should show: redis-cli 7.x.x
redis-cli ping  # Should return: PONG
```

### Elasticsearch 8+ (Optional for Local Dev)

**Installation:**
```bash
# Download and install Elasticsearch
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-8.x.list

sudo apt update
sudo apt install elasticsearch -y

# Start Elasticsearch
sudo systemctl start elasticsearch
sudo systemctl enable elasticsearch

# Verify (wait 30 seconds for startup)
curl http://localhost:9200
# Should return JSON with cluster info
```

**Note:** Elasticsearch is resource-intensive. For local development, it's optional. You can use PostgreSQL full-text search or skip search features initially.

## 5.4 VS Code Workspace Configuration

**Create `.vscode/settings.json` in project root:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

## 5.5 Development Environment Checklist

**Pre-Development Setup Checklist:**

- [ ] Ubuntu 22.04 LTS installed
- [ ] Git installed and configured
- [ ] VS Code installed with all required extensions
- [ ] Node.js 20 LTS installed (via NVM)
- [ ] pnpm installed globally
- [ ] Docker installed and user added to docker group
- [ ] Docker Compose installed
- [ ] PostgreSQL 15+ installed and running
- [ ] Development database created (`smart_ecommerce`)
- [ ] Redis 7+ installed and running
- [ ] Elasticsearch 8+ installed (optional)
- [ ] Internet connection verified
- [ ] GitHub/GitLab account created
- [ ] SSH keys generated and added to GitHub/GitLab

**Verification Script:**
```bash
#!/bin/bash
echo "=== Development Environment Check ==="
echo ""
echo "OS: $(lsb_release -d | cut -f2)"
echo "Git: $(git --version)"
echo "Node.js: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"
echo "PostgreSQL: $(psql --version | head -n1)"
echo "Redis: $(redis-cli --version)"
echo ""
echo "=== Service Status ==="
systemctl is-active postgresql
systemctl is-active redis-server
echo ""
echo "=== All checks complete ==="
```

---

**End of Part 1**

**Continue to Part 2 for:**
- Detailed Frontend Stack (Next.js, React, TypeScript, Tailwind CSS)
- UI Component Libraries
- State Management
- Form Handling
- API Integration
