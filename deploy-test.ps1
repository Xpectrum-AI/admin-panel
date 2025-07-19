# Test Environment Deployment Script for Windows
# This script deploys the calendar backend using test environment

param(
    [switch]$SkipChecks
)

Write-Host "🧪 Starting Test Environment Deployment..." -ForegroundColor Green

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

# Check if test env file exists
if (-not (Test-Path "env.test")) {
    Write-Host "❌ env.test file not found. Please create it with your test configuration." -ForegroundColor Red
    exit 1
}

# Copy test env to .env
Write-Host "📋 Using test environment configuration..." -ForegroundColor Yellow
Copy-Item "env.test" ".env"

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start services with test configuration
Write-Host "🔨 Building and starting test services..." -ForegroundColor Yellow
$env:NODE_ENV = "development"
$env:NEXT_PUBLIC_ENV = "test"
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
        Write-Host "✅ Test deployment completed successfully!" -ForegroundColor Green
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

Write-Host "🎉 Test deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Test Environment Service URLs:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   - Backend: http://localhost:8005" -ForegroundColor White
Write-Host "   - Calendar Backend: http://localhost:8001" -ForegroundColor White
Write-Host "   - Calendar API Docs: http://localhost:8001/docs" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Cyan
Write-Host "   - View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   - Stop services: docker-compose down" -ForegroundColor White
Write-Host "   - Restart services: docker-compose restart" -ForegroundColor White
Write-Host "   - Update and redeploy: `$env:NODE_ENV='development'; `$env:NEXT_PUBLIC_ENV='test'; docker-compose up --build -d" -ForegroundColor White 