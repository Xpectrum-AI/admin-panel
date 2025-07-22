#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GitHubActionsRole } from '../lib/github-actions-role';

const app = new cdk.App();

// Create the IAM setup stack
new GitHubActionsRole(app, 'GitHubActionsRoleStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-1',
  },
  description: 'GitHub Actions IAM Role and OIDC Setup',
});

app.synth(); 