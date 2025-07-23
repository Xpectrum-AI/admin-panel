from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecr as ecr,
    aws_iam as iam,
    aws_elasticloadbalancingv2 as elbv2,
    aws_secretsmanager as secretsmanager,
    CfnOutput
)
from aws_cdk.aws_ecs_patterns import ApplicationLoadBalancedFargateService
from constructs import Construct

class AdminPanelTestStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        vpc = ec2.Vpc(self, "AdminPanelVpc", max_azs=2)
        cluster = ecs.Cluster(self, "AdminPanelCluster", vpc=vpc)

        # Use existing ECR Repositories by name
        frontend_repo = ecr.Repository.from_repository_name(self, "FrontendRepo", "admin-panel-frontend")
        backend_repo = ecr.Repository.from_repository_name(self, "BackendRepo", "admin-panel-backend")
        calendar_repo = ecr.Repository.from_repository_name(self, "CalendarBackendRepo", "admin-panel-calendar")

        # Task Role
        task_role = iam.Role(self, "AdminPanelTaskRole", assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"))

        # Secrets
        frontend_secret = secretsmanager.Secret.from_secret_name_v2(self, "FrontendSecret", "admin-panel-frontend")
        backend_secret = secretsmanager.Secret.from_secret_name_v2(self, "BackendSecret", "admin-panel-backend")
        calendar_secret = secretsmanager.Secret.from_secret_name_v2(self, "CalendarSecret", "admin-panel-calendar")

        # Frontend: Use ApplicationLoadBalancedFargateService
        frontend_task = ecs.FargateTaskDefinition(self, "FrontendTaskDef", memory_limit_mib=512, cpu=256, task_role=task_role)
        frontend_container = frontend_task.add_container(
            "FrontendContainer",
            image=ecs.ContainerImage.from_ecr_repository(frontend_repo, tag="latest"),
            logging=ecs.LogDriver.aws_logs(stream_prefix="frontend"),
            secrets={
                k: ecs.Secret.from_secrets_manager(frontend_secret, k)
                for k in [
                    "NEXT_PUBLIC_PROPELAUTH_API_KEY",
                    "NEXT_PUBLIC_API_KEY",
                    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
                    "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
                    "NEXT_PUBLIC_MONGODB_URL"
                ]
            },
            port_mappings=[ecs.PortMapping(container_port=3000)]
        )
        frontend_service = ApplicationLoadBalancedFargateService(
            self, "FrontendService",
            cluster=cluster,
            cpu=256,
            memory_limit_mib=512,
            desired_count=2,
            task_definition=frontend_task,
            public_load_balancer=True,
            listener_port=80,
            assign_public_ip=True
        )
        # Use the ALB and listener from the frontend service
        lb = frontend_service.load_balancer
        listener = frontend_service.listener

        # Backend
        backend_task = ecs.FargateTaskDefinition(self, "BackendTaskDef", memory_limit_mib=512, cpu=256, task_role=task_role)
        backend_container = backend_task.add_container(
            "BackendContainer",
            image=ecs.ContainerImage.from_ecr_repository(backend_repo, tag="latest"),
            logging=ecs.LogDriver.aws_logs(stream_prefix="backend"),
            secrets={
                k: ecs.Secret.from_secrets_manager(backend_secret, k)
                for k in [
                    "API_KEY",
                    "LIVE_API_KEY",
                    "PROPELAUTH_API_KEY",
                    "STRIPE_SECRET_KEY",
                    "STRIPE_PUBLISHABLE_KEY",
                    "MONGODB_URL",
                    "SESSION_SECRET",
                    "JWT_SECRET",
                    "SMTP_USER",
                    "SMTP_PASS"
                ]
            },
            port_mappings=[ecs.PortMapping(container_port=8005)]
        )
        backend_service = ecs.FargateService(self, "BackendService", cluster=cluster, task_definition=backend_task, desired_count=2, assign_public_ip=True)
        backend_tg = elbv2.ApplicationTargetGroup(
            self, "BackendTG",
            vpc=vpc,
            port=8005,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(path="/health", port="8005", healthy_http_codes="200-399")
        )
        backend_service.attach_to_application_target_group(backend_tg)
        listener.add_action(
            "BackendAPI",
            priority=2,
            conditions=[elbv2.ListenerCondition.path_patterns(["/api/*"])],
            action=elbv2.ListenerAction.forward([backend_tg])
        )

        # Calendar-backend
        calendar_task = ecs.FargateTaskDefinition(self, "CalendarTaskDef", memory_limit_mib=512, cpu=256, task_role=task_role)
        calendar_container = calendar_task.add_container(
            "CalendarContainer",
            image=ecs.ContainerImage.from_ecr_repository(calendar_repo, tag="latest"),
            logging=ecs.LogDriver.aws_logs(stream_prefix="calendar"),
            secrets={
                k: ecs.Secret.from_secrets_manager(calendar_secret, k)
                for k in [
                    "GOOGLE_CLIENT_ID",
                    "GOOGLE_CLIENT_SECRET",
                    "SECRET_KEY",
                    "MONGODB_URL",
                    "PROPELAUTH_API_KEY",
                    "JWT_SECRET",
                    "SMTP_USER",
                    "SMTP_PASS"
                ]
            },
            port_mappings=[ecs.PortMapping(container_port=8001)]
        )
        calendar_service = ecs.FargateService(self, "CalendarService", cluster=cluster, task_definition=calendar_task, desired_count=2, assign_public_ip=True)
        calendar_tg = elbv2.ApplicationTargetGroup(
            self, "CalendarTG",
            vpc=vpc,
            port=8001,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(path="/health", port="8001", healthy_http_codes="200-399")
        )
        calendar_service.attach_to_application_target_group(calendar_tg)
        listener.add_action(
            "CalendarAPI",
            priority=3,
            conditions=[elbv2.ListenerCondition.path_patterns(["/api/v1/*"])],
            action=elbv2.ListenerAction.forward([calendar_tg])
        )

        CfnOutput(self, "FrontendURL", value=f"http://{lb.load_balancer_dns_name}")
