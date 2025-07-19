#!/bin/bash

# Test Environment Deployment Script
# This script deploys the calendar backend using test environment

set -e  # Exit on any error

echo "🧪 Starting Test Environment Deployment..."

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

# Check if test env file exists
if [ ! -f env.test ]; then
    echo "❌ env.test file not found. Please create it with your test configuration."
    exit 1
fi

# Copy test env to .env
echo "📋 Using test environment configuration..."
cp env.test .env

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start services with test configuration
echo "🔨 Building and starting test services..."
NODE_ENV=development NEXT_PUBLIC_ENV=test docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Test calendar backend
echo "🧪 Testing calendar backend..."
if curl -f http://localhost:8001/api/v1/ > /dev/null 2>&1; then
    echo "✅ Test deployment completed successfully!"
    echo "📊 Calendar Backend API: http://localhost:8001"
    echo "📊 Calendar Backend Docs: http://localhost:8001/docs"
else
    echo "❌ Calendar backend health check failed."
    echo "📋 Checking logs..."
    docker-compose logs calendar-backend
    exit 1
fi

echo "🎉 Test deployment completed successfully!"
echo ""
echo "📋 Test Environment Service URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:8005"
echo "   - Calendar Backend: http://localhost:8001"
echo "   - Calendar API Docs: http://localhost:8001/docs"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo "   - Update and redeploy: NODE_ENV=development NEXT_PUBLIC_ENV=test docker-compose up --build -d" 