#!/bin/bash

echo "🚀 Production Deployment for EC2 Instance"
echo "=========================================="

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script needs to be run with sudo"
    echo "Usage: sudo ./deploy-production-ec2.sh"
    exit 1
fi

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down

# Build and start containers with production configuration
echo "🔨 Building and starting production containers..."
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose -f docker-compose.production.yml ps

# Test if calendar backend is responding
echo "🧪 Testing calendar backend..."
if curl -f http://localhost:8001/api/v1/ > /dev/null 2>&1; then
    echo "✅ Calendar backend is responding"
else
    echo "❌ Calendar backend is not responding"
    echo "📋 Checking calendar backend logs..."
    docker-compose -f docker-compose.production.yml logs calendar-backend
fi

# Update nginx configuration
echo "🔧 Updating nginx configuration..."

# Backup current nginx config
echo "📋 Backing up current nginx configuration..."
cp /etc/nginx/sites-available/admin-test.xpectrum-ai.com /etc/nginx/sites-available/admin-test.xpectrum-ai.com.backup.$(date +%Y%m%d_%H%M%S)

# Update nginx configuration
echo "📝 Updating nginx configuration..."
tee /etc/nginx/sites-available/admin-test.xpectrum-ai.com > /dev/null << 'EOF'
# Redirect all HTTP to HTTPS
server {
    if ($host = admin-test.xpectrum-ai.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name admin-test.xpectrum-ai.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

# Main admin panel (HTTPS)
server {
    listen 443 ssl http2;
    server_name admin-test.xpectrum-ai.com;
    ssl_certificate /etc/letsencrypt/live/admin-test.xpectrum-ai.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/admin-test.xpectrum-ai.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy Calendar API requests to calendar backend (FastAPI, Python)
    location /calendar-api/ {
        proxy_pass http://localhost:8001/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers for calendar API
        add_header 'Access-Control-Allow-Origin' 'https://admin-test.xpectrum-ai.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://admin-test.xpectrum-ai.com' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Proxy API requests to main backend (Node.js, Express, etc.)
    location /api/ {
        proxy_pass http://localhost:8085/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy all other requests to frontend (Next.js, React, etc.)
    location / {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    echo "🔄 Reloading nginx..."
    systemctl reload nginx
    
    echo "✅ Nginx configuration updated and reloaded successfully!"
else
    echo "❌ Nginx configuration is invalid. Please check the configuration."
    exit 1
fi

# Test the endpoints
echo "🧪 Testing production endpoints..."

echo "Testing calendar API endpoint..."
if curl -s -o /dev/null -w "%{http_code}" https://admin-test.xpectrum-ai.com/calendar-api/ | grep -q "200"; then
    echo "✅ Calendar API endpoint is working"
else
    echo "❌ Calendar API endpoint is not working"
fi

echo "Testing auth callback endpoint..."
if curl -s -o /dev/null -w "%{http_code}" https://admin-test.xpectrum-ai.com/calendar-api/auth/callback | grep -q "404\|405\|400"; then
    echo "✅ Auth callback endpoint is accessible (returning expected error codes)"
else
    echo "❌ Auth callback endpoint is not accessible"
fi

echo "Testing welcome form endpoint..."
if curl -s -o /dev/null -w "%{http_code}" https://admin-test.xpectrum-ai.com/calendar-api/welcome-form/status | grep -q "404\|401"; then
    echo "✅ Welcome form endpoint is accessible (returning expected error codes)"
else
    echo "❌ Welcome form endpoint is not accessible"
fi

echo ""
echo "🎉 Production deployment completed!"
echo ""
echo "📋 Service URLs:"
echo "   - Frontend: https://admin-test.xpectrum-ai.com"
echo "   - Main API: https://admin-test.xpectrum-ai.com/api"
echo "   - Calendar API: https://admin-test.xpectrum-ai.com/calendar-api"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   - Stop services: docker-compose -f docker-compose.production.yml down"
echo "   - Restart services: docker-compose -f docker-compose.production.yml restart"
echo "   - Check nginx status: systemctl status nginx"
echo "   - Check nginx logs: tail -f /var/log/nginx/error.log" 