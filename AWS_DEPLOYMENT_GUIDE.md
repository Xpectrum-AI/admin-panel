# AWS CDK Deployment Guide for Admin Panel

This guide provides step-by-step instructions for deploying the Admin Panel application to AWS using CDK, GitHub Actions, and Slack notifications.

## 🏗️ Architecture Overview

The deployment creates a modern, scalable infrastructure with:

- **ECS Fargate** for containerized applications
- **Application Load Balancer** for traffic distribution
- **RDS Aurora** for database
- **ECR** for Docker image storage
- **Secrets Manager** for secure configuration
- **CloudWatch** for monitoring and alerting
- **SNS** for notifications
- **GitHub Actions** with OIDC for secure deployments

## 📋 Prerequisites

Before starting, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js 18+** installed
4. **Docker** installed and running
5. **GitHub repository** with your application code
6. **Slack workspace** with webhook access

## 🚀 Quick Start

### Step 1: Clone and Setup

```bash
# Clone your repository
git clone <your-repo-url>
cd admin-panel

# Make setup script executable
chmod +x setup-deployment.sh

# Run the automated setup
./setup-deployment.sh
```

### Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_ACCOUNT_ID` | Your AWS Account ID | Used for OIDC authentication |
| `SLACK_WEBHOOK_URL` | Your Slack webhook URL | For deployment notifications |

### Step 3: Update OIDC Configuration

Edit `cdk/lib/github-actions-role.ts` and replace:
```typescript
'token.actions.githubusercontent.com:sub': 'repo:YOUR_GITHUB_USERNAME/admin-panel:*',
```

With your actual GitHub username:
```typescript
'token.actions.githubusercontent.com:sub': 'repo:your-username/admin-panel:*',
```

### Step 4: Deploy Infrastructure

```bash
cd cdk

# Deploy IAM roles first
cdk deploy GitHubActionsRoleStack

# Deploy main infrastructure
cdk deploy AdminPanelStack
```

## 🔧 Manual Setup (Alternative)

If you prefer manual setup, follow these steps:

### 1. Install Dependencies

```bash
cd cdk
npm install
```

### 2. Bootstrap CDK

```bash
cdk bootstrap
```

### 3. Deploy IAM Stack

```bash
cdk deploy GitHubActionsRoleStack --require-approval never
```

### 4. Deploy Main Infrastructure

```bash
cdk deploy AdminPanelStack --require-approval never
```

## 🔄 GitHub Actions Workflow

The workflow (`/.github/workflows/deploy.yml`) includes:

### Stages:
1. **Test**: Runs linting and tests
2. **Build**: Builds and pushes Docker images to ECR
3. **Deploy**: Deploys infrastructure using CDK
4. **Notify**: Sends Slack notifications

### Triggers:
- Push to `main` branch
- Push to `develop` branch (test only)
- Pull requests to `main` branch
- Manual workflow dispatch

## 🔐 Security Features

### OIDC Authentication
- No long-term AWS credentials stored in GitHub
- Temporary credentials generated for each deployment
- Fine-grained access control

### IAM Roles and Policies
- Least privilege principle
- Separate roles for different operations
- Automatic credential rotation

### Network Security
- VPC with public/private subnets
- Security groups restricting access
- Database in isolated subnet

## 📊 Monitoring and Alerting

### CloudWatch Alarms
- CPU utilization > 80%
- Memory utilization > 80%
- Custom metrics for application health

### Slack Notifications
- Deployment success/failure
- Test results
- Build completion
- Infrastructure alerts

### Logging
- ECS service logs in CloudWatch
- Application logs with structured format
- S3 bucket for log storage

## 🏗️ Infrastructure Components

### VPC
- 2 Availability Zones
- Public subnets for ALB
- Private subnets for ECS
- Isolated subnets for RDS

### ECS Fargate
- **Frontend**: 2 instances, 256 CPU, 512MB RAM
- **Backend**: 2 instances, 512 CPU, 1024MB RAM
- Auto-scaling based on metrics

### Load Balancer
- Application Load Balancer
- Health checks for both services
- SSL termination (HTTPS)
- Path-based routing (`/api/*` → backend)

### Database
- RDS Aurora MySQL
- Multi-AZ deployment
- Automated backups
- Encryption at rest

## 🔧 Configuration

### Environment Variables

The following are automatically managed:

| Variable | Source | Description |
|----------|--------|-------------|
| `MONGODB_URI` | Secrets Manager | Database connection string |
| `JWT_SECRET` | Secrets Manager | JWT signing secret |
| `STRIPE_SECRET_KEY` | Secrets Manager | Stripe API key |
| `NODE_ENV` | Container | Set to 'production' |

### Secrets Management

Secrets are stored in AWS Secrets Manager:
- Database credentials
- JWT signing secrets
- API keys
- Connection strings

## 🚨 Troubleshooting

### Common Issues

#### 1. CDK Bootstrap Required
```bash
cdk bootstrap
```

#### 2. IAM Permissions
```bash
# Check CloudTrail for permission errors
aws logs describe-log-groups --log-group-name-prefix CloudTrail
```

#### 3. Container Health Checks
```bash
# Check ECS service logs
aws logs describe-log-groups --log-group-name-prefix /ecs/
```

#### 4. Database Connection
```bash
# Verify security group rules
aws ec2 describe-security-groups --group-names AdminPanelRDSSecurityGroup
```

### Useful Commands

```bash
# View stack status
cdk ls

# View stack outputs
cdk outputs

# Destroy infrastructure
cdk destroy --all

# View CloudFormation events
aws cloudformation describe-stack-events --stack-name AdminPanelStack

# View ECS service logs
aws logs describe-log-groups --log-group-name-prefix /ecs/

# Check ECR repositories
aws ecr describe-repositories

# View ALB target health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```

## 💰 Cost Optimization

### Recommendations:
1. **Use Spot instances** for non-critical workloads
2. **Enable auto-scaling** based on demand
3. **Set up CloudWatch budgets**
4. **Use S3 lifecycle policies** for log retention
5. **Monitor unused resources** regularly

### Estimated Costs (us-east-1):
- ECS Fargate: ~$50-100/month
- RDS Aurora: ~$30-60/month
- ALB: ~$20/month
- CloudWatch: ~$10-20/month
- **Total**: ~$110-200/month

## 🔄 Updates and Maintenance

### Application Updates
1. Push code to `main` branch
2. GitHub Actions automatically deploys
3. Monitor deployment in Actions tab

### Infrastructure Updates
1. Modify CDK code
2. Run `cdk deploy`
3. Review changes with `cdk diff`

### Security Updates
1. Update base Docker images
2. Rotate secrets regularly
3. Review IAM permissions
4. Update dependencies

## 📞 Support

For issues or questions:

1. Check CloudWatch logs for application errors
2. Review GitHub Actions logs for deployment issues
3. Check AWS CloudTrail for permission problems
4. Monitor CloudWatch alarms for infrastructure issues

## 🔗 Useful Links

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ECS Fargate Documentation](https://docs.aws.amazon.com/ecs/)
- [RDS Aurora Documentation](https://docs.aws.amazon.com/rds/aurora/) 