#!/bin/bash
set -e

echo "🚀 Force redeploying staging environment..."

# Navigate to CDK directory
cd python-cdk-v2

# Add a timestamp to force new deployment
echo "# Force deployment timestamp: $(date)" > force-deploy-timestamp.txt

# Deploy with force
echo "📦 Deploying CDK stack..."
python -m aws_cdk.cli deploy AdminPanelStagingStack --require-approval never --context environment=staging

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
CLUSTER_NAME="AdminPanelStagingStack-AdminPanelStagingStackClusterE3F858A7-6ieSRGGem8a4"
SERVICE_NAME="AdminPanelStagingStack-AdminPanelStagingStackService72EB3009-UGHnUrf1ZOhg"

aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region us-west-1 \
  --query 'services[0].{Status:status,DesiredCount:desiredCount,RunningCount:runningCount,PendingCount:pendingCount}' \
  --output table

echo "✅ Staging redeployment completed!"
echo "🌐 Check your staging environment: https://admin-test.xpectrum-ai.com"
