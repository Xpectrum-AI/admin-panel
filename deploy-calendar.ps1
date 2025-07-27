# Calendar Backend Docker Deployment Script for Windows
# This script deploys the calendar backend using Docker Compose

param(
    [switch]$SkipChecks
)

Write-Host "🚀 Starting Calendar Backend Deployment..." -ForegroundColor Green

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

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path "env.template") {
        Copy-Item "env.template" ".env"
        Write-Host "📝 Created .env file from template. Please update it with your actual values." -ForegroundColor Yellow
        Write-Host "   Edit .env file and run this script again." -ForegroundColor Yellow
        exit 1
    }
    else {
        Write-Host "❌ env.template not found. Please create a .env file with your environment variables." -ForegroundColor Red
        exit 1
    }
}

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start services
Write-Host "🔨 Building and starting services..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow
docker-compose ps

# Test calendar backend
Write-Host "🧪 Testing calendar backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8001/api/v1/" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Calendar backend is running successfully!" -ForegroundColor Green
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

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   - Backend: http://localhost:8085" -ForegroundColor White
Write-Host "   - Calendar Backend: http://localhost:8001" -ForegroundColor White
Write-Host "   - Calendar API Docs: http://localhost:8001/docs" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Cyan
Write-Host "   - View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   - Stop services: docker-compose down" -ForegroundColor White
Write-Host "   - Restart services: docker-compose restart" -ForegroundColor White
Write-Host "   - Update and redeploy: docker-compose up --build -d" -ForegroundColor White 