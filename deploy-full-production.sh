#!/bin/bash

# Full Production Deployment Script
# This script builds and deploys frontend, backend, and calendar backend with production environments

set -e  # Exit on any error

echo "🚀 Starting Full Production Deployment..."

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

# Check if production env files exist
if [ ! -f env.production ]; then
    echo "❌ env.production file not found. Please create it with your production configuration."
    exit 1
fi

if [ ! -f frontend/env.production ]; then
    echo "❌ frontend/env.production file not found. Please create it with your production configuration."
    exit 1
fi

if [ ! -f backend/env.production ]; then
    echo "❌ backend/env.production file not found. Please create it with your production configuration."
    exit 1
fi

# Copy production env to .env
echo "📋 Using production environment configuration..."
cp env.production .env

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build Frontend with Production Environment
echo "🔨 Building frontend with production environment..."
cd frontend
cp env.production .env.production
NODE_ENV=production npm run build
cd ..

# Build Backend with Production Environment
echo "🔨 Building backend with production environment..."
cd backend
cp env.production .env.production
NODE_ENV=production npm run build
cd ..

# Build and start services with production configuration
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

echo "🎉 Full production deployment completed successfully!"
echo ""
echo "📋 Production Service URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:8085"
echo "   - Calendar Backend: http://localhost:8001"
echo "   - Calendar API Docs: http://localhost:8001/docs"
echo ""
echo "🌐 Production URLs (via nginx):"
echo "   - Frontend: https://admin-test.xpectrum-ai.com"
echo "   - Main API: https://admin-test.xpectrum-ai.com/api"
echo "   - Calendar API: https://admin-test.xpectrum-ai.com/calendar-api"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   - Stop services: docker-compose -f docker-compose.production.yml down"
echo "   - Restart services: docker-compose -f docker-compose.production.yml restart"
echo "   - Update and redeploy: ./deploy-full-production.sh" 