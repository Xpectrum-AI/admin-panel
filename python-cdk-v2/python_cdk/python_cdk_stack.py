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
import os

class AdminPanelDeploymentStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get environment from context
        environment = self.node.try_get_context('environment') or 'staging'
        
        # Environment-specific configurations
        env_configs = {
            'staging': {
                'domain': 'admin-test.xpectrum-ai.com',
                'auth_domain': 'auth.admin-test.xpectrum-ai.com',
                'frontend_tag': 'frontend-staging',
                'frontend_port': '3000',
                'stack_name': 'AdminPanelStagingStack'
            },
            'production': {
                'domain': 'admin.xpectrum-ai.com',
                'auth_domain': 'auth.admin.xpectrum-ai.com',
                'frontend_tag': 'frontend-latest',
                'frontend_port': '3000',
                'stack_name': 'AdminPanelProductionStack'
            },
            'release': {
                'domain': 'release.placeholder.com',  # 占位符，实际会使用 ALB DNS
                'auth_domain': 'auth-release.placeholder.com',  # 占位符
                'frontend_tag': os.environ.get('RELEASE_IMAGE_TAG', 'frontend-release-latest'),
                'frontend_port': '3000',
                'stack_name': 'AdminPanelReleaseStack'
            }
        }
        
        config = env_configs.get(environment, env_configs['staging'])

        # Use 2 AZs but disable EIP allocation to avoid EIP limit issues
        vpc = ec2.Vpc(self, f"{config['stack_name']}Vpc", 
            max_azs=2,
            nat_gateways=0,  # Don't create NAT gateways (which require EIPs)
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name='public',
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name='private',
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )
        cluster = ecs.Cluster(self, f"{config['stack_name']}Cluster", vpc=vpc)

        # Use single ECR Repository by name
        repo = ecr.Repository.from_repository_name(self, f"{config['stack_name']}Repo", "admin-panel")

        # Task Role
        task_role = iam.Role(self, f"{config['stack_name']}TaskRole", assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"))

        # Get secrets from GitHub environment variables
        # These will be passed from GitHub Actions workflow
        # Use environment-specific prefix (保留原有的三环境支持)
        if environment == 'production':
            prefix = 'PRODUCTION_'
        elif environment == 'release':
            prefix = 'RELEASE_'
        else:
            prefix = 'STAGING_'
        
        secrets = {
            'NEXT_PUBLIC_PROPELAUTH_API_KEY': os.environ.get(f'{prefix}NEXT_PUBLIC_PROPELAUTH_API_KEY', ''),
            'NEXT_PUBLIC_API_KEY': os.environ.get(f'{prefix}NEXT_PUBLIC_API_KEY', ''),
            'SECRET_KEY': os.environ.get(f'{prefix}SECRET_KEY', ''),
            'PROPELAUTH_API_KEY': os.environ.get(f'{prefix}PROPELAUTH_API_KEY', ''),
            'PROPELAUTH_REDIRECT_URI': os.environ.get(f'{prefix}PROPELAUTH_REDIRECT_URI', f"https://{config['auth_domain']}"),
            'NEXT_PUBLIC_LIVE_API_URL': os.environ.get(f'{prefix}NEXT_PUBLIC_LIVE_API_URL', ''),
            'NEXT_PUBLIC_SUPER_ADMIN_ORG_ID': os.environ.get(f'{prefix}SUPER_ADMIN_ORG_ID', ''),
            'NEXT_PUBLIC_PROPELAUTH_URL': os.environ.get(f'{prefix}NEXT_PUBLIC_PROPELAUTH_URL', f"https://{config['auth_domain']}"),

            'API_KEY': os.environ.get(f'{prefix}API_KEY', 'xpectrum-ai@123'),
            'LIVE_API_KEY': os.environ.get(f'{prefix}LIVE_API_KEY', 'xpectrum-ai@123'),
        }

        current_account = os.environ.get('CDK_DEFAULT_ACCOUNT', '')
        is_new_account = current_account == '503561436224'
        is_release_env = environment == 'release'
        

        if not is_new_account and not is_release_env:
            # ACM Certificate - Use different certificates for staging and production
            if environment == 'staging':
                certificate = acm.Certificate.from_certificate_arn(
                    self, f"{config['stack_name']}Cert",
                    "arn:aws:acm:us-west-1:641623447164:certificate/99850dcb-97a8-4bed-bbed-6038e2c25e90"
                )
            else:
                certificate = acm.Certificate.from_certificate_arn(
                    self, f"{config['stack_name']}Cert",
                    "arn:aws:acm:us-west-1:641623447164:certificate/887e5136-d78f-4a0b-aad0-7e9c2b74238b"
                )

        # Fargate Task Definition - Frontend only
        task = ecs.FargateTaskDefinition(self, f"{config['stack_name']}Task", memory_limit_mib=1024, cpu=512)

        # Frontend container only
        task.add_container(
            "FrontendContainer",
            image=ecs.ContainerImage.from_ecr_repository(repo, tag=config['frontend_tag']),
            logging=ecs.LogDriver.aws_logs(stream_prefix="frontend"),
            environment={
                "NEXT_PUBLIC_PROPELAUTH_API_KEY": secrets["NEXT_PUBLIC_PROPELAUTH_API_KEY"],
                "NEXT_PUBLIC_API_KEY": secrets["NEXT_PUBLIC_API_KEY"],
                "SECRET_KEY": secrets["SECRET_KEY"],
                "PROPELAUTH_API_KEY": secrets["PROPELAUTH_API_KEY"],
                "PROPELAUTH_REDIRECT_URI": secrets["PROPELAUTH_REDIRECT_URI"],
                "NEXT_PUBLIC_LIVE_API_URL": secrets["NEXT_PUBLIC_LIVE_API_URL"],
                "NEXT_PUBLIC_SUPER_ADMIN_ORG_ID": secrets["NEXT_PUBLIC_SUPER_ADMIN_ORG_ID"],
                "NEXT_PUBLIC_DEFAULT_TIMEZONE": "America/New_York",
                "NEXT_PUBLIC_TIMEZONE_OPTIONS": "IST:Asia/Kolkata,EST:America/New_York,PST:America/Los_Angeles",
                "NEXT_PUBLIC_GOOGLE_CALENDAR_API_URL": "https://www.googleapis.com/calendar/v3",
                "NEXT_PUBLIC_DATABASE_NAME": "google_oauth",
                "NEXT_PUBLIC_AUTH_URL": f"https://{config['auth_domain']}",
                "NEXT_PUBLIC_PROPELAUTH_URL": secrets["NEXT_PUBLIC_PROPELAUTH_URL"],
                "NEXT_PUBLIC_CALENDAR_API_URL": f"https://{config['domain']}/calendar-api",
                "NEXT_PUBLIC_API_BASE_URL": f"https://{config['domain']}/calendar-api",
                "NEXT_PUBLIC_API_URL": f"https://{config['domain']}/api",
                "NEXT_PUBLIC_APP_TITLE": "Admin Panel Calendar Services",
                "NEXT_PUBLIC_APP_DESCRIPTION": "Calendar Services Management Dashboard",
                "NEXT_PUBLIC_AUTH_TOKEN_KEY": "auth_token",
                "NEXT_PUBLIC_PENDING_FIRST_NAME_KEY": "pending_first_name",
                "NEXT_PUBLIC_PENDING_LAST_NAME_KEY": "pending_last_name",
                "NEXT_PUBLIC_TIMEZONE_KEY": "selected_timezone",
                "NODE_ENV": environment,
                "PORT": config['frontend_port'],
                "HOST": "0.0.0.0",
                # 新增的环境变量
                "API_KEY": secrets["API_KEY"],
                "LIVE_API_KEY": secrets["LIVE_API_KEY"]
            },
            port_mappings=[ecs.PortMapping(container_port=int(config['frontend_port']))]
        )

        # Fargate Service (2 tasks)
        service = ecs.FargateService(
            self, f"{config['stack_name']}Service", 
            cluster=cluster, 
            task_definition=task, 
            desired_count=2, 
            assign_public_ip=True,
            # Add deployment configuration to prevent warnings
            min_healthy_percent=100,
            max_healthy_percent=200,
            # Add deployment configuration
            deployment_configuration=ecs.DeploymentConfiguration(
                max_healthy_percent=200,
                min_healthy_percent=100,
                deployment_circuit_breaker=ecs.DeploymentCircuitBreaker(rollback=True)
            )
        )

        # ALB
        lb = elbv2.ApplicationLoadBalancer(self, f"{config['stack_name']}ALB", vpc=vpc, internet_facing=True)
        
        
        if not is_new_account and not is_release_env:
            
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
            # Add targets to HTTPS listener
            https_listener.add_targets(
                "FrontendDefault",
                port=int(config['frontend_port']),
                protocol=elbv2.ApplicationProtocol.HTTP,
                targets=[service],
                health_check=elbv2.HealthCheck(path="/api/health", port=str(config['frontend_port']), healthy_http_codes="200-399")
            )
        else:
           
            http_listener = lb.add_listener(
                "HttpListener",
                port=80,
                protocol=elbv2.ApplicationProtocol.HTTP,
                open=True
            )
            http_listener.add_targets(
                "FrontendDefault",
                port=int(config['frontend_port']),
                protocol=elbv2.ApplicationProtocol.HTTP,
                targets=[service],
                health_check=elbv2.HealthCheck(path="/api/health", port=str(config['frontend_port']), healthy_http_codes="200-399")
            )

      
        if not is_new_account and not is_release_env:
            CfnOutput(self, "FrontendURL", value=f"https://{lb.load_balancer_dns_name}")
        else:
            CfnOutput(self, "FrontendURL", value=f"http://{lb.load_balancer_dns_name}")
            
        CfnOutput(self, "LoadBalancerDNS", value=lb.load_balancer_dns_name)
        CfnOutput(self, "Environment", value=environment)
        CfnOutput(self, "AccountID", value=current_account)
        CfnOutput(self, "ClusterName", value=cluster.cluster_name)
        CfnOutput(self, "ServiceName", value=service.service_name)
        
      
        if is_release_env:
            CfnOutput(self, "ReleaseInfo", value=f"Release environment deployed without custom domain")
            CfnOutput(self, "NextStep", value="Update domain configuration with ALB DNS after deployment")