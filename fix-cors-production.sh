#!/bin/bash

# Complete CORS Fix for Production
# This script fixes all CORS issues by rebuilding everything with correct production settings

set -e  # Exit on any error

echo "🔧 Starting Complete CORS Fix for Production..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop all containers
echo "🛑 Stopping all containers..."
docker-compose down
docker-compose -f docker-compose.production.yml down

# Clean Docker cache
echo "🧹 Cleaning Docker cache..."
docker system prune -f
docker volume prune -f

# Force rebuild frontend with production environment
echo "🔨 Force rebuilding frontend..."
cd frontend

# Clean everything
rm -rf .next
rm -rf node_modules/.cache
rm -rf .env.local
rm -rf .env.production

# Copy production environment
cp ../frontend/env.production .env.production

# Install and build
npm install
NODE_ENV=production npm run build

cd ..

# Force rebuild backend with production environment
echo "🔨 Force rebuilding backend..."
cd backend

# Clean everything
rm -rf node_modules/.cache
rm -rf .env.local
rm -rf .env.production

# Copy production environment
cp ../backend/env.production .env.production

# Install dependencies
npm install

cd ..

# Update calendar backend environment
echo "🔨 Updating calendar backend environment..."
cp env.production .env

# Build and start with production configuration
echo "🔨 Building and starting production services..."
NODE_ENV=production docker-compose -f docker-compose.production.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 20

# Check service health
echo "🏥 Checking service health..."
docker-compose -f docker-compose.production.yml ps

# Test all services
echo "🧪 Testing all services..."

# Test calendar backend
if curl -f http://localhost:8001/api/v1/ > /dev/null 2>&1; then
    echo "✅ Calendar backend is running successfully!"
else
    echo "❌ Calendar backend health check failed."
    docker-compose -f docker-compose.production.yml logs calendar-backend
    exit 1
fi

# Test main backend
if curl -f http://localhost:8085/health > /dev/null 2>&1; then
    echo "✅ Main backend is running successfully!"
else
    echo "❌ Main backend health check failed."
    docker-compose -f docker-compose.production.yml logs backend
    exit 1
fi

# Test frontend
if curl -f http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ Frontend is running successfully!"
else
    echo "❌ Frontend health check failed."
    docker-compose -f docker-compose.production.yml logs frontend
    exit 1
fi

echo "🎉 CORS fix completed successfully!"
echo ""
echo "📋 Production Service URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:8085"
echo "   - Calendar Backend: http://localhost:8001"
echo ""
echo "🌐 Production URLs (via nginx):"
echo "   - Frontend: https://admin-test.xpectrum-ai.com"
echo "   - Main API: https://admin-test.xpectrum-ai.com/api"
echo "   - Calendar API: https://admin-test.xpectrum-ai.com/calendar-api"
echo ""
echo "🔧 Next steps:"
echo "   1. Update nginx configuration with nginx-config-updated.conf"
echo "   2. Reload nginx: sudo systemctl reload nginx"
echo "   3. Test the application in browser"
echo ""
echo "🔍 If CORS errors persist:"
echo "   1. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   2. Check container logs: docker-compose -f docker-compose.production.yml logs -f" 