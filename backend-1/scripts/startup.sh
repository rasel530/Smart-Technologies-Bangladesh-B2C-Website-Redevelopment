#!/bin/bash

echo "🚀 Starting Smart Technologies B2C Backend Server..."
echo "📋 Environment: $NODE_ENV"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check database connection
echo "🗄️ Checking database connection..."
npx prisma db push --skip-generate

# Run database migrations if in production
if [ "$NODE_ENV" = "production" ]; then
    echo "🔄 Running database migrations..."
    npx prisma migrate deploy
fi

# Build the application
echo "🏗️ Building application..."
npm run build

# Start the application
echo "🌟 Starting application..."
if [ "$NODE_ENV" = "production" ]; then
    npm run start:prod
else
    npm run start:dev
fi