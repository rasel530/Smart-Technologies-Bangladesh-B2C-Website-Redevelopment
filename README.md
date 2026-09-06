# Smart Technologies Bangladesh B2C Website — Redevelopment

Redevelopment codebase for the Smart Technologies Bangladesh Ltd. B2C e-commerce website: a full-stack TypeScript monorepo with a Next.js storefront and a Node.js API backend.

## Repository Layout

| Path | Contents |
|------|----------|
| `frontend/` | Next.js 14 application (React 18, TypeScript, Tailwind CSS) |
| `backend/` | Node.js API — Express 5, Prisma ORM, JWT authentication |
| `shared/` | Shared types and utilities |
| `elasticsearch/` | Elasticsearch configuration |
| `plans/` | Planning and roadmap documents |
| `scripts/` | Helper scripts |
| `docker-compose.yml` | Local development infrastructure |

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 · React 18 · TypeScript · Tailwind CSS · NextAuth |
| Backend | Node.js · Express 5 · Prisma ORM · JWT (access + refresh tokens) |
| Database | PostgreSQL |
| Cache / Sessions | Redis |
| Development infrastructure | Elasticsearch, Qdrant, Ollama, pgAdmin (Docker Compose services) |
| Containerization | Docker / Docker Compose |

> Earlier revisions described the backend as NestJS; the backend is a plain Node.js Express application.

## What the Codebase Includes

- **Authentication & account management** — email/password registration and login, JWT sessions with refresh tokens, email verification, phone OTP (Twilio), and Google/Facebook social-auth configuration.
- **Profile & account features** — profile management, profile pictures, Bangladesh address management, account preferences and settings.
- **Frontend auth flows** — NextAuth-based login flow wired to the backend API.
- **API hardening** — helmet security headers, CORS, request validation (express-validator), upload constraints, and auth rate limiting.

These features were built incrementally and documented in milestone reports throughout the repository history. The repository also contains the accumulated diagnostic scripts, SQL tests, and work reports from active development; the application itself lives under `frontend/` and `backend/`.

## Requirements

- Node.js 20+
- pnpm >= 8 (frontend) and npm (backend)
- Docker and Docker Compose (for PostgreSQL, Redis, Elasticsearch, and friends)

## Getting Started

### 1. Start the infrastructure

```bash
docker compose up -d
```

This starts the services defined in `docker-compose.yml` (PostgreSQL, Redis, Elasticsearch, Qdrant, Ollama, pgAdmin, plus the app containers if enabled).

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
npm install
```

Open `.env` and set at least `DATABASE_URL` to point at your PostgreSQL instance, then prepare the schema:

```bash
npm run db:push     # or: npm run db:migrate
npm run db:seed     # optional sample data
```

Start the API:

```bash
npm run dev
```

The API listens on `PORT` (default 3001). Swagger API documentation is served under `/api/docs` when enabled.

### 3. Configure and run the frontend

```bash
cd ../frontend
cp .env.example .env
pnpm install
pnpm dev
```

Set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_BACKEND_API_URL` in `frontend/.env` to match your backend.

The storefront runs at [http://localhost:3000](http://localhost:3000).

## Available Scripts

### Backend (`backend/package.json`)

- `npm run dev` — start the API with hot reload (nodemon)
- `npm start` — start the API
- `npm run db:migrate` / `db:push` / `db:deploy` / `db:seed` — Prisma schema and seeding commands
- `npm test` — run tests

### Frontend (`frontend/package.json`)

- `pnpm dev` — start the development server
- `pnpm build` — production build
- `pnpm start` — start the production server
- `pnpm lint` — run ESLint
- `pnpm type-check` — TypeScript type checking
- `pnpm test` — run tests

## Environment Variables

Both applications ship with documented `.env.example` files:

- `backend/.env.example` — database URL, Redis, JWT secrets/expiry, SMTP, Twilio, Google/Facebook OAuth, upload and logging settings.
- `frontend/.env.example` — NextAuth secret/URL, backend API URL, and feature toggles.

Copy the relevant file to `.env` and replace the values with credentials for your own environment (database, JWT, Twilio, OAuth providers, SMTP, and so on). Keep real secrets out of version control.

## License

Proprietary — Smart Technologies Bangladesh Ltd. All rights reserved.
