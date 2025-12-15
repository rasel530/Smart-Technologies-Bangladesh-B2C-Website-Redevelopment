# Use official Node.js runtime as a parent image
FROM node:20-alpine AS base

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json package-lock.json* pnpm-lock.yaml* ./

# Install OpenSSL and dependencies for Prisma
RUN apk add --no-cache --update && \
    apk add --no-cache openssl openssl-dev && \
    ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so && \
    ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so

# Install dependencies
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    echo "No lockfile found, proceeding with npm install..." && \
    npm install; \
  fi

# Copy Prisma schema
COPY prisma ./prisma/

# Copy rest of application code
COPY . .

# Generate Prisma client with explicit database URL and force platform
RUN DATABASE_URL="postgresql://smart_dev:smart_dev_password_2024@postgres:5432/smart_ecommerce_dev" npx prisma generate --no-engine

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package.json for production
COPY package*.json ./

# Install OpenSSL and dependencies for production
RUN apk add --no-cache openssl openssl-dev && \
    ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so && \
    ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so

# Install only production dependencies
RUN npm install --production

# Copy built application from base stage
COPY --from=base /app/dist ./dist/

# Copy Prisma schema
COPY --from=base /app/prisma ./prisma/

# Generate Prisma client in production stage with engine
RUN DATABASE_URL="postgresql://smart_dev:smart_dev_password_2024@postgres:5432/smart_ecommerce_dev" npx prisma generate

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of app directory to nestjs user
RUN chown -R nestjs:nodejs /app

# Expose port app runs on
EXPOSE 3001

# Switch to non-root user
USER nestjs

# Define command to run the application
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"]