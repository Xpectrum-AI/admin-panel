# Deployment Guide for AWS EC2

This guide explains how to deploy the application on AWS EC2 using Docker.

## Prerequisites

1. AWS EC2 instance running Ubuntu
2. Docker and Docker Compose installed on the EC2 instance
3. MongoDB instance (can be MongoDB Atlas or self-hosted)

## Setup Instructions

1. **Install Docker and Docker Compose on EC2**
   ```bash
   # Update package list
   sudo apt-get update

   # Install Docker
   sudo apt-get install docker.io

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose

   # Add your user to the docker group
   sudo usermod -aG docker $USER
   ```

2. **Clone the Repository**
   ```bash
   git clone <your-repository-url>
   cd admin-panel
   ```

3. **Set Up Environment Variables**
   ```bash
   # Copy the example env file
   cp .env.example .env

   # Edit the .env file with your actual values
   nano .env
   ```

4. **Build and Start the Containers**
   ```bash
   # Build the images
   docker-compose build

   # Start the services
   docker-compose up -d
   ```

5. **Configure Security Groups**
   - Open port 3000 for the frontend
   - Open port 5000 for the backend
   - Configure your EC2 security group to allow these ports

6. **Set Up Nginx (Optional but Recommended)**
   ```bash
   # Install Nginx
   sudo apt-get install nginx

   # Configure Nginx as a reverse proxy
   sudo nano /etc/nginx/sites-available/default
   ```

   Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Test Nginx configuration
   sudo nginx -t

   # Restart Nginx
   sudo systemctl restart nginx
   ```

## Maintenance

- **View Logs**
  ```bash
  docker-compose logs -f
  ```

- **Restart Services**
  ```bash
  docker-compose restart
  ```

- **Update Application**
  ```bash
  git pull
  docker-compose build
  docker-compose up -d
  ```

## Security Considerations

1. Always use HTTPS in production
2. Keep your environment variables secure
3. Regularly update Docker images and dependencies
4. Use AWS Security Groups to restrict access
5. Consider using AWS ECS or EKS for production workloads

## Troubleshooting

1. **Check Container Status**
   ```bash
   docker-compose ps
   ```

2. **View Container Logs**
   ```bash
   docker-compose logs [service-name]
   ```

3. **Access Container Shell**
   ```bash
   docker-compose exec [service-name] sh
   ``` 