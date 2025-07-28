# Calendar Backend Docker Deployment Guide

This guide will walk you through deploying your calendar backend using Docker and Docker Compose.

## 📋 Prerequisites

Before starting the deployment, ensure you have the following installed:

- **Docker Desktop** (for Windows/Mac) or **Docker Engine** (for Linux)
- **Docker Compose** (usually included with Docker Desktop)
- **Git** (to clone your repository)

## 🚀 Quick Start (Windows)

1. **Open PowerShell** in your project directory
2. **Run the deployment script:**
   ```powershell
   .\deploy-calendar.ps1
   ```

## 🚀 Quick Start (Linux/Mac)

1. **Open terminal** in your project directory
2. **Make the script executable and run it:**
   ```bash
   chmod +x deploy-calendar.sh
   ./deploy-calendar.sh
   ```

## 📝 Manual Deployment Steps

### Step 1: Environment Configuration

1. **Copy the environment template:**
   ```bash
   cp env.template .env
   ```

2. **Edit the `.env` file** with your actual values:
   ```bash
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_actual_google_client_id
   GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
   REDIRECT_URI=http://localhost:8001/api/v1/oauth2callback
   CALENDAR_REDIRECT_URI=http://localhost:8001/api/v1/calendar/oauth2callback
   FRONTEND_URL=http://localhost:3000
   SECRET_KEY=your_secure_secret_key
   
   # MongoDB Configuration
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   DATABASE_NAME=google_oauth
   
   # PropelAuth Configuration
   PROPELAUTH_URL=https://your-domain.propelauthtest.com
   PROPELAUTH_API_KEY=your_propelauth_api_key
   
   # Other configurations...
   ```

### Step 2: Build and Deploy

1. **Stop any existing containers:**
   ```bash
   docker-compose down
   ```

2. **Build and start all services:**
   ```bash
   docker-compose up --build -d
   ```

3. **Check service status:**
   ```bash
   docker-compose ps
   ```

### Step 3: Verify Deployment

1. **Test the calendar backend API:**
   ```bash
   curl http://localhost:8001/api/v1/
   ```

2. **Check the API documentation:**
   - Open: http://localhost:8001/docs

3. **View logs if needed:**
   ```bash
   docker-compose logs calendar-backend
   ```

## 🌐 Service URLs

After successful deployment, your services will be available at:

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8085
- **Calendar Backend:** http://localhost:8001
- **Calendar API Docs:** http://localhost:8001/docs

## 🔧 Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f calendar-backend
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Update and Redeploy
```bash
docker-compose up --build -d
```

### Remove All Containers and Images
```bash
docker-compose down --rmi all --volumes --remove-orphans
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :8001
   
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Environment variables not loading:**
   - Ensure `.env` file exists in the project root
   - Check that variable names match exactly
   - Restart containers after changing `.env`

3. **MongoDB connection issues:**
   - Verify your MongoDB connection string
   - Check network connectivity
   - Ensure MongoDB Atlas IP whitelist includes your IP

4. **Google OAuth issues:**
   - Verify Google Client ID and Secret
   - Check redirect URIs in Google Console
   - Ensure CORS origins are correct

### Debug Mode

To run in debug mode, set `DEBUG_MODE=true` in your `.env` file and restart:

```bash
docker-compose restart calendar-backend
```

### View Container Details

```bash
# Container info
docker-compose ps

# Container logs
docker-compose logs calendar-backend

# Execute commands in container
docker-compose exec calendar-backend bash
```

## 🔒 Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use strong, unique secrets for production
   - Rotate secrets regularly

2. **Network Security:**
   - Use HTTPS in production
   - Configure proper CORS origins
   - Implement rate limiting

3. **Database Security:**
   - Use strong MongoDB passwords
   - Enable MongoDB Atlas security features
   - Regular backups

## 📦 Production Deployment

For production deployment, consider:

1. **Use a reverse proxy** (nginx, traefik)
2. **Set up SSL/TLS certificates**
3. **Configure proper logging**
4. **Set up monitoring and alerting**
5. **Use container orchestration** (Kubernetes, Docker Swarm)

### Production Environment Variables

```bash
# Production settings
DEBUG_MODE=false
FRONTEND_URL=https://yourdomain.com
REDIRECT_URI=https://yourdomain.com/api/v1/oauth2callback
CALENDAR_REDIRECT_URI=https://yourdomain.com/api/v1/calendar/oauth2callback
CORS_ORIGINS=https://yourdomain.com
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `docker-compose logs calendar-backend`
2. Verify environment variables are set correctly
3. Ensure all prerequisites are installed
4. Check network connectivity and firewall settings
5. Review the troubleshooting section above

---

**Happy Deploying! 🎉** 