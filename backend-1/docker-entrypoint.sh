#!/bin/sh

echo "🚀 Starting Smart Technologies B2C Backend Container..."
echo "📋 Environment: $NODE_ENV"

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
while ! nc -z postgres 5432 -w 1; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "✅ Database is ready!"

# Check if node_modules exists, if not, install dependencies
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

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