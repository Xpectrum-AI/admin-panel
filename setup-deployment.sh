#!/bin/bash

# Admin Panel AWS CDK Deployment Setup Script
# This script sets up the complete deployment infrastructure

set -e

echo "🚀 Starting Admin Panel AWS CDK Deployment Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check if CDK is installed
    if ! command -v cdk &> /dev/null; then
        print_status "Installing AWS CDK..."
        npm install -g aws-cdk
    fi
    
    print_success "All prerequisites are met!"
}

# Get AWS account information
get_aws_info() {
    print_status "Getting AWS account information..."
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        print_error "Failed to get AWS account ID. Please check your AWS credentials."
        exit 1
    fi
    
    # Get AWS region
    AWS_REGION=$(aws configure get region)
    if [ -z "$AWS_REGION" ]; then
        AWS_REGION="us-east-1"
        print_warning "AWS region not configured, using default: $AWS_REGION"
    fi
    
    print_success "AWS Account ID: $AWS_ACCOUNT_ID"
    print_success "AWS Region: $AWS_REGION"
}

# Setup CDK
setup_cdk() {
    print_status "Setting up CDK..."
    
    cd cdk
    
    # Install dependencies
    print_status "Installing CDK dependencies..."
    npm install
    
    # Bootstrap CDK
    print_status "Bootstrapping CDK..."
    cdk bootstrap
    
    print_success "CDK setup completed!"
    cd ..
}

# Deploy IAM roles
deploy_iam() {
    print_status "Deploying IAM roles and OIDC setup..."
    
    cd cdk
    
    # Deploy the IAM stack
    cdk deploy GitHubActionsRoleStack --require-approval never
    
    print_success "IAM roles deployed successfully!"
    cd ..
}

# Update GitHub secrets info
print_github_setup() {
    print_status "GitHub Repository Setup Required:"
    echo ""
    echo "Please add the following secrets to your GitHub repository:"
    echo ""
    echo "1. Go to your GitHub repository settings"
    echo "2. Navigate to Secrets and variables > Actions"
    echo "3. Add the following secrets:"
    echo ""
    echo "   AWS_ACCOUNT_ID: $AWS_ACCOUNT_ID"
    echo "   SLACK_WEBHOOK_URL: Your Slack webhook URL"
    echo ""
    echo "4. Update the OIDC role in cdk/lib/github-actions-role.ts:"
    echo "   Replace 'YOUR_GITHUB_USERNAME' with your actual GitHub username"
    echo ""
}

# Deploy main infrastructure
deploy_infrastructure() {
    print_status "Deploying main infrastructure..."
    
    cd cdk
    
    # Deploy the main stack
    cdk deploy AdminPanelStack --require-approval never
    
    print_success "Infrastructure deployed successfully!"
    cd ..
}

# Get deployment outputs
get_outputs() {
    print_status "Getting deployment outputs..."
    
    cd cdk
    
    # Get stack outputs
    LOAD_BALANCER_DNS=$(aws cloudformation describe-stacks --stack-name AdminPanelStack --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text)
    FRONTEND_REPO_URI=$(aws cloudformation describe-stacks --stack-name AdminPanelStack --query 'Stacks[0].Outputs[?OutputKey==`FrontendRepoURI`].OutputValue' --output text)
    BACKEND_REPO_URI=$(aws cloudformation describe-stacks --stack-name AdminPanelStack --query 'Stacks[0].Outputs[?OutputKey==`BackendRepoURI`].OutputValue' --output text)
    
    cd ..
    
    echo ""
    print_success "Deployment Outputs:"
    echo "Load Balancer DNS: $LOAD_BALANCER_DNS"
    echo "Frontend ECR Repository: $FRONTEND_REPO_URI"
    echo "Backend ECR Repository: $BACKEND_REPO_URI"
    echo ""
}

# Main execution
main() {
    echo "=========================================="
    echo "Admin Panel AWS CDK Deployment Setup"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    get_aws_info
    setup_cdk
    deploy_iam
    print_github_setup
    deploy_infrastructure
    get_outputs
    
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Add GitHub secrets as shown above"
    echo "2. Update the OIDC role with your GitHub username"
    echo "3. Push your code to the main branch to trigger deployment"
    echo "4. Monitor the deployment in GitHub Actions"
    echo ""
    echo "Your application will be available at:"
    echo "http://$LOAD_BALANCER_DNS"
    echo ""
}

# Run main function
main "$@" 