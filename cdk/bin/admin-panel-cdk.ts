#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AdminPanelStack } from '../lib/admin-panel-stack';

const app = new cdk.App();

// Create the main stack
new AdminPanelStack(app, 'AdminPanelStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Admin Panel Infrastructure Stack',
});

app.synth(); 