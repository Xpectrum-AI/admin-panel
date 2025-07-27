#!/bin/bash

# Update nginx configuration for production
echo "Updating nginx configuration..."

# Copy the updated nginx config
sudo cp nginx-config-updated.conf /etc/nginx/sites-available/admin-test.xpectrum-ai.com

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid. Reloading nginx..."
    sudo systemctl reload nginx
    echo "Nginx configuration updated successfully!"
else
    echo "Nginx configuration test failed. Please check the configuration."
    exit 1
fi

echo "Nginx configuration update completed!" 