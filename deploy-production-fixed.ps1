# PowerShell Deployment Script with Fixed API Routing

Write-Host "🚀 Deploying production with fixed API routing..." -ForegroundColor Green

# Stop existing containers
Write-Host "📦 Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml down

# Build and start containers with updated configuration
Write-Host "🔨 Building and starting containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service status
Write-Host "🔍 Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml ps

# Test the fixed endpoints
Write-Host "🧪 Testing fixed endpoints..." -ForegroundColor Yellow

# Test calendar API endpoint
Write-Host "Testing calendar API endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://admin-test.xpectrum-ai.com/calendar-api/" -Method GET -UseBasicParsing
    Write-Host "Calendar API Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Calendar API test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test auth callback endpoint (POST request)
Write-Host "Testing auth callback endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://admin-test.xpectrum-ai.com/calendar-api/auth/callback" -Method POST -UseBasicParsing -Body '{"test": "data"}'
    Write-Host "Auth callback Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Auth callback test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "✅ Deployment completed with fixed API routing!" -ForegroundColor Green
Write-Host "📝 The following changes were made:" -ForegroundColor Cyan
Write-Host "   - Updated frontend API calls to use /calendar-api/ instead of /api/v1/" -ForegroundColor White
Write-Host "   - Updated OAuth redirect URIs to use /calendar-api/ path" -ForegroundColor White
Write-Host "   - Fixed nginx routing to properly route calendar API requests" -ForegroundColor White 