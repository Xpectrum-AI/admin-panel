#!/bin/bash
set -e

echo "🔧 Force deploying ECS service..."

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
echo "  ECR Repo: $REPO_URI"

# Get the current task definition family
echo "🔍 Getting current task definition..."
TASK_DEF_ARN=$(aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION \
  --query 'services[0].taskDefinition' \
  --output text 2>/dev/null || echo "")

if [ -z "$TASK_DEF_ARN" ] || [ "$TASK_DEF_ARN" = "None" ]; then
  echo "❌ No task definition found. Creating new one..."
  
  # Create a new task definition
  TASK_DEF_FAMILY="AdminPanelStagingStack-AdminPanelStagingStackTaskDefinition"
  
  # Register new task definition
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
else
  echo "✅ Found existing task definition: $TASK_DEF_ARN"
  TASK_DEF_FAMILY=$(echo $TASK_DEF_ARN | cut -d'/' -f2 | cut -d':' -f1)
fi

# Force new deployment
echo "🚀 Forcing new deployment..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition $TASK_DEF_FAMILY \
  --desired-count 2 \
  --force-new-deployment \
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
