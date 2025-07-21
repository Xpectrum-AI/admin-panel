# Admin Panel AWS CDK Deployment Setup Script for Windows PowerShell
# This script sets up the complete deployment infrastructure

param(
    [switch]$SkipPrerequisites,
    [switch]$SkipIAM,
    [switch]$SkipInfrastructure
)

# Stop on first error
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Admin Panel AWS CDK Deployment Setup..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    try {
        $awsVersion = aws --version 2>$null
        if (-not $awsVersion) {
            throw "AWS CLI not found"
        }
        Write-Success "AWS CLI found: $awsVersion"
    }
    catch {
        Write-Error "AWS CLI is not installed. Please install it first from https://aws.amazon.com/cli/"
        exit 1
    }
    
    # Check if Node.js is installed
    try {
        $nodeVersion = node --version 2>$null
        if (-not $nodeVersion) {
            throw "Node.js not found"
        }
        Write-Success "Node.js found: $nodeVersion"
    }
    catch {
        Write-Error "Node.js is not installed. Please install it first from https://nodejs.org/"
        exit 1
    }
    
    # Check if Docker is installed
    try {
        $dockerVersion = docker --version 2>$null
        if (-not $dockerVersion) {
            throw "Docker not found"
        }
        Write-Success "Docker found: $dockerVersion"
    }
    catch {
        Write-Error "Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
        exit 1
    }
    
    # Check if CDK is installed
    try {
        $cdkVersion = cdk --version 2>$null
        if (-not $cdkVersion) {
            Write-Status "Installing AWS CDK..."
            npm install -g aws-cdk
            Write-Success "AWS CDK installed"
        } else {
            Write-Success "AWS CDK found: $cdkVersion"
        }
    }
    catch {
        Write-Error "Failed to install AWS CDK"
        exit 1
    }
    
    Write-Success "All prerequisites are met!"
}

# Get AWS account information
function Get-AWSInfo {
    Write-Status "Getting AWS account information..."
    
    try {
        # Get AWS account ID
        $AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
        if (-not $AWS_ACCOUNT_ID) {
            throw "Failed to get AWS account ID"
        }
        
        # Get AWS region
        $AWS_REGION = aws configure get region
        if (-not $AWS_REGION) {
            $AWS_REGION = "us-east-1"
            Write-Warning "AWS region not configured, using default: $AWS_REGION"
        }
        
        Write-Success "AWS Account ID: $AWS_ACCOUNT_ID"
        Write-Success "AWS Region: $AWS_REGION"
        
        # Set global variables
        $script:AWS_ACCOUNT_ID = $AWS_ACCOUNT_ID
        $script:AWS_REGION = $AWS_REGION
    }
    catch {
        Write-Error "Failed to get AWS information. Please check your AWS credentials."
        Write-Error "Run 'aws configure' to set up your credentials."
        exit 1
    }
}

# Setup CDK
function Setup-CDK {
    Write-Status "Setting up CDK..."
    
    Push-Location cdk
    
    try {
        # Install dependencies
        Write-Status "Installing CDK dependencies..."
        npm install
        
        # Bootstrap CDK
        Write-Status "Bootstrapping CDK..."
        cdk bootstrap
        
        Write-Success "CDK setup completed!"
    }
    catch {
        Write-Error "Failed to setup CDK"
        exit 1
    }
    finally {
        Pop-Location
    }
}

# Deploy IAM roles
function Deploy-IAM {
    if ($SkipIAM) {
        Write-Warning "Skipping IAM deployment as requested"
        return
    }
    
    Write-Status "Deploying IAM roles and OIDC setup..."
    
    Push-Location cdk
    
    try {
        # Deploy the IAM stack
        cdk deploy GitHubActionsRoleStack --require-approval never
        
        Write-Success "IAM roles deployed successfully!"
    }
    catch {
        Write-Error "Failed to deploy IAM roles"
        exit 1
    }
    finally {
        Pop-Location
    }
}

# Print GitHub setup information
function Show-GitHubSetup {
    Write-Status "GitHub Repository Setup Required:"
    Write-Host ""
    Write-Host "Please add the following secrets to your GitHub repository:"
    Write-Host ""
    Write-Host "1. Go to your GitHub repository settings"
    Write-Host "2. Navigate to Secrets and variables > Actions"
    Write-Host "3. Add the following secrets:"
    Write-Host ""
    Write-Host "   AWS_ACCOUNT_ID: $script:AWS_ACCOUNT_ID"
    Write-Host "   SLACK_WEBHOOK_URL: Your Slack webhook URL"
    Write-Host ""
    Write-Host "4. Update the OIDC role in cdk/lib/github-actions-role.ts:"
    Write-Host "   Replace 'YOUR_GITHUB_USERNAME' with your actual GitHub username"
    Write-Host ""
}

# Deploy main infrastructure
function Deploy-Infrastructure {
    if ($SkipInfrastructure) {
        Write-Warning "Skipping infrastructure deployment as requested"
        return
    }
    
    Write-Status "Deploying main infrastructure..."
    
    Push-Location cdk
    
    try {
        # Deploy the main stack
        cdk deploy AdminPanelStack --require-approval never
        
        Write-Success "Infrastructure deployed successfully!"
    }
    catch {
        Write-Error "Failed to deploy infrastructure"
        exit 1
    }
    finally {
        Pop-Location
    }
}

# Get deployment outputs
function Get-Outputs {
    Write-Status "Getting deployment outputs..."
    
    Push-Location cdk
    
    try {
        # Get stack outputs
        $LOAD_BALANCER_DNS = aws cloudformation describe-stacks --stack-name AdminPanelStack --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text
        $FRONTEND_REPO_URI = aws cloudformation describe-stacks --stack-name AdminPanelStack --query 'Stacks[0].Outputs[?OutputKey==`FrontendRepoURI`].OutputValue' --output text
        $BACKEND_REPO_URI = aws cloudformation describe-stacks --stack-name AdminPanelStack --query 'Stacks[0].Outputs[?OutputKey==`BackendRepoURI`].OutputValue' --output text
        
        Pop-Location
        
        Write-Host ""
        Write-Success "Deployment Outputs:"
        Write-Host "Load Balancer DNS: $LOAD_BALANCER_DNS"
        Write-Host "Frontend ECR Repository: $FRONTEND_REPO_URI"
        Write-Host "Backend ECR Repository: $BACKEND_REPO_URI"
        Write-Host ""
        
        # Store for final output
        $script:LOAD_BALANCER_DNS = $LOAD_BALANCER_DNS
    }
    catch {
        Write-Warning "Could not retrieve deployment outputs. This is normal if infrastructure deployment was skipped."
        Pop-Location
    }
}

# Main execution
function Main {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Admin Panel AWS CDK Deployment Setup" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $SkipPrerequisites) {
        Test-Prerequisites
    }
    
    Get-AWSInfo
    Setup-CDK
    Deploy-IAM
    Show-GitHubSetup
    Deploy-Infrastructure
    Get-Outputs
    
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Success "Setup completed successfully!"
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Add GitHub secrets as shown above"
    Write-Host "2. Update the OIDC role with your GitHub username"
    Write-Host "3. Push your code to the main branch to trigger deployment"
    Write-Host "4. Monitor the deployment in GitHub Actions"
    Write-Host ""
    
    if ($script:LOAD_BALANCER_DNS) {
        Write-Host "Your application will be available at:" -ForegroundColor Yellow
        Write-Host "http://$($script:LOAD_BALANCER_DNS)" -ForegroundColor Green
        Write-Host ""
    }
}

# Run main function
Main 