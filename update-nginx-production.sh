#!/bin/bash

echo "🔧 Updating Production Nginx Configuration..."

# Backup current nginx config
echo "📋 Backing up current nginx configuration..."
sudo cp /etc/nginx/sites-available/admin-test.xpectrum-ai.com /etc/nginx/sites-available/admin-test.xpectrum-ai.com.backup.$(date +%Y%m%d_%H%M%S)

# Update nginx configuration
echo "📝 Updating nginx configuration..."
sudo tee /etc/nginx/sites-available/admin-test.xpectrum-ai.com > /dev/null << 'EOF'
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
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    
    echo "✅ Nginx configuration updated and reloaded successfully!"
    echo ""
    echo "📋 Testing endpoints:"
    echo "   - Calendar API: https://admin-test.xpectrum-ai.com/calendar-api/"
    echo "   - Auth Callback: https://admin-test.xpectrum-ai.com/calendar-api/auth/callback"
    echo "   - Welcome Form: https://admin-test.xpectrum-ai.com/calendar-api/welcome-form/status"
else
    echo "❌ Nginx configuration is invalid. Please check the configuration."
    exit 1
fi 