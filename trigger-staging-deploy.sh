#!/bin/bash
set -e

echo "🚀 Triggering new staging deployment..."

# Check if we're on develop branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo "❌ Error: You must be on the develop branch to trigger staging deployment"
    echo "Current branch: $CURRENT_BRANCH"
    echo "Please run: git checkout develop"
    exit 1
fi

# Create a deployment trigger file
echo "# Deployment trigger - $(date)" > deployment-trigger.md
echo "This file triggers a new staging deployment" >> deployment-trigger.md

# Add and commit the trigger file
git add deployment-trigger.md
git commit -m "Trigger staging deployment - $(date +%Y%m%d%H%M%S)"

# Push to develop branch to trigger GitHub Actions
echo "📤 Pushing to develop branch to trigger deployment..."
git push origin develop

echo "✅ Staging deployment triggered!"
echo ""
echo "📋 Next steps:"
echo "1. Check GitHub Actions: https://github.com/your-repo/actions"
echo "2. Monitor the 'Deploy to Staging' workflow"
echo "3. Wait for deployment to complete (usually 5-10 minutes)"
echo "4. Check staging URL: https://admin-test.xpectrum-ai.com"
echo ""
echo "🔍 If deployment fails:"
echo "1. Check GitHub Actions logs for errors"
echo "2. Verify environment variables are set correctly"
echo "3. Check ECS service status in AWS Console"
