#!/bin/bash
set -e

AWS_REGION=us-west-1
ACCOUNT_ID=641623447164

# ECR repository URIs
FRONTEND_REPO="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/admin-panel-frontend"
BACKEND_REPO="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/admin-panel-backend"
CALENDAR_REPO="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/admin-panel-calendar"

# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build, tag, and push frontend
cd ../frontend
docker build -t admin-panel-frontend .
docker tag admin-panel-frontend:latest $FRONTEND_REPO:latest
docker push $FRONTEND_REPO:latest

# Build, tag, and push backend
cd ../backend
docker build -t admin-panel-backend .
docker tag admin-panel-backend:latest $BACKEND_REPO:latest
docker push $BACKEND_REPO:latest

# Build, tag, and push calendar-backend
cd ../calendar-backend
docker build -t admin-panel-calendar .
docker tag admin-panel-calendar:latest $CALENDAR_REPO:latest
docker push $CALENDAR_REPO:latest

echo "All images built and pushed successfully." 