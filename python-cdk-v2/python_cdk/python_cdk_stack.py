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
        environment = self.node.try_get_context('environment') or 'development'
        
        # Environment-specific configurations
        env_configs = {
            'development': {
                'doctor_domain': 'admin-dev.xpectrum-ai.com',
                'developer_domain': 'developer-dev.xpectrum-ai.com',
                'auth_domain': 'auth.admin-dev.xpectrum-ai.com',
                'developer_auth_domain': 'auth.developer-dev.xpectrum-ai.com',
                'frontend_tag': 'frontend-development',
                'frontend_developer_tag': 'frontend-developer-development',
                'frontend_port': '3000',
                'frontend_developer_port': '3001',
                'stack_name': 'AdminPanelDevelopmentStack',
                'cluster_name': 'admin-panel-development',
                'service_name': 'admin-panel-service-development',
                'developer_service_name': 'admin-panel-developer-service-development'
            },
            'production': {
                'doctor_domain': 'admin.xpectrum-ai.com',
                'developer_domain': 'developer.xpectrum-ai.com',
                'auth_domain': 'auth.admin.xpectrum-ai.com',
                'developer_auth_domain': 'auth.developer.xpectrum-ai.com',
                'frontend_tag': 'frontend-latest',
                'frontend_developer_tag': 'frontend-developer-latest',
                'frontend_port': '3000',
                'frontend_developer_port': '3001',
                'stack_name': 'AdminPanelProductionStack',
                'cluster_name': 'admin-panel-production',
                'service_name': 'admin-panel-service-production',
                'developer_service_name': 'admin-panel-developer-service-production'
            },
            'release': {
                'doctor_domain': 'admin-release.xpectrum-ai.com',
                'developer_domain': 'developer-release.xpectrum-ai.com',
                'auth_domain': 'auth.admin-release.xpectrum-ai.com',
                'developer_auth_domain': 'auth.developer-release.xpectrum-ai.com',
                'frontend_tag': os.environ.get('RELEASE_IMAGE_TAG', 'frontend-release-latest'),
                'frontend_developer_tag': os.environ.get('RELEASE_DEVELOPER_IMAGE_TAG', 'frontend-developer-release-latest'),
                'frontend_port': '3000',
                'frontend_developer_port': '3001',
                'stack_name': 'AdminPanelReleaseStack',
                'cluster_name': 'admin-panel-release',
                'service_name': 'admin-panel-service-release',
                'developer_service_name': 'admin-panel-developer-service-release'
            }
        }
        
        config = env_configs.get(environment, env_configs['development'])

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
        
        # Create cluster with specific name
        cluster = ecs.Cluster(self, f"{config['stack_name']}Cluster", 
            vpc=vpc,
            cluster_name=config['cluster_name']
        )

        # Use single ECR Repository by name
        repo = ecr.Repository.from_repository_name(self, f"{config['stack_name']}Repo", "admin-panel")

        # Task Role
        task_role = iam.Role(self, f"{config['stack_name']}TaskRole", assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"))

        current_account = os.environ.get('CDK_DEFAULT_ACCOUNT', '')
        is_new_account = current_account == '503561436224'
        is_release_env = environment == 'release'
        

        # Certificate configuration for different environments
        if environment == 'development':
            # Development certificate (covers both admin-dev and developer-dev domains)
            certificate = acm.Certificate.from_certificate_arn(
                self, f"{config['stack_name']}Cert",
                "arn:aws:acm:us-west-1:641623447164:certificate/9b1d1f93-1039-4222-bcde-312f7198c82d"
            )
        elif environment in ['production', 'release']:
            # Production/Release certificate (account 503561436224 - wildcard certificate)
            certificate = acm.Certificate.from_certificate_arn(
                self, f"{config['stack_name']}Cert",
                "arn:aws:acm:us-west-1:503561436224:certificate/e4c6c688-9d4f-48ce-b3fa-5972d8fe2b57"
            )
        else:
            # Fallback for any other environment
            certificate = acm.Certificate.from_certificate_arn(
                self, f"{config['stack_name']}Cert",
                "arn:aws:acm:us-west-1:641623447164:certificate/9b1d1f93-1039-4222-bcde-312f7198c82d"
            )

        # Fargate Task Definition - Main Frontend (Doctor Service)
        main_task = ecs.FargateTaskDefinition(self, f"{config['stack_name']}MainTask", memory_limit_mib=1024, cpu=512)

        # Main Frontend container
        main_task.add_container(
            "MainFrontendContainer",
            image=ecs.ContainerImage.from_ecr_repository(repo, tag=config['frontend_tag']),
            logging=ecs.LogDriver.aws_logs(stream_prefix="main-frontend"),
            environment={
                "NODE_ENV": environment,
                "PORT": config['frontend_port'],
                "HOST": "0.0.0.0",
                # Backend API
                "NEXT_PUBLIC_LIVE_API_URL": os.environ.get('PRODUCTION_LIVE_API_URL' if environment == 'production' else 'DEV_LIVE_API_URL', ''),
                "NEXT_PUBLIC_LIVE_API_KEY": os.environ.get('PRODUCTION_LIVE_API_KEY' if environment == 'production' else 'DEV_LIVE_API_KEY', ''),
                # PropelAuth
                "NEXT_PUBLIC_PROPELAUTH_URL": os.environ.get('PRODUCTION_PROPELAUTH_URL' if environment == 'production' else 'DEV_PROPELAUTH_URL', ''),
                "NEXT_PUBLIC_PROPELAUTH_API_KEY": os.environ.get('PRODUCTION_PROPELAUTH_API_KEY' if environment == 'production' else 'DEV_PROPELAUTH_API_KEY', ''),
                # Model Configuration API
                "NEXT_PUBLIC_MODEL_API_BASE_URL": os.environ.get('PRODUCTION_MODEL_API_BASE_URL' if environment == 'production' else 'DEV_MODEL_API_BASE_URL', ''),
                "NEXT_PUBLIC_MODEL_API_KEY": os.environ.get('PRODUCTION_MODEL_API_KEY' if environment == 'production' else 'DEV_MODEL_API_KEY', ''),
                # Chatbot API
                "NEXT_PUBLIC_CHATBOT_API_URL": os.environ.get('PRODUCTION_CHATBOT_API_URL' if environment == 'production' else 'DEV_CHATBOT_API_URL', ''),
                "NEXT_PUBLIC_CHATBOT_API_KEY": os.environ.get('PRODUCTION_CHATBOT_API_KEY' if environment == 'production' else 'DEV_CHATBOT_API_KEY', ''),
                # Voice Provider API Keys
                "NEXT_PUBLIC_ELEVEN_LABS_API_KEY": os.environ.get('PRODUCTION_ELEVEN_LABS_API_KEY' if environment == 'production' else 'DEV_ELEVEN_LABS_API_KEY', ''),
                "NEXT_PUBLIC_OPEN_AI_API_KEY": os.environ.get('PRODUCTION_OPEN_AI_API_KEY' if environment == 'production' else 'DEV_OPEN_AI_API_KEY', ''),
                "NEXT_PUBLIC_WHISPER_API_KEY": os.environ.get('PRODUCTION_WHISPER_API_KEY' if environment == 'production' else 'DEV_WHISPER_API_KEY', ''),
                "NEXT_PUBLIC_DEEPGRAM_API_KEY": os.environ.get('PRODUCTION_DEEPGRAM_API_KEY' if environment == 'production' else 'DEV_DEEPGRAM_API_KEY', ''),
                "NEXT_PUBLIC_CARTESIA_API_KEY": os.environ.get('PRODUCTION_CARTESIA_API_KEY' if environment == 'production' else 'DEV_CARTESIA_API_KEY', ''),
                # Voice Provider Voice IDs
                "NEXT_PUBLIC_CARTESIA_VOICE_ID": os.environ.get('PRODUCTION_CARTESIA_VOICE_ID' if environment == 'production' else 'DEV_CARTESIA_VOICE_ID', ''),
                "NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID": os.environ.get('PRODUCTION_ELEVEN_LABS_VOICE_ID' if environment == 'production' else 'DEV_ELEVEN_LABS_VOICE_ID', ''),
                # Dify Configuration
                "NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN": os.environ.get('PRODUCTION_DIFY_CONSOLE_ORIGIN' if environment == 'production' else 'DEV_DIFY_CONSOLE_ORIGIN', ''),
                "NEXT_PUBLIC_DIFY_ADMIN_EMAIL": os.environ.get('PRODUCTION_DIFY_ADMIN_EMAIL' if environment == 'production' else 'DEV_DIFY_ADMIN_EMAIL', ''),
                "NEXT_PUBLIC_DIFY_ADMIN_PASSWORD": os.environ.get('PRODUCTION_DIFY_ADMIN_PASSWORD' if environment == 'production' else 'DEV_DIFY_ADMIN_PASSWORD', ''),
                "NEXT_PUBLIC_DIFY_WORKSPACE_ID": os.environ.get('PRODUCTION_DIFY_WORKSPACE_ID' if environment == 'production' else 'DEV_DIFY_WORKSPACE_ID', ''),
            },
            port_mappings=[ecs.PortMapping(container_port=int(config['frontend_port']))]
        )

        # Fargate Task Definition - Developer Frontend
        developer_task = ecs.FargateTaskDefinition(self, f"{config['stack_name']}DeveloperTask", memory_limit_mib=1024, cpu=512)

        # Developer Frontend container
        developer_task.add_container(
            "DeveloperFrontendContainer",
            image=ecs.ContainerImage.from_ecr_repository(repo, tag=config['frontend_developer_tag']),
            logging=ecs.LogDriver.aws_logs(stream_prefix="developer-frontend"),
            environment={
                "NODE_ENV": environment,
                "PORT": config['frontend_developer_port'],
                "HOST": "0.0.0.0",
                "NEXT_PUBLIC_PROPELAUTH_URL": os.environ.get('PRODUCTION_DEVELOPER_PROPELAUTH_URL' if environment == 'production' else 'DEV_DEVELOPER_PROPELAUTH_URL', ''),
                "NEXT_PUBLIC_PROPELAUTH_API_KEY": os.environ.get('PRODUCTION_DEVELOPER_PROPELAUTH_API_KEY' if environment == 'production' else 'DEV_DEVELOPER_PROPELAUTH_API_KEY', ''),
                # Dify Configuration
                "NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN": os.environ.get('PRODUCTION_DIFY_CONSOLE_ORIGIN' if environment == 'production' else 'DEV_DIFY_CONSOLE_ORIGIN', ''),
                "NEXT_PUBLIC_DIFY_ADMIN_EMAIL": os.environ.get('PRODUCTION_DIFY_ADMIN_EMAIL' if environment == 'production' else 'DEV_DIFY_ADMIN_EMAIL', ''),
                "NEXT_PUBLIC_DIFY_ADMIN_PASSWORD": os.environ.get('PRODUCTION_DIFY_ADMIN_PASSWORD' if environment == 'production' else 'DEV_DIFY_ADMIN_PASSWORD', ''),
                "NEXT_PUBLIC_DIFY_WORKSPACE_ID": os.environ.get('PRODUCTION_DIFY_WORKSPACE_ID' if environment == 'production' else 'DEV_DIFY_WORKSPACE_ID', ''),
            },
            port_mappings=[ecs.PortMapping(container_port=int(config['frontend_developer_port']))]
        )

        # Fargate Service - Main Frontend (Doctor Service)
        main_service = ecs.FargateService(
            self, f"{config['stack_name']}MainService", 
            cluster=cluster, 
            task_definition=main_task, 
            desired_count=1, 
            assign_public_ip=True,
            # Add deployment configuration to prevent warnings
            min_healthy_percent=100,
            max_healthy_percent=200,
            # Use the configured service name
            service_name=config['service_name']
        )

        # Fargate Service - Developer Frontend
        developer_service = ecs.FargateService(
            self, f"{config['stack_name']}DeveloperService", 
            cluster=cluster, 
            task_definition=developer_task, 
            desired_count=1, 
            assign_public_ip=True,
            # Add deployment configuration to prevent warnings
            min_healthy_percent=100,
            max_healthy_percent=200,
            # Use the configured service name
            service_name=config['developer_service_name']
        )

        # Create separate load balancers for different services
        
        # Load Balancer for Doctor Service
        doctor_lb = elbv2.ApplicationLoadBalancer(self, f"{config['stack_name']}DoctorALB", vpc=vpc, internet_facing=True)
        
        # HTTPS listener for Doctor Service
        doctor_https_listener = doctor_lb.add_listener(
            "DoctorHttpsListener",
            port=443,
            certificates=[certificate],
            protocol=elbv2.ApplicationProtocol.HTTPS,
            open=True
        )
        
        # HTTP listener for Doctor Service - redirect to HTTPS
        doctor_lb.add_listener(
            "DoctorHttpListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.redirect(
                protocol="HTTPS",
                port="443",
                permanent=True
            )
        )
        
        # Load Balancer for Developer Service
        developer_lb = elbv2.ApplicationLoadBalancer(self, f"{config['stack_name']}DeveloperALB", vpc=vpc, internet_facing=True)
        
        # HTTPS listener for Developer Service
        developer_https_listener = developer_lb.add_listener(
            "DeveloperHttpsListener",
            port=443,
            certificates=[certificate],
            protocol=elbv2.ApplicationProtocol.HTTPS,
            open=True
        )
        
        # HTTP listener for Developer Service - redirect to HTTPS
        developer_lb.add_listener(
            "DeveloperHttpListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.redirect(
                protocol="HTTPS",
                port="443",
                permanent=True
            )
        )
        
        # Create Target Groups explicitly
        main_target_group = elbv2.ApplicationTargetGroup(
            self, f"{config['stack_name']}MainTargetGroup",
            port=int(config['frontend_port']),
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=vpc,
            targets=[main_service],
            health_check=elbv2.HealthCheck(
                path="/api/health",
                port=str(config['frontend_port']),
                healthy_http_codes="200-399"
            )
        )
        
        developer_target_group = elbv2.ApplicationTargetGroup(
            self, f"{config['stack_name']}DeveloperTargetGroup",
            port=int(config['frontend_developer_port']),
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=vpc,
            targets=[developer_service],
            health_check=elbv2.HealthCheck(
                path="/api/health",
                port=str(config['frontend_developer_port']),
                healthy_http_codes="200-399"
            )
        )

        # Default action for Doctor Service HTTPS listener (root path)
        doctor_https_listener.add_action(
            "DoctorDefaultAction",
            action=elbv2.ListenerAction.forward([main_target_group])
        )

        # Default action for Developer Service HTTPS listener (root path)
        developer_https_listener.add_action(
            "DeveloperDefaultAction",
            action=elbv2.ListenerAction.forward([developer_target_group])
        )

        # Output the URLs
        CfnOutput(self, "DoctorServiceURL", value=f"https://{config['doctor_domain']}")
        CfnOutput(self, "DeveloperServiceURL", value=f"https://{config['developer_domain']}")
        CfnOutput(self, "DoctorAuthDomain", value=config['auth_domain'])
        CfnOutput(self, "DeveloperAuthDomain", value=config['developer_auth_domain'])
        CfnOutput(self, "DoctorLoadBalancerDNS", value=doctor_lb.load_balancer_dns_name)
        CfnOutput(self, "DeveloperLoadBalancerDNS", value=developer_lb.load_balancer_dns_name)
        CfnOutput(self, "Environment", value=environment)
        CfnOutput(self, "AccountID", value=current_account)
        CfnOutput(self, "ClusterName", value=cluster.cluster_name)
        CfnOutput(self, "MainServiceName", value=main_service.service_name)
        CfnOutput(self, "DeveloperServiceName", value=developer_service.service_name)
        CfnOutput(self, "DeploymentVersion", value="v4.3")  # Updated version for separate domains and auth
        
        if is_release_env:
            CfnOutput(self, "ReleaseInfo", value=f"Release environment deployed with separate load balancers")
            CfnOutput(self, "NextStep", value="Ensure certificates are properly configured for both domains")