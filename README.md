# Healthcare Admin Panel - Comprehensive Management System

A modern, full-featured healthcare administration platform built with Next.js 15, featuring comprehensive doctor management, calendar integration, agent monitoring, and super admin capabilities. This application serves as a complete solution for healthcare organizations to manage their operations, staff, and patient scheduling.

## 🏥 Application Overview

The Healthcare Admin Panel is a sophisticated web application designed specifically for healthcare organizations to:

- **Manage Doctors & Staff**: Complete doctor profiles, credentials, and organizational structure
- **Calendar Management**: Google Calendar integration for appointment scheduling and management
- **Agent Monitoring**: Real-time monitoring of call center agents and their activities
- **Organization Management**: Multi-tenant architecture with role-based access control

- **Super Admin Panel**: Comprehensive system administration and oversight capabilities

## 🏗️ Architecture Overview

This project follows a modern, scalable architecture:

### Frontend Architecture
- **Framework**: Next.js 15 with App Router and React 19
- **Language**: TypeScript for type safety and better development experience
- **Styling**: Tailwind CSS 4 with modern UI components
- **Authentication**: PropelAuth for secure user authentication and authorization
- **State Management**: React hooks and context for state management
- **API Integration**: Self-contained Next.js API routes for backend functionality

### Backend Services
- **API Routes**: Next.js API routes handling all backend operations
- **Database**: MongoDB for data persistence with proper indexing

- **Calendar Integration**: Google Calendar API for appointment management
- **Authentication**: PropelAuth for user management and security

### Infrastructure
- **Containerization**: Docker for consistent deployment environments
- **Cloud Deployment**: AWS CDK with ECS Fargate for scalable cloud infrastructure
- **Load Balancing**: AWS Application Load Balancer for high availability
- **CI/CD**: GitHub Actions for automated deployment and testing

## 📁 Project Structure

```
admin-panel/
├── frontend/                 # Next.js React application
│   ├── app/                 # App router pages and API routes
│   │   ├── (admin)/        # Admin dashboard pages
│   │   │   ├── dashboard/  # Main dashboard with calendar, agents, doctors

│   │   │   ├── settings/   # Application settings
│   │   │   ├── workspace/  # Team and organization management
│   │   │   └── auth/       # Authentication components
│   │   ├── superadmin/     # Super admin panel for system administration
│   │   ├── api/            # Next.js API routes
│   │   │   ├── agents/     # Agent management APIs
│   │   │   ├── calendar/   # Calendar and event management APIs
│   │   │   ├── doctor/     # Doctor management APIs
│   │   │   ├── event/      # Event management APIs
│   │   │   ├── org/        # Organization management APIs

│   │   │   └── user/       # User management APIs
│   │   └── globals.css     # Global styles
│   ├── components/         # Reusable React components
│   │   ├── calendar/       # Calendar components and utilities
│   │   ├── dashboard/      # Dashboard-specific components
│   │   ├── modals/         # Modal components for various operations
│   │   └── ui/             # Base UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries and configurations
│   ├── service/            # API service functions
│   ├── types/              # TypeScript type definitions
│   └── public/             # Static assets
├── python-cdk-v2/          # AWS CDK infrastructure
│   ├── python_cdk/         # CDK stack definitions
│   ├── app.py             # CDK application entry point
│   └── requirements.txt   # Python CDK dependencies
├── docker-compose.yml      # Local development setup
├── docker-compose.production.yml  # Production configuration
├── env.template           # Environment variables template
└── .gitignore           # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites

- **Docker and Docker Compose** (for local development)
- **Node.js 18+** (for local development)
- **AWS CLI** (for deployment)
- **AWS CDK** (for infrastructure deployment)
- **MongoDB** (local or cloud instance)
- **Google Cloud Console** (for Calendar API access)

- **PropelAuth Account** (for authentication)

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd admin-panel
   ```

2. **Copy environment template:**
   ```bash
   cp env.template .env
   ```

3. **Configure environment variables:**
   ```env
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   REDIRECT_URI=http://localhost:8001/api/v1/oauth2callback
   CALENDAR_REDIRECT_URI=http://localhost:8001/api/v1/calendar/oauth2callback
   
   # MongoDB Configuration
   MONGODB_URL=your_mongodb_connection_string
   DATABASE_NAME=your_database_name
   
   # PropelAuth Configuration
   PROPELAUTH_URL=your_propelauth_url
   PROPELAUTH_API_KEY=your_propelauth_api_key
   
   
   
   # Application Configuration
   FRONTEND_URL=http://localhost:3000
   SECRET_KEY=your_secret_key_for_sessions
   ```

