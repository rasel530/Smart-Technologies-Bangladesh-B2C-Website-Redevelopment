# Use Node.js 20 LTS as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy Prisma schema
COPY prisma ./prisma/

# Install build dependencies for sharp and other native modules
RUN apk add --no-cache openssl curl \
  vips-dev \
  pkgconfig \
  gcc \
  g++ \
  make \
  python3

# Install all dependencies (including dev dependencies for Prisma generate)
# Ensure sharp is properly compiled
RUN npm ci --build-from-source=sharp

# Remove build dependencies to keep image small
RUN apk del gcc g++ make python3

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

# Create upload directories with proper permissions
RUN mkdir -p /app/uploads/{categories,products,brands,profile-pictures} && \
  chown -R nodejs:nodejs /app/uploads

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Start the application
CMD ["node", "index.js"]