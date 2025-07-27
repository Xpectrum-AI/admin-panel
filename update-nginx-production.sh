#!/bin/bash

# Update nginx configuration on production server
echo "Updating nginx configuration..."

# Copy the updated nginx config
sudo cp nginx-config-updated.conf /etc/nginx/sites-available/admin-test.xpectrum-ai.com

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid. Reloading nginx..."
    sudo systemctl reload nginx
    echo "Nginx reloaded successfully!"
else
    echo "Nginx configuration test failed!"
    exit 1
fi

# Check if containers are running
echo "Checking Docker containers..."
docker-compose ps

# Test the backend connection
echo "Testing backend connection..."
curl -s http://localhost:8005/ || echo "Backend not responding on port 8005"

# Test calendar backend connection
echo "Testing calendar backend connection..."
curl -s http://localhost:8001/api/v1/ || echo "Calendar backend not responding on port 8001"

echo "Update complete!" 