### Development

#### Using Docker (Recommended)

```bash
# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8085
# Calendar Backend: http://localhost:8001
```

#### Local Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🛠️ Technology Stack

### Frontend Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, Headless UI
- **Icons**: Lucide React
- **State Management**: React hooks and context
- **HTTP Client**: Axios

### Backend Technologies
- **Runtime**: Node.js with Next.js API routes
- **Database**: MongoDB with Mongoose
- **Authentication**: PropelAuth

- **Calendar Integration**: Google Calendar API
- **Validation**: Built-in Next.js validation

### Infrastructure & DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose (local), ECS Fargate (production)
- **Cloud Platform**: AWS
- **Infrastructure as Code**: AWS CDK
- **CI/CD**: GitHub Actions
- **Load Balancer**: AWS Application Load Balancer
- **Container Registry**: Amazon ECR

## 🏥 Core Features

### 1. Doctor Management
- **Doctor Profiles**: Complete doctor information management
- **Credential Management**: Store and manage professional credentials
- **Organization Assignment**: Assign doctors to specific organizations
- **Search & Filter**: Advanced search capabilities for doctor discovery
- **Role Management**: Different access levels for doctors and staff

### 2. Calendar Management
- **Google Calendar Integration**: Seamless integration with Google Calendar
- **Appointment Scheduling**: Create and manage patient appointments
- **Calendar Sharing**: Share calendars between doctors and staff
- **Event Management**: Create, update, and delete calendar events
- **Timezone Support**: Multi-timezone support for global operations
- **Calendar Assignment**: Assign specific calendars to doctors

### 3. Agent Monitoring
- **Real-time Monitoring**: Monitor call center agents in real-time
- **Active Calls Tracking**: Track ongoing calls and agent status
- **Performance Metrics**: Monitor agent performance and statistics
- **Phone Management**: Manage agent phone numbers and trunks
- **Agent Profiles**: Complete agent information and history

### 4. Organization Management
- **Multi-tenant Architecture**: Support for multiple healthcare organizations
- **User Management**: Add, remove, and manage organization members
- **Role-based Access Control**: Granular permissions and access levels
- **Invitation System**: Invite new members to organizations
- **Organization Settings**: Configure organization-specific settings

### 5. Payment Processing

- **Subscription Management**: Handle recurring payments and subscriptions

- **Payment Methods**: Support for multiple payment methods
- **Transaction History**: Complete payment and transaction history

### 6. Super Admin Panel
- **System Administration**: Complete system oversight and management
- **User Management**: Manage all users across all organizations
- **Organization Management**: Oversee all organizations in the system
- **Agent Management**: Monitor and manage all agents
- **Audit Logs**: Comprehensive audit trail for all system activities
- **System Monitoring**: Monitor system health and performance
- **Role & Permission Management**: Manage system-wide roles and permissions

## 📊 API Endpoints

### User Management (`/api/user/*`)
- `POST /api/user/create-user` - Create new user account
- `GET /api/user/fetch-user-mail` - Fetch user by email address
- `POST /api/user/fetch-users-query` - Search and filter users

### Organization Management (`/api/org/*`)
- `POST /api/org/create-org` - Create new organization
- `POST /api/org/add-user` - Add user to organization
- `POST /api/org/invite-user` - Send invitation to join organization
- `POST /api/org/fetch-users` - Get all users in organization
- `POST /api/org/fetch-pending-invites` - Get pending invitations
- `POST /api/org/remove-user` - Remove user from organization
- `POST /api/org/change-user-role` - Change user role in organization
- `POST /api/org/update-org` - Update organization details
- `POST /api/org/fetch-org-details` - Get organization information
- `POST /api/org/fetch-orgs-query` - Search organizations

### Doctor Management (`/api/doctor/*`)
- `GET /api/doctor` - Get all doctors
- `GET /api/doctor/[doctorId]` - Get specific doctor details
- `GET /api/doctor/organization/[orgId]` - Get doctors by organization

### Calendar Management (`/api/calendar/*`)
- `POST /api/calendar/create` - Create new calendar
- `GET /api/calendar/doctor/[doctor_id]` - Get doctor's calendars
- `GET /api/calendar/organization/[organization_id]` - Get organization calendars
- `POST /api/calendar/share` - Share calendar with users

### Event Management (`/api/event/*`)
- `POST /api/event/create` - Create new calendar event
- `GET /api/event/list` - List calendar events
- `POST /api/event/update` - Update existing event
- `DELETE /api/event/delete` - Delete calendar event

