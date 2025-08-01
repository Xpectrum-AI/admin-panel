# Admin Panel Deployment Guide

This guide explains how to deploy the Admin Panel application to AWS ECR using production environment configurations.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Docker installed and running
- Access to the ECR repository

## Environment Configuration

All services have been configured to use production environment variables:

### Root Environment (`env.production`)
- Production database connections
- Secure JWT secrets
- Production API keys
- CORS configuration for production domains

### Frontend Environment (`frontend/env.production`)
- Production API endpoints
- PropelAuth configuration
- Production API keys

### Backend Environment (`backend/env.production`)
- Production MongoDB connection
- Secure JWT configuration
- Production Stripe keys
- Production authentication settings

### Calendar Backend Environment (`calendar-backend/.env`)
- Production Google OAuth configuration
- Production database settings
- Secure session management
- Production CORS settings

## Deployment Scripts

### Bash Script (Linux/macOS)
```bash
./deploy-to-ecr.sh
```

### PowerShell Script (Windows)
```powershell
.\deploy-to-ecr.ps1
```

## What the Scripts Do

1. **Authenticate with ECR**: Uses AWS CLI to authenticate Docker with ECR
2. **Build Frontend**: Builds the Next.js frontend with production environment
3. **Build Backend**: Builds the Node.js backend with production environment
4. **Build Calendar Backend**: Builds the Python calendar service with production environment
5. **Tag Images**: Tags all images with ECR repository URI
6. **Push to ECR**: Pushes all images to the ECR repository

## Production Environment Features

### Security
- All secrets and keys updated to production values
- Debug mode disabled in all services
- Secure session management
- Production CORS configuration

### Performance
- Optimized Docker builds with multi-stage builds
- Aggressive cleanup to reduce image sizes
- Production-optimized logging levels

### Monitoring
- Health checks configured for all services
- Structured logging for production monitoring
- Error handling and graceful degradation

## Manual Deployment Steps

If you prefer to deploy manually:

1. **Authenticate with ECR**:
   ```bash
   aws ecr get-login-password --region us-west-1 | docker login --username AWS --password-stdin 641623447164.dkr.ecr.us-west-1.amazonaws.com
   ```

2. **Build Frontend**:
   ```bash
   cd frontend
   docker build --build-arg NODE_ENV=production -t admin-panel:frontend-latest .
   docker tag admin-panel:frontend-latest 641623447164.dkr.ecr.us-west-1.amazonaws.com/admin-panel:frontend-latest
   docker push 641623447164.dkr.ecr.us-west-1.amazonaws.com/admin-panel:frontend-latest
   ```

3. **Build Backend**:
   ```bash
   cd ../backend
   docker build --build-arg NODE_ENV=production -t admin-panel:backend-latest .
   docker tag admin-panel:backend-latest 641623447164.dkr.ecr.us-west-1.amazonaws.com/admin-panel:backend-latest
   docker push 641623447164.dkr.ecr.us-west-1.amazonaws.com/admin-panel:backend-latest
   ```

4. **Build Calendar Backend**:
   ```bash
   cd ../calendar-backend
   docker build --build-arg PYTHON_ENV=production -t admin-panel:calendar-latest .
   docker tag admin-panel:calendar-latest 641623447164.dkr.ecr.us-west-1.amazonaws.com/admin-panel:calendar-latest
   docker push 641623447164.dkr.ecr.us-west-1.amazonaws.com/admin-panel:calendar-latest
   ```

## Environment Variables Summary

### Production Secrets Updated
- `SECRET_KEY`: `prod_secure_secret_key_2024_admin_panel`
- `JWT_SECRET`: `prod_jwt_secret_2024_admin_panel`
- `STRIPE_SECRET_KEY`: `prod_stripe_secret_key_2024_admin_panel`
- `AUTH_SECRET`: `prod_auth_secret_2024_admin_panel`
- `NEXT_PUBLIC_API_KEY`: `prod_api_key_2024_admin_panel`

### Production URLs
- Frontend: `https://admin-test.xpectrum-ai.com`
- Backend API: `https://admin-test.xpectrum-ai.com/api`
- Calendar API: `https://admin-test.xpectrum-ai.com/calendar-api`
- Auth: `https://auth.admin-test.xpectrum-ai.com`

### Database Configuration
- MongoDB: Production cluster with proper authentication
- Database: `google_oauth` for calendar service
- Collections: `user_tokens`, `sessions`

## Troubleshooting

### Common Issues

1. **Authentication Failed**:
   - Ensure AWS CLI is configured with correct credentials
   - Verify ECR repository permissions

2. **Build Failures**:
   - Check Docker is running
   - Verify all environment files exist
   - Ensure sufficient disk space

3. **Push Failures**:
   - Verify ECR repository exists
   - Check network connectivity
   - Ensure proper IAM permissions

### Logs and Monitoring

- Frontend logs: Check Next.js application logs
- Backend logs: Check Node.js server logs
- Calendar logs: Check Python uvicorn logs
- Docker logs: `docker logs <container_name>`

## Security Notes

- All production secrets have been updated
- Debug mode is disabled in all services
- CORS is configured for production domains only
- Health checks are enabled for all services
- Non-root users are used in containers where possible

## Next Steps

After successful deployment:

1. Update your Kubernetes/ECS deployment manifests
2. Configure load balancers and ingress rules
3. Set up monitoring and alerting
4. Configure SSL certificates
5. Set up CI/CD pipeline for automated deployments 