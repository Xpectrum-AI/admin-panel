from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecr as ecr,
    aws_iam as iam,
    aws_elasticloadbalancingv2 as elbv2,
    aws_secretsmanager as secretsmanager,
    aws_certificatemanager as acm,
    CfnOutput
)
from constructs import Construct

class AdminPanelTestStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        vpc = ec2.Vpc(self, "AdminPanelVpc", max_azs=2)
        cluster = ecs.Cluster(self, "AdminPanelCluster", vpc=vpc)

        # Use single ECR Repository by name
        repo = ecr.Repository.from_repository_name(self, "AdminPanelRepo", "admin-panel")

        # Task Role
        task_role = iam.Role(self, "AdminPanelTaskRole", assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"))

        # Single Secret (updated name)
        secret = secretsmanager.Secret.from_secret_name_v2(self, "AdminPanelSecret", "admin-panel-test")

        # ACM Certificate
        certificate = acm.Certificate.from_certificate_arn(
            self, "AdminPanelCert",
            "arn:aws:acm:us-west-1:641623447164:certificate/ab2020ef-9a74-4e25-b59e-3e29066dd0a0"
        )

        # Fargate Task Definition with 3 containers
        task = ecs.FargateTaskDefinition(self, "AdminPanelTask", memory_limit_mib=1024, cpu=512)

        # Frontend container
        task.add_container(
            "FrontendContainer",
            image=ecs.ContainerImage.from_ecr_repository(repo, tag="frontend-latest"),
            logging=ecs.LogDriver.aws_logs(stream_prefix="frontend"),
            secrets={
                "NEXT_PUBLIC_PROPELAUTH_API_KEY": ecs.Secret.from_secrets_manager(secret, "NEXT_PUBLIC_PROPELAUTH_API_KEY"),
                "NEXT_PUBLIC_API_KEY": ecs.Secret.from_secrets_manager(secret, "NEXT_PUBLIC_API_KEY"),
                "NEXT_PUBLIC_GOOGLE_CLIENT_ID": ecs.Secret.from_secrets_manager(secret, "NEXT_PUBLIC_GOOGLE_CLIENT_ID"),
                "NEXT_PUBLIC_MONGODB_URL": ecs.Secret.from_secrets_manager(secret, "NEXT_PUBLIC_MONGODB_URL"),
                "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": ecs.Secret.from_secrets_manager(secret, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
                "SECRET_KEY": ecs.Secret.from_secrets_manager(secret, "SECRET_KEY")
            },
            environment={
                "PROPELAUTH_REDIRECT_URI": "https://auth.admin-test.xpectrum-ai.com",
                "NEXT_PUBLIC_DEFAULT_TIMEZONE": "America/New_York",
                "NEXT_PUBLIC_TIMEZONE_OPTIONS": "IST:Asia/Kolkata,EST:America/New_York,PST:America/Los_Angeles",
                "NEXT_PUBLIC_GOOGLE_CALENDAR_API_URL": "https://www.googleapis.com/calendar/v3",
                "NEXT_PUBLIC_DATABASE_NAME": "google_oauth",
                "NEXT_PUBLIC_CALENDAR_REDIRECT_URI": "https://admin-test.xpectrum-ai.com/api/v1/calendar/oauth2callback",
                "NEXT_PUBLIC_API_URL": "https://admin-test.xpectrum-ai.com",
                "NEXT_PUBLIC_AUTH_URL": "https://auth.admin-test.xpectrum-ai.com",
                "NEXT_PUBLIC_PROPELAUTH_URL": "https://auth.admin-test.xpectrum-ai.com",
                "NEXT_PUBLIC_CALENDAR_API_URL": "https://admin-test.xpectrum-ai.com",
                "NEXT_PUBLIC_API_BASE_URL": "https://admin-test.xpectrum-ai.com",
                "NEXT_PUBLIC_GOOGLE_REDIRECT_URI": "https://admin-test.xpectrum-ai.com/api/v1/oauth2callback"
            },
            port_mappings=[ecs.PortMapping(container_port=3000)]
        )
        # Backend container
        task.add_container(
            "BackendContainer",
            image=ecs.ContainerImage.from_ecr_repository(repo, tag="backend-latest"),
            logging=ecs.LogDriver.aws_logs(stream_prefix="backend"),
            secrets={
                "API_KEY": ecs.Secret.from_secrets_manager(secret, "API_KEY"),
                "LIVE_API_KEY": ecs.Secret.from_secrets_manager(secret, "LIVE_API_KEY"),
                "PROPELAUTH_API_KEY": ecs.Secret.from_secrets_manager(secret, "PROPELAUTH_API_KEY"),
                "MONGODB_URL": ecs.Secret.from_secrets_manager(secret, "MONGODB_URL"),
                "SESSION_SECRET": ecs.Secret.from_secrets_manager(secret, "SESSION_SECRET"),
                "JWT_SECRET": ecs.Secret.from_secrets_manager(secret, "JWT_SECRET"),
                "SMTP_USER": ecs.Secret.from_secrets_manager(secret, "SMTP_USER"),
                "SMTP_PASS": ecs.Secret.from_secrets_manager(secret, "SMTP_PASS"),
                "STRIPE_SECRET_KEY": ecs.Secret.from_secrets_manager(secret, "STRIPE_SECRET_KEY"),
                "STRIPE_PUBLISHABLE_KEY": ecs.Secret.from_secrets_manager(secret, "STRIPE_PUBLISHABLE_KEY")
            },
            environment={
                "PROPELAUTH_AUTH_URL": "https://auth.admin-test.xpectrum-ai.com",
                "LIVE_API_BASE_URL": "https://multiagents.livekit.xpectrum-ai.com",
                "DATABASE_NAME": "admin_panel",
                "API_BASE_URL": "https://admin-test.xpectrum-ai.com",
                "CALENDAR_API_URL": "https://admin-test.xpectrum-ai.com/api/v1",
                "AUTH_REDIRECT_URL": "https://auth.admin-test.xpectrum-ai.com/google/login",
                "PROPEL_TOKEN_URL": "https://auth.admin-test.xpectrum-ai.com/propelauth/oauth/token",
                "PROPEL_USER_INFO_URL": "https://auth.admin-test.xpectrum-ai.com/propelauth/oauth/userinfo",
                "GOOGLE_AUTH_URL": "https://accounts.google.com/o/oauth2/auth",
                "GOOGLE_TOKEN_URL": "https://oauth2.googleapis.com/token",
                "GOOGLE_CALENDAR_API_URL": "https://www.googleapis.com/calendar/v3"
            },
            port_mappings=[ecs.PortMapping(container_port=8005)]
        )
        # Calendar-backend container
        task.add_container(
            "CalendarContainer",
            image=ecs.ContainerImage.from_ecr_repository(repo, tag="calendar-latest"),
            logging=ecs.LogDriver.aws_logs(stream_prefix="calendar"),
            secrets={
                "GOOGLE_CLIENT_ID": ecs.Secret.from_secrets_manager(secret, "GOOGLE_CLIENT_ID"),
                "GOOGLE_CLIENT_SECRET": ecs.Secret.from_secrets_manager(secret, "GOOGLE_CLIENT_SECRET"),
                "REDIRECT_URI": ecs.Secret.from_secrets_manager(secret, "REDIRECT_URI"),
                "CALENDAR_REDIRECT_URI": ecs.Secret.from_secrets_manager(secret, "CALENDAR_REDIRECT_URI"),
                "PROPELAUTH_API_KEY": ecs.Secret.from_secrets_manager(secret, "PROPELAUTH_API_KEY_CALENDAR"),
                "JWT_SECRET": ecs.Secret.from_secrets_manager(secret, "JWT_SECRET_CALENDAR"),
                "SECRET_KEY": ecs.Secret.from_secrets_manager(secret, "SECRET_KEY_CALENDAR"),
                "SMTP_USER": ecs.Secret.from_secrets_manager(secret, "SMTP_USER_CALENDAR"),
                "SMTP_PASS": ecs.Secret.from_secrets_manager(secret, "SMTP_PASS_CALENDAR"),
                "SMTP_HOST": ecs.Secret.from_secrets_manager(secret, "SMTP_HOST"),
                "SMTP_PORT": ecs.Secret.from_secrets_manager(secret, "SMTP_PORT")
            },
            environment={
                "PROPELAUTH_URL": "https://auth.admin-test.xpectrum-ai.com",
                "DATABASE_NAME": "google_oauth",
                "DEFAULT_TIMEZONE": "America/New_York",
                "MAX_CALENDAR_EVENTS": "10",
                "TIMEZONE_OPTIONS": "IST:Asia/Kolkata,EST:America/New_York,PST:America/Los_Angeles"
            },
            port_mappings=[ecs.PortMapping(container_port=8001)]
        )

        # Fargate Service (2 tasks)
        service = ecs.FargateService(self, "AdminPanelService", cluster=cluster, task_definition=task, desired_count=2, assign_public_ip=True)

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

        # Listener rules for each path/port
        # Frontend (default)
        https_listener.add_targets(
            "FrontendDefault",
            port=3000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[service],
            health_check=elbv2.HealthCheck(path="/api/health", port="3000", healthy_http_codes="200-399")
        )
        # Backend API
        https_listener.add_targets(
            "BackendAPI",
            port=8005,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[service],
            health_check=elbv2.HealthCheck(path="/health", port="8005", healthy_http_codes="200-399"),
            conditions=[elbv2.ListenerCondition.path_patterns(["/api/*"])],
            priority=2
        )
        # Calendar API
        https_listener.add_targets(
            "CalendarAPI",
            port=8001,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[service],
            health_check=elbv2.HealthCheck(path="/health", port="8001", healthy_http_codes="200-399"),
            conditions=[elbv2.ListenerCondition.path_patterns(["/api/v1/*"])],
            priority=3
        )

        CfnOutput(self, "FrontendURL", value=f"https://{lb.load_balancer_dns_name}")
