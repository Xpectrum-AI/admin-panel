import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class GitHubActionsRole extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create OIDC Provider for GitHub
    const githubOidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOIDCProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
      thumbprints: [
        '6938fd4d98bab03faadb97b34396831e3780aea1',
        '1c58a3a8518e8759bf075b76b750d4f2df264fcd',
      ],
    });

    // Create IAM Role for GitHub Actions
    const githubActionsRole = new iam.Role(this, 'GitHubActionsRole', {
      roleName: 'github-actions-role',
      assumedBy: new iam.WebIdentityPrincipal(githubOidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': 'repo:YOUR_GITHUB_USERNAME/admin-panel:*',
        },
      }),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonECS-FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerServiceFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSNSFullAccess'),
      ],
    });

    // Custom policy for CDK deployment
    const cdkDeployPolicy = new iam.Policy(this, 'CDKDeployPolicy', {
      policyName: 'cdk-deploy-policy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'cloudformation:*',
            'iam:*',
            'ec2:*',
            'ecs:*',
            'ecr:*',
            'rds:*',
            'secretsmanager:*',
            's3:*',
            'cloudwatch:*',
            'sns:*',
            'logs:*',
            'elasticloadbalancing:*',
            'autoscaling:*',
            'application-autoscaling:*',
            'servicediscovery:*',
            'route53:*',
            'acm:*',
            'wafv2:*',
            'shield:*',
          ],
          resources: ['*'],
        }),
      ],
    });

    githubActionsRole.attachInlinePolicy(cdkDeployPolicy);

    // Output the role ARN
    new cdk.CfnOutput(this, 'GitHubActionsRoleARN', {
      value: githubActionsRole.roleArn,
      description: 'GitHub Actions Role ARN',
      exportName: 'GitHubActionsRoleARN',
    });

    new cdk.CfnOutput(this, 'OIDCProviderARN', {
      value: githubOidcProvider.openIdConnectProviderArn,
      description: 'GitHub OIDC Provider ARN',
      exportName: 'GitHubOIDCProviderARN',
    });
  }
} 