### Agent Management (`/api/agents/*`)
- `GET /api/agents/all` - Get all agents
- `GET /api/agents/active-calls` - Get currently active calls
- `GET /api/agents/trunks` - Get agent trunks
- `GET /api/agents/info/[agentId]` - Get specific agent information
- `POST /api/agents/update/[agentId]` - Update agent details
- `DELETE /api/agents/delete/[agentId]` - Delete agent
- `POST /api/agents/set_phone/[agentId]` - Set agent phone number
- `DELETE /api/agents/delete_phone/[agentId]` - Remove agent phone
- `GET /api/agents/by_phone/[phoneNumber]` - Find agent by phone number



### Health Check
- `GET /api/health` - Application health status

## 🔐 Security & Authentication

### Authentication System
- **PropelAuth Integration**: Secure user authentication and management
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions system
- **Session Management**: Secure session handling with timeout
- **OAuth Integration**: Google OAuth for calendar access

### Security Features
- **API Security**: Next.js API routes with proper validation
- **Database Security**: MongoDB with proper indexing and access controls

- **Infrastructure Security**: AWS IAM roles and security groups
- **CORS Protection**: Proper CORS configuration
- **Input Validation**: Comprehensive input validation and sanitization

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
- **Security Scanning**: Automated vulnerability checks with Trivy and Bandit
- **Database Backup**: Automated daily backups
- **Code Quality**: Automated linting and testing

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

# Production deployment
docker-compose -f docker-compose.production.yml up --build
```

## 🧪 Testing

The project includes comprehensive testing setup:

- **API Testing**: Next.js API route testing
- **Frontend Testing**: React component testing
- **Authentication Testing**: PropelAuth integration testing

- **Infrastructure Testing**: AWS CDK testing
- **End-to-End Testing**: Complete workflow testing

## 🔧 Development Workflow

### 1. Feature Development
- Create feature branch from `develop`
- Implement changes in frontend and API routes
- Test locally with Docker
- Submit pull request for review
- Merge to `develop` after approval

### 2. Code Quality
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Strict mode enabled
- **Security Scanning**: Trivy and Bandit integration
- **Code Review**: Mandatory pull request reviews

### 3. Deployment Process
- Automated Docker builds
- AWS CDK infrastructure deployment
- GitHub Actions CI/CD pipelines
- Environment-specific configurations
- Automated testing and validation

## 📱 User Interface

### Dashboard Features
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Real-time Updates**: Live data updates without page refresh
- **Interactive Calendar**: Full-featured calendar with drag-and-drop
- **Data Tables**: Sortable and filterable data tables
- **Modal Dialogs**: Contextual modal dialogs for actions
- **Navigation**: Intuitive navigation with breadcrumbs
- **Responsive Design**: Mobile-friendly interface

### Component Library
- **Calendar Components**: Full calendar implementation
- **Data Tables**: Reusable table components
- **Modal System**: Comprehensive modal system
- **Form Components**: Validated form components
- **Navigation**: Navigation and routing components
- **UI Elements**: Buttons, inputs, and other UI elements

## 📊 Monitoring & Analytics

### System Monitoring
- **Health Checks**: Automated health monitoring
- **Performance Metrics**: Application performance tracking
- **Error Tracking**: Comprehensive error logging
- **Usage Analytics**: User activity and feature usage
- **Database Monitoring**: MongoDB performance monitoring

### Audit & Compliance
- **Audit Logs**: Complete audit trail for all actions
- **User Activity**: Track user actions and changes
- **Data Access**: Monitor data access patterns
- **Security Events**: Track security-related events
- **Compliance Reporting**: Generate compliance reports

## 🆘 Support & Troubleshooting

### Common Issues

1. **Authentication Issues:**
   - Verify PropelAuth configuration
   - Check environment variables
   - Ensure proper redirect URIs

2. **Calendar Integration:**
   - Verify Google OAuth credentials
   - Check calendar API permissions
   - Ensure proper scopes are configured

3. **Payment Issues:**
   
   - Check webhook configurations
   - Ensure proper payment method setup

4. **Database Issues:**
   - Verify MongoDB connection string
   - Check database permissions
   - Ensure proper indexing

### Getting Help

- **Documentation**: Check this README and code comments
- **Logs**: Review application logs with `docker-compose logs -f frontend`
- **Environment**: Verify all environment variables are set correctly
- **Dependencies**: Ensure all dependencies are properly installed
- **Network**: Check network connectivity and firewall settings

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📞 Contact

For technical support or questions:
- Check the application logs
- Review the documentation
- Contact the development team
- Submit an issue on the repository

---

**Last Updated**: December 2024
**Version**: 2.0.0 (Healthcare Admin Panel)
**Maintainer**: Development Team
