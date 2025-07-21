import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class AdminPanelStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'AdminPanelVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      description: 'Security group for ECS services',
      allowAllOutbound: true,
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS instance',
      allowAllOutbound: false,
    });

    // Allow ALB to ECS
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow ALB to frontend'
    );
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8005),
      'Allow ALB to backend'
    );

    // Allow ECS to RDS
    rdsSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(27017),
      'Allow ECS to MongoDB'
    );

    // ECR Repositories
    const frontendRepo = new ecr.Repository(this, 'FrontendRepo', {
      repositoryName: 'admin-panel-frontend',
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const backendRepo = new ecr.Repository(this, 'BackendRepo', {
      repositoryName: 'admin-panel-backend',
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Secrets
    const dbSecret = new secretsmanager.Secret(this, 'DBSecret', {
      secretName: 'admin-panel/db-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ 
          username: 'admin',
          password: '{{password}}',
          host: '{{host}}',
          port: '3306',
          database: 'admin_panel'
        }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    const jwtSecret = new secretsmanager.Secret(this, 'JWTSecret', {
      secretName: 'admin-panel/jwt-secret',
      generateSecretString: {
        passwordLength: 32,
        excludeCharacters: '"@/\\',
      },
    });

    const stripeSecret = new secretsmanager.Secret(this, 'StripeSecret', {
      secretName: 'admin-panel/stripe-secret',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ 
          secretKey: 'sk_test_...',
          publishableKey: 'pk_test_...'
        }),
        generateStringKey: 'secretKey',
      },
    });

    // RDS MongoDB (using DocumentDB as MongoDB alternative)
    const dbCluster = new rds.DatabaseCluster(this, 'AdminPanelDB', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      instanceProps: {
        vpc,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.R5, ec2.InstanceSize.LARGE),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      },
      instances: 1,
      securityGroups: [rdsSecurityGroup],
      storageEncrypted: true,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'AdminPanelCluster', {
      vpc,
      clusterName: 'admin-panel-cluster',
      containerInsights: true,
    });

    // ECS Task Definition for Frontend
    const frontendTaskDef = new ecs.FargateTaskDefinition(this, 'FrontendTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const frontendContainer = frontendTaskDef.addContainer('FrontendContainer', {
      image: ecs.ContainerImage.fromEcrRepository(frontendRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'frontend',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://backend:8005',
      },
      portMappings: [{ containerPort: 3000 }],
    });

    // ECS Task Definition for Backend
    const backendTaskDef = new ecs.FargateTaskDefinition(this, 'BackendTaskDef', {
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    const backendContainer = backendTaskDef.addContainer('BackendContainer', {
      image: ecs.ContainerImage.fromEcrRepository(backendRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'backend',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '8005',
      },
      secrets: {
        DB_HOST: ecs.Secret.fromSecretsManager(dbSecret, 'host'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
        JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret, 'password'),
        STRIPE_SECRET_KEY: ecs.Secret.fromSecretsManager(stripeSecret, 'secretKey'),
      },
      portMappings: [{ containerPort: 8005 }],
    });

    // Application Load Balancer
    const alb = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'AdminPanelService', {
      cluster,
      taskDefinition: frontendTaskDef,
      desiredCount: 2,
      publicLoadBalancer: true,
      listenerPort: 80,
      serviceName: 'admin-panel-frontend',
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false,
    });

    // Add backend service to the same ALB
    const backendService = new ecs.FargateService(this, 'BackendService', {
      cluster,
      taskDefinition: backendTaskDef,
      desiredCount: 2,
      serviceName: 'admin-panel-backend',
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false,
    });

    // Add backend target group to ALB
    const backendTargetGroup = new cdk.aws_elasticloadbalancingv2.ApplicationTargetGroup(this, 'BackendTargetGroup', {
      vpc,
      port: 8005,
      protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
      targetType: cdk.aws_elasticloadbalancingv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
      },
    });

    // Add backend listener rule
    alb.loadBalancer.addListener('BackendListener', {
      port: 80,
      protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
      defaultAction: cdk.aws_elasticloadbalancingv2.ListenerAction.forward([backendTargetGroup]),
    }).addAction('BackendAction', {
      priority: 100,
      conditions: [
        cdk.aws_elasticloadbalancingv2.ListenerCondition.pathPatterns(['/api/*']),
      ],
      action: cdk.aws_elasticloadbalancingv2.ListenerAction.forward([backendTargetGroup]),
    });

    // Attach backend service to target group
    backendService.attachToApplicationTargetGroup(backendTargetGroup);

    // CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'CPUAlarm', {
      metric: alb.service.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'CPU utilization is too high',
    });

    const memoryAlarm = new cloudwatch.Alarm(this, 'MemoryAlarm', {
      metric: alb.service.metricMemoryUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'Memory utilization is too high',
    });

    // SNS Topic for notifications
    const notificationTopic = new sns.Topic(this, 'AdminPanelNotifications', {
      topicName: 'admin-panel-notifications',
    });

    // Add alarms to SNS topic
    cpuAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(notificationTopic));
    memoryAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(notificationTopic));

    // S3 Bucket for logs
    const logBucket = new s3.Bucket(this, 'AdminPanelLogs', {
      bucketName: `admin-panel-logs-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
      exportName: 'AdminPanelLoadBalancerDNS',
    });

    new cdk.CfnOutput(this, 'FrontendRepoURI', {
      value: frontendRepo.repositoryUri,
      description: 'Frontend ECR Repository URI',
      exportName: 'AdminPanelFrontendRepoURI',
    });

    new cdk.CfnOutput(this, 'BackendRepoURI', {
      value: backendRepo.repositoryUri,
      description: 'Backend ECR Repository URI',
      exportName: 'AdminPanelBackendRepoURI',
    });

    new cdk.CfnOutput(this, 'NotificationTopicARN', {
      value: notificationTopic.topicArn,
      description: 'SNS Notification Topic ARN',
      exportName: 'AdminPanelNotificationTopicARN',
    });
  }
} 