#!/bin/bash

echo "🚀 Deploying nginx configuration fix..."

# Update nginx configuration
echo "📝 Updating nginx configuration..."
sudo cp nginx-config-updated.conf /etc/nginx/sites-available/admin-test.xpectrum-ai.com

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully"
    else
        echo "❌ Failed to reload nginx"
        exit 1
    fi
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# Check if backend containers are running
echo "🐳 Checking Docker containers..."
docker-compose ps

# Test backend connection
echo "🔍 Testing backend connection..."
curl -s http://localhost:8085/ || echo "⚠️  Backend not responding on port 8085"

# Test calendar backend connection
echo "🔍 Testing calendar backend connection..."
curl -s http://localhost:8001/api/v1/health || echo "⚠️  Calendar backend not responding on port 8001"

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Summary of changes:"
echo "   - Added /agents/ location block to nginx configuration"
echo "   - Added CORS headers for agent API endpoints"
echo "   - Fixed routing for agent endpoints"
echo ""
echo "🔗 Test the following endpoints:"
echo "   - https://admin-test.xpectrum-ai.com/agents/all"
echo "   - https://admin-test.xpectrum-ai.com/agents/trunks"
echo "   - https://admin-test.xpectrum-ai.com/api/org/fetch-orgs-query"
echo ""
echo "💡 If you still see 404 errors, please check:"
echo "   1. Backend server is running on port 8085"
echo "   2. Docker containers are running"
echo "   3. Firewall allows traffic on ports 8085 and 8001" 