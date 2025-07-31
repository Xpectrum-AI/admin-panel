# PowerShell Deployment Script for ECR
# Set error action preference
$ErrorActionPreference = "Stop"

# AWS Configuration
$AWS_REGION = "us-west-1"
$ACCOUNT_ID = "641623447164"

# ECR repository URI
$REPO = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/admin-panel"

Write-Host "Starting deployment to ECR..." -ForegroundColor Green

# Authenticate Docker to ECR
Write-Host "Authenticating with ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to authenticate with ECR" -ForegroundColor Red
    exit 1
}

# Build, tag, and push frontend
Write-Host "Building and pushing frontend..." -ForegroundColor Yellow
Set-Location "./frontend"
docker build --build-arg NODE_ENV=production -t admin-panel:frontend-latest .
docker tag admin-panel:frontend-latest $REPO:frontend-latest
docker push $REPO:frontend-latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build/push frontend" -ForegroundColor Red
    exit 1
}

# Build, tag, and push backend
Write-Host "Building and pushing backend..." -ForegroundColor Yellow
Set-Location "../backend"
docker build --build-arg NODE_ENV=production -t admin-panel:backend-latest .
docker tag admin-panel:backend-latest $REPO:backend-latest
docker push $REPO:backend-latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build/push backend" -ForegroundColor Red
    exit 1
}

# Build, tag, and push calendar-backend
Write-Host "Building and pushing calendar-backend..." -ForegroundColor Yellow
Set-Location "../calendar-backend"
docker build --build-arg PYTHON_ENV=production -t admin-panel:calendar-latest .
docker tag admin-panel:calendar-latest $REPO:calendar-latest
docker push $REPO:calendar-latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build/push calendar-backend" -ForegroundColor Red
    exit 1
}

# Return to original directory
Set-Location "../admin-panel"

Write-Host "All images built and pushed successfully!" -ForegroundColor Green 