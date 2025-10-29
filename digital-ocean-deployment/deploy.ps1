# DigitalOcean Container Registry Deployment Script
# This script builds and pushes Docker images, then deploys with Pulumi

Write-Host "🚀 Starting Docker Hub Deployment..." -ForegroundColor Green

# Configuration
$DOCKERHUB_USERNAME = "xpectrumai"

# Check if Docker is running
Write-Host "🔍 Checking Docker installation..." -ForegroundColor Yellow
try {
    docker version
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Login to Docker Hub
Write-Host "🔐 Logging into Docker Hub..." -ForegroundColor Yellow
docker login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to login to Docker Hub" -ForegroundColor Red
    exit 1
}

# Build and push Admin Panel
Write-Host "📱 Building Admin Panel Docker image..." -ForegroundColor Yellow
Set-Location "..\frontend"
docker build -t "$DOCKERHUB_USERNAME/admin-panel:latest" -f Dockerfile .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build admin-panel image" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Pushing Admin Panel image to Docker Hub..." -ForegroundColor Yellow
docker push "$DOCKERHUB_USERNAME/admin-panel:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push admin-panel image" -ForegroundColor Red
    exit 1
}

# Build and push Developer Dashboard
Write-Host "🛠️ Building Developer Dashboard Docker image..." -ForegroundColor Yellow
Set-Location "..\frontend-developer"
docker build -t "$DOCKERHUB_USERNAME/developer-dashboard:latest" -f Dockerfile .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build developer-dashboard image" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Pushing Developer Dashboard image to Docker Hub..." -ForegroundColor Yellow
docker push "$DOCKERHUB_USERNAME/developer-dashboard:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push developer-dashboard image" -ForegroundColor Red
    exit 1
}

# Return to deployment directory
Set-Location "..\digital-ocean-deployment"

# Deploy with Pulumi
Write-Host "🚀 Deploying with Pulumi..." -ForegroundColor Yellow
pulumi up --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Your applications are now live on DigitalOcean App Platform" -ForegroundColor Green
} else {
    Write-Host "❌ Pulumi deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 All done! Check your DigitalOcean dashboard for the app URLs." -ForegroundColor Green