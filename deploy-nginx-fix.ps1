# PowerShell script to deploy nginx configuration fix

Write-Host "🚀 Deploying nginx configuration fix..." -ForegroundColor Green

# Update nginx configuration
Write-Host "📝 Updating nginx configuration..." -ForegroundColor Yellow
Copy-Item "nginx-config-updated.conf" "/etc/nginx/sites-available/admin-test.xpectrum-ai.com" -Force

# Test nginx configuration
Write-Host "🧪 Testing nginx configuration..." -ForegroundColor Yellow
$nginxTest = nginx -t 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Nginx configuration is valid" -ForegroundColor Green
    
    # Reload nginx
    Write-Host "🔄 Reloading nginx..." -ForegroundColor Yellow
    $reloadResult = systemctl reload nginx 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Nginx reloaded successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to reload nginx" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Nginx configuration test failed" -ForegroundColor Red
    Write-Host $nginxTest -ForegroundColor Red
    exit 1
}

# Check if backend containers are running
Write-Host "🐳 Checking Docker containers..." -ForegroundColor Yellow
docker-compose ps

# Test backend connection
Write-Host "🔍 Testing backend connection..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8085/" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend responding on port 8085" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend not responding on port 8085" -ForegroundColor Yellow
}

# Test calendar backend connection
Write-Host "🔍 Testing calendar backend connection..." -ForegroundColor Yellow
try {
    $calendarResponse = Invoke-WebRequest -Uri "http://localhost:8001/api/v1/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Calendar backend responding on port 8001" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Calendar backend not responding on port 8001" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of changes:" -ForegroundColor Cyan
Write-Host "   - Added /agents/ location block to nginx configuration"
Write-Host "   - Added CORS headers for agent API endpoints"
Write-Host "   - Fixed routing for agent endpoints"
Write-Host ""
Write-Host "🔗 Test the following endpoints:" -ForegroundColor Cyan
Write-Host "   - https://admin-test.xpectrum-ai.com/agents/all"
Write-Host "   - https://admin-test.xpectrum-ai.com/agents/trunks"
Write-Host "   - https://admin-test.xpectrum-ai.com/api/org/fetch-orgs-query"
Write-Host ""
Write-Host "💡 If you still see 404 errors, please check:" -ForegroundColor Yellow
Write-Host "   1. Backend server is running on port 8085"
Write-Host "   2. Docker containers are running"
Write-Host "   3. Firewall allows traffic on ports 8085 and 8001" 