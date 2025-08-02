from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecr as ecr,
    aws_iam as iam,
    aws_elasticloadbalancingv2 as elbv2,
    aws_certificatemanager as acm,
    CfnOutput
)
from constructs import Construct

class AdminPanelDeploymentStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get environment from context
        environment = self.node.try_get_context('environment') or 'staging'
        
        # Environment-specific configurations
        env_configs = {
            'staging': {
                'domain': 'localhost',
                'auth_domain': '181249979.propelauthtest.com',
                'frontend_tag': 'frontend-staging',
                'frontend_port': '3000'
            },
            'production': {
                'domain': 'admin-test.xpectrum-ai.com',
                'auth_domain': 'auth.admin-test.xpectrum-ai.com',
                'frontend_tag': 'frontend-latest',
                'frontend_port': '3000'
            }
        }
        
        config = env_configs.get(environment, env_configs['staging'])

        # Use single AZ to avoid EIP limit issues
        vpc = ec2.Vpc(self, "AdminPanelVpc", max_azs=1)
        cluster = ecs.Cluster(self, "AdminPanelCluster", vpc=vpc)

        # Use single ECR Repository by name
        repo = ecr.Repository.from_repository_name(self, "AdminPanelRepo", "admin-panel")

        # Task Role
        task_role = iam.Role(self, "AdminPanelTaskRole", assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"))

        # Environment-specific configurations for secrets
        env_secrets = {
            'staging': {
                'NEXT_PUBLIC_PROPELAUTH_API_KEY': '888ea8af8e1d78888fcb15304e2633446516519573b7f6219943b306a4626df95d477061f77b939b8cdadd7a50559a6c',
                'NEXT_PUBLIC_API_KEY': 'xpectrum-ai@123',
                'NEXT_PUBLIC_GOOGLE_CLIENT_ID': '441654168539-9tfk7ibkt2r9tbsoohpjjfmjjn8u4lf0.apps.googleusercontent.com',
                'NEXT_PUBLIC_MONGODB_URL': 'mongodb+srv://mongo_access:3gfaAKMQsCwEjIXG@cluster0.4os5zqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
                'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'pk_test_your_stripe_key',
                'SECRET_KEY': 'your_secret_key_for_sessions_change_this_in_production'
            },
            'production': {
                'NEXT_PUBLIC_PROPELAUTH_API_KEY': '41f5b65faf738abef77864b5753afd5d7f12231eb4556a14667b6cc3a8e0e103830a9789e8ee5a54773d9f512f11d17a',
                'NEXT_PUBLIC_API_KEY': 'xpectrum-ai@123',
                'NEXT_PUBLIC_GOOGLE_CLIENT_ID': '441654168539-9tfk7ibkt2r9tbsoohpjjfmjjn8u4lf0.apps.googleusercontent.com',
                'NEXT_PUBLIC_MONGODB_URL': 'mongodb+srv://mongo_access:3gfaAKMQsCwEjIXG@cluster0.4os5zqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
                'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'pk_test_your_stripe_key',
                'SECRET_KEY': 'your_secret_key_for_sessions_change_this_in_production'
            }
        }
        
        secrets = env_secrets.get(environment, env_secrets['staging'])

        # ACM Certificate
        certificate = acm.Certificate.from_certificate_arn(
            self, "AdminPanelCert",
            "arn:aws:acm:us-west-1:641623447164:certificate/ab2020ef-9a74-4e25-b59e-3e29066dd0a0"
        )

        # Fargate Task Definition - Frontend only
        task = ecs.FargateTaskDefinition(self, "AdminPanelTask", memory_limit_mib=1024, cpu=512)

        # Frontend container only
        task.add_container(
            "FrontendContainer",
            image=ecs.ContainerImage.from_ecr_repository(repo, tag=config['frontend_tag']),
            logging=ecs.LogDriver.aws_logs(stream_prefix="frontend"),
            environment={
                "NEXT_PUBLIC_PROPELAUTH_API_KEY": secrets["NEXT_PUBLIC_PROPELAUTH_API_KEY"],
                "NEXT_PUBLIC_API_KEY": secrets["NEXT_PUBLIC_API_KEY"],
                "NEXT_PUBLIC_GOOGLE_CLIENT_ID": secrets["NEXT_PUBLIC_GOOGLE_CLIENT_ID"],
                "NEXT_PUBLIC_MONGODB_URL": secrets["NEXT_PUBLIC_MONGODB_URL"],
                "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": secrets["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
                "SECRET_KEY": secrets["SECRET_KEY"],
                "PROPELAUTH_REDIRECT_URI": f"https://{config['auth_domain']}",
                "NEXT_PUBLIC_DEFAULT_TIMEZONE": "America/New_York",
                "NEXT_PUBLIC_TIMEZONE_OPTIONS": "IST:Asia/Kolkata,EST:America/New_York,PST:America/Los_Angeles",
                "NEXT_PUBLIC_GOOGLE_CALENDAR_API_URL": "https://www.googleapis.com/calendar/v3",
                "NEXT_PUBLIC_DATABASE_NAME": "google_oauth",
                "NEXT_PUBLIC_AUTH_URL": f"https://{config['auth_domain']}",
                "NEXT_PUBLIC_PROPELAUTH_URL": f"https://{config['auth_domain']}",
                "NODE_ENV": environment,
                "PORT": config['frontend_port'],
                "HOST": "0.0.0.0"
            },
            port_mappings=[ecs.PortMapping(container_port=int(config['frontend_port']))]
        )

        # Fargate Service (2 tasks)
        service = ecs.FargateService(
            self, "AdminPanelService", 
            cluster=cluster, 
            task_definition=task, 
            desired_count=2, 
            assign_public_ip=True,
            # Add deployment configuration to prevent warnings
            min_healthy_percent=100,
            max_healthy_percent=200
        )

        # ALB
        lb = elbv2.ApplicationLoadBalancer(self, "AdminPanelALB", vpc=vpc, internet_facing=True)
        https_listener = lb.add_listener(
            "HttpsListener",
            port=443,
            certificates=[certificate],
            protocol=elbv2.ApplicationProtocol.HTTPS,
            open=True
        )
        # HTTP redirect
        lb.add_listener(
            "HttpListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.redirect(
                protocol="HTTPS",
                port="443",
                permanent=True
            )
        )

        # Listener rules for frontend only
        # Frontend (default)
        https_listener.add_targets(
            "FrontendDefault",
            port=int(config['frontend_port']),
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[service],
            health_check=elbv2.HealthCheck(path="/api/health", port=str(config['frontend_port']), healthy_http_codes="200-399")
        )

        CfnOutput(self, "FrontendURL", value=f"https://{lb.load_balancer_dns_name}")
        CfnOutput(self, "LoadBalancerDNS", value=lb.load_balancer_dns_name)
