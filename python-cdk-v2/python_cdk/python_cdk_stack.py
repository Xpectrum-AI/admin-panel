from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecr as ecr,
    aws_iam as iam,
    aws_elasticloadbalancingv2 as elbv2,
    aws_secretsmanager as secretsmanager,
    aws_certificatemanager as acm,
    CfnOutput,
    Duration
)
from constructs import Construct

class AdminPanelTestStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC
        vpc = ec2.Vpc(self, "AdminPanelVPC", max_azs=2)

        # ECR Repository (use existing)
        repo = ecr.Repository.from_repository_name(
            self, "AdminPanelRepo", 
            "admin-panel"
        )

        # Secrets Manager (use existing)
        secret = secretsmanager.Secret.from_secret_name_v2(
            self, "AdminPanelSecrets", 
            "admin-panel-test"
        )

        # SSL Certificate (use existing)
        certificate = acm.Certificate.from_certificate_arn(
            self, "AdminPanelCertificate",
            "arn:aws:acm:us-west-1:641623447164:certificate/ab2020ef-9a74-4e25-b59e-3e29066dd0a0"
        )

        # ECS Cluster
        cluster = ecs.Cluster(self, "AdminPanelCluster", vpc=vpc)

        # Task Definition
        task = ecs.FargateTaskDefinition(
            self, "AdminPanelTask",
            memory_limit_mib=4096,
            cpu=1024,
            task_role=iam.Role(
                self, "TaskRole",
                assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
                managed_policies=[
                    iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonECSTaskExecutionRolePolicy")
                ]
            )
        )

        # Frontend container
        frontend_container = task.add_container(
            "FrontendContainer",
            image=ecs.ContainerImage.from_ecr_repository(repo, tag="frontend-latest"),
            logging=ecs.LogDriver.aws_logs(stream_prefix="frontend"),
            environment={
                "NODE_ENV": "production",
                "NEXT_PUBLIC_API_URL": "https://admin-test.xpectrum-ai.com/api",
                "NEXT_PUBLIC_API_KEY": "xpectrum-ai@123",
                "NEXT_PUBLIC_CALENDAR_API_URL": "https://admin-test.xpectrum-ai.com/calendar-api",
                "NEXT_PUBLIC_AUTH_URL": "https://auth.admin-test.xpectrum-ai.com",
                "NEXT_PUBLIC_PROPELAUTH_URL": "https://auth.admin-test.xpectrum-ai.com"
            },
            port_mappings=[ecs.PortMapping(container_port=3000)]
        )

        # Backend container
        backend_container = task.add_container(
            "BackendContainer",
            image=ecs.ContainerImage.from_ecr_repository(repo, tag="backend-latest"),
            logging=ecs.LogDriver.aws_logs(stream_prefix="backend"),
            secrets={
                "MONGODB_URL": ecs.Secret.from_secrets_manager(secret, "MONGODB_URL"),
                "JWT_SECRET": ecs.Secret.from_secrets_manager(secret, "JWT_SECRET"),
                "STRIPE_SECRET_KEY": ecs.Secret.from_secrets_manager(secret, "STRIPE_SECRET_KEY"),
                "PROPELAUTH_API_KEY": ecs.Secret.from_secrets_manager(secret, "PROPELAUTH_API_KEY")
            },
            environment={
                "PORT": "8085",
                "NODE_ENV": "production",
                "PROPELAUTH_AUTH_URL": "https://auth.admin-test.xpectrum-ai.com"
            },
            port_mappings=[ecs.PortMapping(container_port=8085)]
        )

        # Calendar-backend container (temporarily disabled)
        # calendar_container = task.add_container(
        #     "CalendarContainer",
        #     image=ecs.ContainerImage.from_ecr_repository(repo, tag="calendar-latest"),
        #     logging=ecs.LogDriver.aws_logs(stream_prefix="calendar"),
        #     secrets={
        #         "GOOGLE_CLIENT_ID": ecs.Secret.from_secrets_manager(secret, "GOOGLE_CLIENT_ID"),
        #         "GOOGLE_CLIENT_SECRET": ecs.Secret.from_secrets_manager(secret, "GOOGLE_CLIENT_SECRET"),
        #         "REDIRECT_URI": ecs.Secret.from_secrets_manager(secret, "REDIRECT_URI"),
        #         "CALENDAR_REDIRECT_URI": ecs.Secret.from_secrets_manager(secret, "CALENDAR_REDIRECT_URI"),
        #         "PROPELAUTH_API_KEY": ecs.Secret.from_secrets_manager(secret, "PROPELAUTH_API_KEY_CALENDAR"),
        #         "JWT_SECRET": ecs.Secret.from_secrets_manager(secret, "JWT_SECRET_CALENDAR"),
        #         "SECRET_KEY": ecs.Secret.from_secrets_manager(secret, "SECRET_KEY_CALENDAR"),
        #         "SMTP_USER": ecs.Secret.from_secrets_manager(secret, "SMTP_USER_CALENDAR"),
        #         "SMTP_PASS": ecs.Secret.from_secrets_manager(secret, "SMTP_PASS_CALENDAR"),
        #         "SMTP_HOST": ecs.Secret.from_secrets_manager(secret, "SMTP_HOST"),
        #         "SMTP_PORT": ecs.Secret.from_secrets_manager(secret, "SMTP_PORT")
        #     },
        #     environment={
        #         "PROPELAUTH_URL": "https://auth.admin-test.xpectrum-ai.com",
        #         "DATABASE_NAME": "google_oauth",
        #         "DEFAULT_TIMEZONE": "America/New_York",
        #         "MAX_CALENDAR_EVENTS": "10",
        #         "TIMEZONE_OPTIONS": "IST:Asia/Kolkata,EST:America/New_York,PST:America/Los_Angeles"
        #     },
        #     port_mappings=[ecs.PortMapping(container_port=8001)]
        # )

        # Fargate Service
        service = ecs.FargateService(
            self, "AdminPanelService",
            cluster=cluster,
            task_definition=task,
            desired_count=1,
            assign_public_ip=True,
            health_check_grace_period=Duration.seconds(120)
        )

        # Application Load Balancer
        lb = elbv2.ApplicationLoadBalancer(
            self, "AdminPanelALB", 
            vpc=vpc, 
            internet_facing=True
        )

        # HTTPS Listener
        https_listener = lb.add_listener(
            "HttpsListener",
            port=443,
            certificates=[certificate],
            protocol=elbv2.ApplicationProtocol.HTTPS,
            open=True
        )

        # HTTP to HTTPS redirect
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

        # Target Groups with proper container mappings
        # Frontend Target Group
        frontend_target_group = elbv2.ApplicationTargetGroup(
            self, "FrontendTargetGroup",
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

        # Backend Target Group
        backend_target_group = elbv2.ApplicationTargetGroup(
            self, "BackendTargetGroup",
            vpc=vpc,
            port=8085,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/health",
                port="8085",
                healthy_http_codes="200-399",
                timeout=Duration.seconds(15),
                interval=Duration.seconds(45),
                healthy_threshold_count=2,
                unhealthy_threshold_count=5
            )
        )

        # Calendar Target Group (temporarily disabled)
        # calendar_target_group = elbv2.ApplicationTargetGroup(
        #     self, "CalendarTargetGroup",
        #     vpc=vpc,
        #     port=8001,
        #     protocol=elbv2.ApplicationProtocol.HTTP,
        #     target_type=elbv2.TargetType.IP,
        #     health_check=elbv2.HealthCheck(
        #         path="/health",
        #         port="8001",
        #         healthy_http_codes="200-399",
        #         timeout=Duration.seconds(15),
        #         interval=Duration.seconds(45),
        #         healthy_threshold_count=2,
        #         unhealthy_threshold_count=5
        #     )
        # )

        # Add default target group to HTTPS listener (frontend)
        https_listener.add_targets(
            "FrontendDefault",
            port=3000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[service]
        )

        # Backend API - /api/* routes
        https_listener.add_targets(
            "BackendAPI",
            port=8085,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[service],
            conditions=[elbv2.ListenerCondition.path_patterns(["/api/*"])],
            priority=2
        )

        # Calendar API - /api/v1/* routes (temporarily disabled)
        # https_listener.add_targets(
        #     "CalendarAPI",
        #     port=8001,
        #     protocol=elbv2.ApplicationProtocol.HTTP,
        #     targets=[service],
        #     conditions=[elbv2.ListenerCondition.path_patterns(["/api/v1/*"])],
        #     priority=3
        # )

        # Output
        CfnOutput(self, "FrontendURL", value=f"https://{lb.load_balancer_dns_name}")
        CfnOutput(self, "LoadBalancerDNS", value=lb.load_balancer_dns_name)
