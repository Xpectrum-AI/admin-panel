# AWS CDK Deployment for Admin Panel

This directory contains the AWS CDK infrastructure code for deploying the Admin Panel application to AWS.

## Architecture Overview

The deployment creates the following AWS resources:

- **VPC** with public and private subnets across 2 AZs
- **ECS Fargate** cluster running frontend and backend containers
- **Application Load Balancer** for traffic distribution
- **RDS Aurora** database cluster
- **ECR** repositories for Docker images
- **Secrets Manager** for sensitive configuration
- **CloudWatch** alarms and logging
- **SNS** topics for notifications
- **S3** bucket for logs

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Node.js** 18+ installed
3. **Docker** installed and running
4. **GitHub repository** with the application code

## Setup Instructions

### 1. Install Dependencies

```bash
cd cdk
npm install
```

### 2. Bootstrap CDK (First time only)

```bash
cdk bootstrap
```

### 3. Set up IAM Roles and OIDC

First, deploy the IAM setup stack:

```bash
cdk deploy GitHubActionsRoleStack
```

This creates:
- GitHub OIDC Provider
- IAM Role for GitHub Actions
- Required permissions for deployment

### 4. Update GitHub Repository

1. Add the following secrets to your GitHub repository:
   - `AWS_ACCOUNT_ID`: Your AWS account ID
   - `SLACK_WEBHOOK_URL`: Slack webhook URL for notifications

2. Update the OIDC role in `cdk/lib/github-actions-role.ts`:
   - Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username

### 5. Deploy the Main Infrastructure

```bash
cdk deploy AdminPanelStack
```

## GitHub Actions Workflow

The workflow (`/.github/workflows/deploy.yml`) includes:

1. **Test Stage**: Runs linting and tests
2. **Build Stage**: Builds and pushes Docker images to ECR
3. **Deploy Stage**: Deploys infrastructure using CDK
4. **Notifications**: Slack notifications for all stages

## Environment Variables

The following environment variables are automatically managed:

- `MONGODB_URI`: Database connection string
- `JWT_SECRET`: JWT signing secret
- `STRIPE_SECRET_KEY`: Stripe API key
- `NODE_ENV`: Set to 'production'

## Monitoring and Alerts

- **CloudWatch Alarms**: CPU and Memory utilization
- **SNS Notifications**: Slack integration for alerts
- **ECS Service Logs**: Available in CloudWatch Logs

## Scaling

The ECS services are configured with:
- **Frontend**: 2 instances, 256 CPU units, 512MB memory
- **Backend**: 2 instances, 512 CPU units, 1024MB memory

Auto-scaling can be enabled based on CPU/Memory metrics.

## Security

- All containers run in private subnets
- Database is in isolated subnet
- Secrets are stored in AWS Secrets Manager
- Load Balancer has security groups restricting access
- IAM roles follow least privilege principle

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Required**
   ```bash
   cdk bootstrap
   ```

2. **IAM Permissions**
   - Ensure the GitHub Actions role has required permissions
   - Check CloudTrail logs for permission errors

3. **Container Health Checks**
   - Verify health check endpoints are working
   - Check ECS service logs in CloudWatch

4. **Database Connection**
   - Verify security group rules
   - Check Secrets Manager for correct connection string

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
```

## Cost Optimization

- Use Spot instances for non-critical workloads
- Enable auto-scaling based on demand
- Set up CloudWatch budgets
- Use S3 lifecycle policies for log retention

## Backup and Recovery

- RDS automated backups enabled (7 days retention)
- ECR images are versioned
- S3 bucket versioning enabled
- CloudFormation templates provide infrastructure as code

## Updates and Maintenance

1. **Application Updates**: Push to main branch triggers automatic deployment
2. **Infrastructure Updates**: Modify CDK code and run `cdk deploy`
3. **Security Updates**: Regularly update base images and dependencies
4. **Monitoring**: Review CloudWatch metrics and alarms regularly 