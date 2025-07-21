#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimpleAdminPanelStack } from '../lib/simple-admin-panel-stack';

const app = new cdk.App();

// Create the simplified stack
new SimpleAdminPanelStack(app, 'SimpleAdminPanelStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Simplified Admin Panel Infrastructure Stack',
});

app.synth(); 