#!/bin/bash

echo "🚀 Deploying production with fixed API routing..."

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down

# Build and start containers with updated configuration
echo "🔨 Building and starting containers..."
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose -f docker-compose.production.yml ps

# Test the fixed endpoints
echo "🧪 Testing fixed endpoints..."

# Test calendar API endpoint
echo "Testing calendar API endpoint..."
curl -s -o /dev/null -w "%{http_code}" https://admin-test.xpectrum-ai.com/calendar-api/ || echo "Failed"

# Test auth callback endpoint
echo "Testing auth callback endpoint..."
curl -s -o /dev/null -w "%{http_code}" https://admin-test.xpectrum-ai.com/calendar-api/auth/callback || echo "Failed"

echo "✅ Deployment completed with fixed API routing!"
echo "📝 The following changes were made:"
echo "   - Updated frontend API calls to use /calendar-api/ instead of /api/v1/"
echo "   - Updated OAuth redirect URIs to use /calendar-api/ path"
echo "   - Fixed nginx routing to properly route calendar API requests" 