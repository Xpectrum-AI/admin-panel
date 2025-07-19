# Production Deployment Script for Windows
# This script deploys the calendar backend using production environment

param(
    [switch]$SkipChecks
)

Write-Host "🚀 Starting Production Deployment..." -ForegroundColor Green

# Check if Docker is installed
if (-not $SkipChecks) {
    try {
        $null = docker --version
        Write-Host "✅ Docker is installed" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
        exit 1
    }

    # Check if Docker Compose is installed
    try {
        $null = docker-compose --version
        Write-Host "✅ Docker Compose is installed" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
        exit 1
    }
}

# Check if production env file exists
if (-not (Test-Path "env.production")) {
    Write-Host "❌ env.production file not found. Please create it with your production configuration." -ForegroundColor Red
    exit 1
}

# Copy production env to .env
Write-Host "📋 Using production environment configuration..." -ForegroundColor Yellow
Copy-Item "env.production" ".env"

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start services with production configuration
Write-Host "🔨 Building and starting production services..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
docker-compose up --build -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow
docker-compose ps

# Test calendar backend
Write-Host "🧪 Testing calendar backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8001/api/v1/" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Production deployment completed successfully!" -ForegroundColor Green
        Write-Host "📊 Calendar Backend API: http://localhost:8001" -ForegroundColor Cyan
        Write-Host "📊 Calendar Backend Docs: http://localhost:8001/docs" -ForegroundColor Cyan
    }
    else {
        throw "Unexpected status code: $($response.StatusCode)"
    }
}
catch {
    Write-Host "❌ Calendar backend health check failed." -ForegroundColor Red
    Write-Host "📋 Checking logs..." -ForegroundColor Yellow
    docker-compose logs calendar-backend
    exit 1
}

Write-Host "🎉 Production deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Production Service URLs:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   - Backend: http://localhost:8005" -ForegroundColor White
Write-Host "   - Calendar Backend: http://localhost:8001" -ForegroundColor White
Write-Host "   - Calendar API Docs: http://localhost:8001/docs" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Cyan
Write-Host "   - View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   - Stop services: docker-compose down" -ForegroundColor White
Write-Host "   - Restart services: docker-compose restart" -ForegroundColor White
Write-Host "   - Update and redeploy: `$env:NODE_ENV='production'; docker-compose up --build -d" -ForegroundColor White 