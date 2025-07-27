#!/bin/bash

echo "🔧 Diagnosing and fixing production issues..."

# 1. Check if Docker containers are running
echo "📋 Checking Docker containers..."
docker-compose ps

# 2. Check container logs for errors
echo "📋 Checking backend logs..."
docker-compose logs backend --tail=20

echo "📋 Checking calendar-backend logs..."
docker-compose logs calendar-backend --tail=20

echo "📋 Checking frontend logs..."
docker-compose logs frontend --tail=10

# 3. Test direct connections to containers
echo "🧪 Testing direct connections..."

echo "Testing backend on port 8085..."
curl -s http://localhost:8085/ || echo "❌ Backend not responding on port 8085"

echo "Testing calendar backend on port 8001..."
curl -s http://localhost:8001/api/v1/ || echo "❌ Calendar backend not responding on port 8001"

echo "Testing frontend on port 3000..."
curl -s http://localhost:3000/ || echo "❌ Frontend not responding on port 3000"

# 4. Update nginx configuration
echo "📝 Updating nginx configuration..."
sudo cp nginx-config-updated.conf /etc/nginx/sites-available/admin-test.xpectrum-ai.com

# 5. Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid. Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully!"
else
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

# 6. Test external endpoints
echo "🧪 Testing external endpoints..."

echo "Testing calendar API endpoint..."
curl -s https://admin-test.xpectrum-ai.com/calendar-api/ || echo "❌ Calendar API not accessible"

echo "Testing backend API endpoint..."
curl -s https://admin-test.xpectrum-ai.com/api/ || echo "❌ Backend API not accessible"

echo "Testing agents endpoint..."
curl -s https://admin-test.xpectrum-ai.com/agents/ || echo "❌ Agents API not accessible"

# 7. Check nginx error logs
echo "📋 Recent nginx error logs..."
sudo tail -n 10 /var/log/nginx/error.log

# 8. Check nginx access logs
echo "📋 Recent nginx access logs..."
sudo tail -n 10 /var/log/nginx/access.log

echo "✅ Diagnosis and fix complete!"
echo ""
echo "📋 Summary of changes:"
echo "   - Updated nginx configuration to use correct ports (8085 for backend)"
echo "   - Added proper routing for /agents/ and /stripe/ endpoints"
echo "   - Fixed /api/ proxy_pass to preserve the /api prefix"
echo "   - Reloaded nginx configuration"
echo ""
echo "🔍 If issues persist, check:"
echo "   - Docker container logs: docker-compose logs [service-name]"
echo "   - Nginx error logs: sudo tail -f /var/log/nginx/error.log"
echo "   - Container status: docker-compose ps" 