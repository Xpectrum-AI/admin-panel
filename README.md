# Admin Panel - Frontend-Only Application

A modern admin panel application built with Next.js, featuring a self-contained frontend with integrated API routes and AWS CDK deployment infrastructure.

## 🏗️ Architecture Overview

This project consists of a single, comprehensive frontend service:

- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **API Routes**: Self-contained Next.js API routes for all backend functionality
- **Deployment**: AWS CDK with ECS Fargate and Application Load Balancer

## 📁 Project Structure

```
admin-panel/
├── frontend/                 # Next.js React application
│   ├── app/                 # App router pages and API routes
│   │   ├── (admin)/        # Admin dashboard pages
│   │   ├── api/            # Next.js API routes
│   │   │   ├── agents/     # Agent management APIs
│   │   │   ├── org/        # Organization management APIs
│   │   │   ├── user/       # User management APIs
│   │   │   ├── stripe/     # Payment processing APIs
│   │   │   └── health/     # Health check API
│   │   └── globals.css     # Global styles
│   ├── components/         # Reusable React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── service/            # API service functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── python-cdk-v2/          # AWS CDK infrastructure
│   ├── python_cdk/         # CDK stack definitions
│   ├── app.py             # CDK application entry point
│   └── requirements.txt   # Python CDK dependencies
├── .github/workflows/      # GitHub Actions CI/CD
│   ├── deploy-production.yml  # Production deployment
│   ├── deploy-staging.yml     # Staging deployment
│   ├── ci.yml                # Continuous integration
│   ├── security.yml          # Security scanning
│   └── backup.yml            # Database backup
├── docker-compose.yml      # Local development setup
├── docker-compose.production.yml  # Production configuration
├── env.template           # Environment variables template
├── env.test              # Test environment variables
├── env.production        # Production environment variables
└── .gitignore           # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose (for local development)
- Node.js 18+ (for local development)
- AWS CLI (for deployment)
- AWS CDK (for infrastructure deployment)

### Environment Setup

1. **Copy environment template:**
   ```bash
   cp env.template .env
   ```

2. **Configure environment variables:**
   - PropelAuth configuration
   - Stripe API keys
   - Google OAuth credentials
   - MongoDB connection string

### Development

#### Using Docker (Recommended)

```bash
# Start the frontend service
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
```

#### Local Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Authentication**: PropelAuth
- **UI Components**: Radix UI, Headless UI
- **Icons**: Lucide React
- **Payment**: Stripe integration
- **Database**: MongoDB (via Next.js API routes)

### API Routes (Self-Contained)
- **User Management**: `/api/user/*`
- **Organization Management**: `/api/org/*`
- **Agent Management**: `/api/agents/*`
- **Payment Processing**: `/api/stripe/*`
- **Health Checks**: `/api/health`

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose (local)
- **Cloud Deployment**: AWS CDK with ECS Fargate
- **Load Balancer**: AWS Application Load Balancer
- **Container Registry**: Amazon ECR
- **CI/CD**: GitHub Actions

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```env
# PropelAuth Configuration
NEXT_PUBLIC_PROPELAUTH_API_KEY=your-propelauth-key
NEXT_PUBLIC_AUTH_URL=https://auth.domain.com
NEXT_PUBLIC_PROPELAUTH_URL=https://auth.domain.com

# API Configuration
NEXT_PUBLIC_API_KEY=your-api-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Database
NEXT_PUBLIC_MONGODB_URL=mongodb://localhost:27017/admin-panel

# Payment
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key

# Application
NEXT_PUBLIC_DEFAULT_TIMEZONE=America/New_York
NEXT_PUBLIC_TIMEZONE_OPTIONS=IST:Asia/Kolkata,EST:America/New_York,PST:America/Los_Angeles
```

## 🚀 Deployment

### AWS CDK Deployment

1. **Install CDK dependencies:**
   ```bash
   cd python-cdk-v2
   pip install -r requirements.txt
   npm install -g aws-cdk
   ```

2. **Deploy to production:**
   ```bash
   cdk deploy AdminPanelProductionStack --require-approval never --context environment=production
   ```

3. **Deploy to staging:**
   ```bash
   cdk deploy AdminPanelProductionStack --require-approval never --context environment=staging
   ```

### GitHub Actions CI/CD

The project includes automated CI/CD pipelines:

- **Production Deployment**: Triggered on push to `main` branch
- **Staging Deployment**: Triggered on push to `develop` branch
- **Security Scanning**: Automated vulnerability checks
- **Database Backup**: Automated daily backups

### Docker Commands

```bash
# Build frontend image
docker build -t admin-panel:frontend-latest frontend/

# Run locally
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f frontend
```

## 📊 API Endpoints

### User Management (`/api/user/*`)
- `POST /api/user/create-user` - Create new user
- `GET /api/user/fetch-user-mail` - Fetch user by email
- `POST /api/user/fetch-users-query` - Search users

### Organization Management (`/api/org/*`)
- `POST /api/org/create-org` - Create organization
- `POST /api/org/add-user` - Add user to organization
- `POST /api/org/invite-user` - Invite user to organization
- `POST /api/org/fetch-users` - Get organization users
- `POST /api/org/fetch-pending-invites` - Get pending invites
- `POST /api/org/remove-user` - Remove user from organization
- `POST /api/org/change-user-role` - Change user role
- `POST /api/org/update-org` - Update organization
- `POST /api/org/fetch-org-details` - Get organization details
- `POST /api/org/fetch-orgs-query` - Search organizations

### Agent Management (`/api/agents/*`)
- `GET /api/agents/all` - Get all agents
- `GET /api/agents/active-calls` - Get active calls
- `GET /api/agents/trunks` - Get agent trunks
- `GET /api/agents/info/[agentId]` - Get agent info
- `POST /api/agents/update/[agentId]` - Update agent
- `DELETE /api/agents/delete/[agentId]` - Delete agent
- `POST /api/agents/set_phone/[agentId]` - Set agent phone
- `DELETE /api/agents/delete_phone/[agentId]` - Delete agent phone
- `GET /api/agents/by_phone/[phoneNumber]` - Get agent by phone

### Payment Processing (`/api/stripe/v1/*`)
- `GET /api/stripe/v1/customers` - Get customers
- `GET /api/stripe/v1/customers/[id]` - Get customer
- `GET /api/stripe/v1/products` - Get products
- `GET /api/stripe/v1/prices` - Get prices
- `GET /api/stripe/v1/subscriptions` - Get subscriptions
- `GET /api/stripe/v1/invoices` - Get invoices
- `POST /api/stripe/v1/checkout/sessions` - Create checkout session
- `GET /api/stripe/v1/checkout/sessions/[id]` - Get checkout session
- `GET /api/stripe/v1/payment_intents/[id]` - Get payment intent
- `GET /api/stripe/v1/events` - Get events

### Health Check
- `GET /api/health` - Application health status

## 🔐 Authentication & Security

- **Frontend Authentication**: PropelAuth integration
- **API Security**: Next.js API routes with proper validation
- **Database Security**: MongoDB with proper indexing
- **Payment Security**: Stripe secure payment processing
- **Infrastructure Security**: AWS IAM roles and security groups

## 📱 Features

### Admin Panel
- User authentication and authorization via PropelAuth
- Agent management and monitoring
- Organization management with role-based access
- Payment processing with Stripe integration
- Real-time data updates
- Responsive design with Tailwind CSS

### Infrastructure Features
- Auto-scaling ECS Fargate services
- Application Load Balancer with SSL termination
- Automated CI/CD with GitHub Actions
- Security scanning and vulnerability checks
- Automated database backups
- Multi-environment deployment (staging/production)

## 🧪 Testing

The project includes comprehensive testing setup:
- Next.js API route testing
- Frontend component testing
- Authentication testing
- Payment processing testing
- Infrastructure testing with CDK

## 🔧 Development Workflow

1. **Feature Development:**
   - Create feature branch
   - Implement changes in frontend
   - Test locally with Docker
   - Submit pull request

2. **Code Quality:**
   - ESLint for JavaScript/TypeScript
   - Prettier for code formatting
   - TypeScript strict mode enabled
   - Security scanning with Trivy and Bandit

3. **Deployment:**
   - Automated Docker builds
   - AWS CDK infrastructure deployment
   - GitHub Actions CI/CD pipelines
   - Environment-specific configurations

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
- Check the logs: `docker-compose logs -f frontend`
- Verify environment variables
- Ensure the frontend service is running
- Check AWS CDK deployment status
- Review GitHub Actions workflow logs

---

**Last Updated**: August 2025
**Version**: 2.0.0 (Frontend-Only Architecture)