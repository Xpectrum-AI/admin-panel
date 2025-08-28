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
                'domain': 'admin-dev.xpectrum-ai.com',
                'auth_domain': 'auth.admin-dev.xpectrum-ai.com',
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
                'domain': 'admin.xpectrum-ai.com',
                'auth_domain': 'auth.admin.xpectrum-ai.com',
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
                'domain': 'admin-release.xpectrum-ai.com',  
                'auth_domain': 'auth.admin-release.xpectrum-ai.com',  
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
        

        if is_new_account:
            certificate = acm.Certificate.from_certificate_arn(
                self, f"{config['stack_name']}Cert",
                "arn:aws:acm:us-west-1:503561436224:certificate/e4c6c688-9d4f-48ce-b3fa-5972d8fe2b57" 
            )
        else:
            certificate = acm.Certificate.from_certificate_arn(
                self, f"{config['stack_name']}Cert",
                "arn:aws:acm:us-west-1:641623447164:certificate/6052b1be-e882-452c-8575-cedd01bb9fbc"
            )

        # Fargate Task Definition - Main Frontend
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
            },
            port_mappings=[ecs.PortMapping(container_port=int(config['frontend_developer_port']))]
        )

        # Fargate Service - Main Frontend (2 tasks)
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

        # Fargate Service - Developer Frontend (1 task)
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

        # ALB
        lb = elbv2.ApplicationLoadBalancer(self, f"{config['stack_name']}ALB", vpc=vpc, internet_facing=True)
        
        # 所有环境都使用HTTPS
        https_listener = lb.add_listener(
            "HttpsListener",
            port=443,
            certificates=[certificate],
            protocol=elbv2.ApplicationProtocol.HTTPS,
            open=True
        )
        
        # HTTP listener - 重定向到HTTPS
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
        
        # Add main frontend target to HTTPS listener (root path)
        https_listener.add_targets(
            "MainFrontendDefault",
            port=int(config['frontend_port']),
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[main_service],
            health_check=elbv2.HealthCheck(
                path="/api/health", 
                port=str(config['frontend_port']), 
                healthy_http_codes="200-399"
            )
        )

        # Add developer frontend target to HTTPS listener (/developer path)
        https_listener.add_targets(
            "DeveloperFrontendPath",
            port=int(config['frontend_developer_port']),
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[developer_service],
            priority=1,
            health_check=elbv2.HealthCheck(
                path="/api/health", 
                port=str(config['frontend_developer_port']), 
                healthy_http_codes="200-399"
            ),
            conditions=[
                elbv2.ListenerCondition.path_patterns(["/developer*"])
            ]
        )

        # 所有环境都输出HTTPS URL
        CfnOutput(self, "FrontendURL", value=f"https://{lb.load_balancer_dns_name}")
        CfnOutput(self, "DeveloperFrontendURL", value=f"https://{lb.load_balancer_dns_name}/developer")
        CfnOutput(self, "LoadBalancerDNS", value=lb.load_balancer_dns_name)
        CfnOutput(self, "Environment", value=environment)
        CfnOutput(self, "AccountID", value=current_account)
        CfnOutput(self, "ClusterName", value=cluster.cluster_name)
        CfnOutput(self, "MainServiceName", value=main_service.service_name)
        CfnOutput(self, "DeveloperServiceName", value=developer_service.service_name)
        CfnOutput(self, "DeploymentVersion", value="v2.6")  # Force redeployment with rewrites fix
        
        if is_release_env:
            CfnOutput(self, "ReleaseInfo", value=f"Release environment deployed with HTTPS support")
            CfnOutput(self, "NextStep", value="Ensure certificate is properly configured for the domain")