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
                'domain': 'admin-test.xpectrum-ai.com',
                'auth_domain': 'auth.admin-test.xpectrum-ai.com',
                'frontend_tag': 'frontend-development',
                'frontend_port': '3000',
                'stack_name': 'AdminPanelDevelopmentStack'
            },
            'production': {
                'domain': 'admin.xpectrum-ai.com',
                'auth_domain': 'auth.admin.xpectrum-ai.com',
                'frontend_tag': 'frontend-latest',
                'frontend_port': '3000',
                'stack_name': 'AdminPanelProductionStack'
            },
            'release': {
                'domain': 'admin-release.xpectrum-ai.com',  
                'auth_domain': 'auth.admin-release.xpectrum-ai.com',  
                'frontend_tag': os.environ.get('RELEASE_IMAGE_TAG', 'frontend-release-latest'),
                'frontend_port': '3000',
                'stack_name': 'AdminPanelReleaseStack'
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
        cluster = ecs.Cluster(self, f"{config['stack_name']}Cluster", vpc=vpc)

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
                "arn:aws:acm:us-west-1:641623447164:certificate/99850dcb-97a8-4bed-bbed-6038e2c25e90"
            )

        # Fargate Task Definition - Frontend only
        task = ecs.FargateTaskDefinition(self, f"{config['stack_name']}Task", memory_limit_mib=1024, cpu=512)

        # Frontend container only
        task.add_container(
            "FrontendContainer",
            image=ecs.ContainerImage.from_ecr_repository(repo, tag=config['frontend_tag']),
            logging=ecs.LogDriver.aws_logs(stream_prefix="frontend"),
            environment={
                "NODE_ENV": environment,
                "PORT": config['frontend_port'],
                "HOST": "0.0.0.0",
            },
            port_mappings=[ecs.PortMapping(container_port=int(config['frontend_port']))]
        )

        # Fargate Service (2 tasks)
        service = ecs.FargateService(
            self, f"{config['stack_name']}Service", 
            cluster=cluster, 
            task_definition=task, 
            desired_count=1, 
            assign_public_ip=True,
            # Add deployment configuration to prevent warnings
            min_healthy_percent=100,
            max_healthy_percent=200,
            # Force new deployment with timestamp
            service_name=f"{config['stack_name']}Service-{int(os.environ.get('BUILD_NUMBER', '1'))}"
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
        
        # Add targets to HTTPS listener
        https_listener.add_targets(
            "FrontendDefault",
            port=int(config['frontend_port']),
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[service],
            health_check=elbv2.HealthCheck(
                path="/api/health", 
                port=str(config['frontend_port']), 
                healthy_http_codes="200-399"
            )
        )

        # 所有环境都输出HTTPS URL
        CfnOutput(self, "FrontendURL", value=f"https://{lb.load_balancer_dns_name}")
        CfnOutput(self, "LoadBalancerDNS", value=lb.load_balancer_dns_name)
        CfnOutput(self, "Environment", value=environment)
        CfnOutput(self, "AccountID", value=current_account)
        CfnOutput(self, "ClusterName", value=cluster.cluster_name)
        CfnOutput(self, "ServiceName", value=service.service_name)
        
        if is_release_env:
            CfnOutput(self, "ReleaseInfo", value=f"Release environment deployed with HTTPS support")
            CfnOutput(self, "NextStep", value="Ensure certificate is properly configured for the domain")