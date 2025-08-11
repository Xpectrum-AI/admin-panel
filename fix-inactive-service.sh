#!/bin/bash
set -e

echo "🔧 Fixing inactive ECS service..."

# Set variables
CLUSTER_NAME="AdminPanelStagingStack-AdminPanelStagingStackClusterE3F858A7-6ieSRGGem8a4"
SERVICE_NAME="AdminPanelStagingStack-AdminPanelStagingStackService72EB3009-UGHnUrf1ZOhg"
REGION="us-west-1"
ACCOUNT_ID="641623447164"
REPO_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/admin-panel"

echo "📋 Service Details:"
echo "  Cluster: $CLUSTER_NAME"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"

# Step 1: Delete the inactive service
echo "🗑️ Deleting inactive service..."
aws ecs delete-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --force \
  --region $REGION

echo "⏳ Waiting for service deletion to complete..."
sleep 30

# Step 2: Create a new task definition
echo "📝 Creating new task definition..."
TASK_DEF_FAMILY="AdminPanelStagingStack-AdminPanelStagingStackTaskDefinition"

aws ecs register-task-definition \
  --family $TASK_DEF_FAMILY \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 512 \
  --memory 1024 \
  --execution-role-arn "ecsTaskExecutionRole" \
  --container-definitions "[
    {
      \"name\": \"FrontendContainer\",
      \"image\": \"$REPO_URI:frontend-staging\",
      \"portMappings\": [
        {
          \"containerPort\": 3000,
          \"protocol\": \"tcp\"
        }
      ],
      \"environment\": [
        {
          \"name\": \"NODE_ENV\",
          \"value\": \"staging\"
        },
        {
          \"name\": \"PORT\",
          \"value\": \"3000\"
        },
        {
          \"name\": \"HOST\",
          \"value\": \"0.0.0.0\"
        }
      ],
      \"logConfiguration\": {
        \"logDriver\": \"awslogs\",
        \"options\": {
          \"awslogs-group\": \"/ecs/$TASK_DEF_FAMILY\",
          \"awslogs-region\": \"$REGION\",
          \"awslogs-stream-prefix\": \"frontend\"
        }
      }
    }
  ]" \
  --region $REGION

# Step 3: Create a new service
echo "🚀 Creating new ECS service..."
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_NAME \
  --task-definition $TASK_DEF_FAMILY \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678,subnet-87654321],securityGroups=[sg-12345678],assignPublicIp=ENABLED}" \
  --region $REGION

# Step 4: Wait for service to be stable
echo "⏳ Waiting for service to be stable..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION

# Step 5: Check final status
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
