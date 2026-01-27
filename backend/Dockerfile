# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy Prisma schema
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for Prisma generate)
RUN npm ci && \
  apk add --no-cache openssl curl

# Generate Prisma client
RUN npx prisma generate

# Remove dev dependencies to keep production image small
RUN npm prune --production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Start the application
CMD ["node", "index.js"]