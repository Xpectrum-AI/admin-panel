
# Admin Panel AWS CDK Deployment (python-cdk-v2)

## Prerequisites
- AWS CLI configured with appropriate credentials and region
- Docker installed and running
- AWS CDK v2 installed (`npm install -g aws-cdk`)
- Python 3.8+ and dependencies installed (`pip install -r requirements.txt` in this folder)
- ECR repositories created:
  - `admin-panel-frontend`
  - `admin-panel-backend`
  - `admin-panel-calendar`
- AWS Secrets Manager secrets created:
  - `admin-panel-frontend`
  - `admin-panel-backend`
  - `admin-panel-calendar`

## 1. Build and Push Docker Images

Run the provided script to build and push all images to ECR:

```bash
cd python-cdk-v2
bash push-all-images.sh
```

This will:
- Build Docker images for frontend, backend, and calendar-backend
- Tag and push them to the correct ECR repositories

## 2. Deploy the CDK Stack

From the `python-cdk-v2` directory:

```bash
cd python-cdk-v2
cdk deploy
```

This will:
- Create a VPC, ECS cluster, and ALB
- Deploy frontend (with ALB), backend, and calendar-backend services (2 tasks each)
- Set up path-based routing and health checks
- Use secrets from AWS Secrets Manager
- Use images from ECR

## 3. Access the Application

- The output of `cdk deploy` will include the ALB DNS name (FrontendURL).
- Visit `http://<alb-dns-name>` in your browser.
- Health endpoints:
  - Frontend: `/api/health`
  - Backend: `/api/health` (via ALB path)
  - Calendar-backend: `/api/v1/health` (via ALB path)

## 4. Troubleshooting

- **ECS Service Fails to Start:**
  - Check CloudWatch Logs for container errors.
  - Ensure secrets and environment variables are correct in AWS Secrets Manager.
  - Ensure ECR images are up to date and public/private settings are correct.
- **ALB/ECS Target Group Errors:**
  - Make sure all health check endpoints exist and return 200.
  - Make sure all target groups use `target_type=IP`.
- **CORS Issues:**
  - Add your ALB domain to allowed origins in PropelAuth or your auth provider.
- **API Key/Secret Errors:**
  - Double-check the values in AWS Secrets Manager match your provider's dashboard.

## 5. Updating the Stack

- Make code changes as needed.
- Rebuild and push images if you change app code.
- Run `cdk deploy` to update the stack.

---

For more details, see the main project README or contact the project maintainer.
