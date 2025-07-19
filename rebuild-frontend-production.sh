#!/bin/bash

# Force Rebuild Frontend with Production Environment
# This script completely rebuilds the frontend with production settings

set -e  # Exit on any error

echo "🔨 Force Rebuilding Frontend with Production Environment..."

# Navigate to frontend directory
cd frontend

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .env.local
rm -rf .env.production

# Copy production environment
echo "📋 Setting up production environment..."
cp ../frontend/env.production .env.production

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build with production environment
echo "🔨 Building with production environment..."
NODE_ENV=production npm run build

# Verify the build
echo "✅ Verifying build..."
if [ -d ".next" ]; then
    echo "✅ Build successful! Production files created."
else
    echo "❌ Build failed!"
    exit 1
fi

# Go back to root
cd ..

echo "🎉 Frontend rebuild completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Deploy with Docker: docker-compose -f docker-compose.production.yml up --build -d"
echo "   2. Or run full deployment: ./deploy-full-production.sh" 