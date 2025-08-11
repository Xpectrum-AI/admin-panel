#!/bin/bash
set -e

echo "🔧 Fixing ECS service..."

# Set variables
CLUSTER_NAME="AdminPanelStagingStack-AdminPanelStagingStackClusterE3F858A7-6ieSRGGem8a4"
SERVICE_NAME="AdminPanelStagingStack-AdminPanelStagingStackService72EB3009-UGHnUrf1ZOhg"
REGION="us-west-1"

echo "📋 Service Details:"
echo "  Cluster: $CLUSTER_NAME"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"

# Check current service status
echo "🔍 Checking current service status..."
aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION \
  --query 'services[0].{Status:status,DesiredCount:desiredCount,RunningCount:runningCount,PendingCount:pendingCount}' \
  --output table

# Force update the service to desired count 2
echo "🔄 Updating service to desired count 2..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --desired-count 2 \
  --region $REGION

# Wait for service to be stable
echo "⏳ Waiting for service to be stable..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION

# Check final status
echo "✅ Final service status:"
aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION \
  --query 'services[0].{Status:status,DesiredCount:desiredCount,RunningCount:runningCount,PendingCount:pendingCount}' \
  --output table

echo "🎉 ECS service should now be active!"
echo ""
echo "🌐 Check your staging environment:"
echo "  https://admin-test.xpectrum-ai.com"
