#!/bin/bash

# Docker Container Startup Script
# This script ensures database migrations are applied before the application starts

set -e  # Exit on error

echo "=========================================="
echo "  Backend Container Startup"
echo "=========================================="
echo ""

# Wait for database to be ready
echo "🔄 Waiting for database connection..."
until PGPASSWORD=$DATABASE_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c '\q' 2>/dev/null; do
  echo "  Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is ready!"
echo ""

# Run comprehensive migration
echo "🔄 Running database migrations..."
node scripts/comprehensive-migration-solution.js

# Check if migration was successful
if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ Migrations failed!"
  echo "Container will not start to prevent running with incomplete schema"
  exit 1
fi

echo ""
echo "=========================================="
echo "  Starting Application"
echo "=========================================="
echo ""

# Start the application
exec npm run dev
