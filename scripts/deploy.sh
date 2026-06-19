#!/bin/bash
# Exit on error
set -e

echo "=== Production Deployment Prep ==="

# 1. Run migrations using the direct database URL
echo "Running database migrations..."
npx prisma migrate deploy

# 2. Build the Next.js production bundle
echo "Compiling production build..."
npm run build

echo "=== Deployment Prep Complete ==="
