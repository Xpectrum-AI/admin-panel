from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecr as ecr,
    aws_iam as iam,
    aws_elasticloadbalancingv2 as elbv2,
    aws_certificatemanager as acm,
    CfnOutput,
    Duration
)
from constructs import Construct

class AdminPanelStagingStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC
        vpc = ec2.Vpc(self, "AdminPanelStagingVPC", max_azs=2)

        # ECR Repository (use existing)
        repo = ecr.Repository.from_repository_name(
            self, "AdminPanelStagingRepo", 
            "admin-panel"
        )

        # SSL Certificate (use existing)
        certificate = acm.Certificate.from_certificate_arn(
            self, "AdminPanelStagingCertificate",
            "arn:aws:acm:us-west-1:641623447164:certificate/ab2020ef-9a74-4e25-b59e-3e29066dd0a0"
        )

        # ECS Cluster
        cluster = ecs.Cluster(self, "AdminPanelStagingCluster", vpc=vpc)

        # Task Definition - Frontend Only
        task = ecs.FargateTaskDefinition(
            self, "AdminPanelStagingTask",
            memory_limit_mib=2048,  # Reduced since we only have frontend
            cpu=512,  # Reduced since we only have frontend
            task_role=iam.Role(
                self, "StagingTaskRole",
                assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
                managed_policies=[
                    iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonECSTaskExecutionRolePolicy")
                ]
            )
        )

        # Frontend container only
        frontend_container = task.add_container(
            "FrontendStagingContainer",
            image=ecs.ContainerImage.from_ecr_repository(repo, tag="frontend-latest"),
            logging=ecs.LogDriver.aws_logs(stream_prefix="frontend-staging"),
            environment={
                "NODE_ENV": "staging",
                "NEXT_PUBLIC_API_URL": "https://api.admin-staging.xpectrum-ai.com",
                "NEXT_PUBLIC_API_KEY": "xpectrum-ai@123",
                "NEXT_PUBLIC_AUTH_URL": "https://auth.admin-staging.xpectrum-ai.com",
                "NEXT_PUBLIC_PROPELAUTH_URL": "https://auth.admin-staging.xpectrum-ai.com"
            },
            port_mappings=[ecs.PortMapping(container_port=3000)]
        )

        # Commented out backend container - we only use frontend
        # backend_container = task.add_container(
        #     "BackendStagingContainer",
        #     image=ecs.ContainerImage.from_ecr_repository(repo, tag="backend-latest"),
        #     logging=ecs.LogDriver.aws_logs(stream_prefix="backend-staging"),
        #     secrets={
        #         "MONGODB_URL": ecs.Secret.from_secrets_manager(secret, "MONGODB_URL"),
        #         "JWT_SECRET": ecs.Secret.from_secrets_manager(secret, "JWT_SECRET"),
        #         "STRIPE_SECRET_KEY": ecs.Secret.from_secrets_manager(secret, "STRIPE_SECRET_KEY"),
        #         "PROPELAUTH_API_KEY": ecs.Secret.from_secrets_manager(secret, "PROPELAUTH_API_KEY")
        #     },
        #     environment={
        #         "PORT": "8085",
        #         "NODE_ENV": "staging",
        #         "PROPELAUTH_AUTH_URL": "https://auth.admin-staging.xpectrum-ai.com"
        #     },
        #     port_mappings=[ecs.PortMapping(container_port=8085)]
        # )

        # Fargate Service
        service = ecs.FargateService(
            self, "AdminPanelStagingService",
            cluster=cluster,
            task_definition=task,
            desired_count=1,
            assign_public_ip=True,
            health_check_grace_period=Duration.seconds(120)
        )

        # Application Load Balancer
        lb = elbv2.ApplicationLoadBalancer(
            self, "AdminPanelStagingALB", 
            vpc=vpc, 
            internet_facing=True
        )

        # HTTPS Listener
        https_listener = lb.add_listener(
            "StagingHttpsListener",
            port=443,
            certificates=[certificate],
            protocol=elbv2.ApplicationProtocol.HTTPS,
            open=True
        )

        # HTTP to HTTPS redirect
        lb.add_listener(
            "StagingHttpListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.redirect(
                protocol="HTTPS",
                port="443",
                permanent=True
            )
        )

        # Frontend Target Group only
        frontend_target_group = elbv2.ApplicationTargetGroup(
            self, "FrontendStagingTargetGroup",
            vpc=vpc,
            port=3000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/",
                port="3000",
                healthy_http_codes="200-399",
                timeout=Duration.seconds(15),
                interval=Duration.seconds(45),
                healthy_threshold_count=2,
                unhealthy_threshold_count=5
            )
        )

        # Commented out backend target group - we only use frontend
        # backend_target_group = elbv2.ApplicationTargetGroup(
        #     self, "BackendStagingTargetGroup",
        #     vpc=vpc,
        #     port=8085,
        #     protocol=elbv2.ApplicationProtocol.HTTP,
        #     target_type=elbv2.TargetType.IP,
        #     health_check=elbv2.HealthCheck(
        #         path="/health",
        #         port="8085",
        #         healthy_http_codes="200-399",
        #         timeout=Duration.seconds(15),
        #         interval=Duration.seconds(45),
        #         healthy_threshold_count=2,
        #         unhealthy_threshold_count=5
        #     )
        # )

        # Add frontend target group to HTTPS listener (default)
        https_listener.add_targets(
            "FrontendStagingDefault",
            port=3000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[service]
        )

        # Commented out backend API routing - we only use frontend
        # Backend API - /api/* routes
        # https_listener.add_targets(
        #     "BackendStagingAPI",
        #     port=8085,
        #     protocol=elbv2.ApplicationProtocol.HTTP,
        #     targets=[service],
        #     conditions=[elbv2.ListenerCondition.path_patterns(["/api/*"])],
        #     priority=2
        # )

        # Output
        CfnOutput(self, "FrontendStagingURL", value=f"https://{lb.load_balancer_dns_name}")
        CfnOutput(self, "LoadBalancerDNS", value=lb.load_balancer_dns_name) 