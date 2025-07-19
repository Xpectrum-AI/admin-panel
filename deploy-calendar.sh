#!/bin/bash

# Calendar Backend Docker Deployment Script
# This script deploys the calendar backend using Docker Compose

set -e  # Exit on any error

echo "🚀 Starting Calendar Backend Deployment..."

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

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f env.template ]; then
        cp env.template .env
        echo "📝 Created .env file from template. Please update it with your actual values."
        echo "   Edit .env file and run this script again."
        exit 1
    else
        echo "❌ env.template not found. Please create a .env file with your environment variables."
        exit 1
    fi
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Test calendar backend
echo "🧪 Testing calendar backend..."
if curl -f http://localhost:8001/api/v1/ > /dev/null 2>&1; then
    echo "✅ Calendar backend is running successfully!"
    echo "📊 Calendar Backend API: http://localhost:8001"
    echo "📊 Calendar Backend Docs: http://localhost:8001/docs"
else
    echo "❌ Calendar backend health check failed."
    echo "📋 Checking logs..."
    docker-compose logs calendar-backend
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:8005"
echo "   - Calendar Backend: http://localhost:8001"
echo "   - Calendar API Docs: http://localhost:8001/docs"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo "   - Update and redeploy: docker-compose up --build -d" 