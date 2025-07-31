#!/bin/bash
set -e

AWS_REGION=us-west-1
ACCOUNT_ID=641623447164

# ECR repository URI
REPO="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/admin-panel"

# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build, tag, and push frontend
cd ./frontend
docker build --build-arg NODE_ENV=production -t admin-panel:frontend-latest .
docker tag admin-panel:frontend-latest $REPO:frontend-latest
docker push $REPO:frontend-latest

# Build, tag, and push backend
cd ../backend
docker build --build-arg NODE_ENV=production -t admin-panel:backend-latest .
docker tag admin-panel:backend-latest $REPO:backend-latest
docker push $REPO:backend-latest

# Build, tag, and push calendar-backend
cd ../calendar-backend
docker build --build-arg PYTHON_ENV=production -t admin-panel:calendar-latest .
docker tag admin-panel:calendar-latest $REPO:calendar-latest
docker push $REPO:calendar-latest

echo "All images built and pushed successfully." 