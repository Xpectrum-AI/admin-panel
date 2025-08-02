# Admin Panel - Multi-Service Application

A comprehensive admin panel application with frontend, backend, and calendar services, built with modern technologies and containerized with Docker.

## 🏗️ Architecture Overview

This project consists of three main services:

- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Node.js Express server with MongoDB
- **Calendar Backend**: Python FastAPI service for Google Calendar integration

## 📁 Project Structure

```
admin-panel/
├── frontend/                 # Next.js React application
│   ├── app/                 # App router pages
│   ├── hooks/              # Custom React hooks
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # Node.js Express server
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── config/         # Configuration files
│   └── package.json        # Backend dependencies
├── calendar-backend/        # Python FastAPI service
│   ├── main.py            # FastAPI application
│   ├── database.py        # MongoDB operations
│   ├── auth_utils.py      # Authentication utilities
│   └── requirements.txt   # Python dependencies
├── docker-compose.yml      # Multi-service container orchestration
├── docker-compose.production.yml  # Production configuration
├── nginx-config-updated.conf      # Nginx reverse proxy config
├── env.template           # Environment variables template
├── env.test              # Test environment variables
├── env.production        # Production environment variables
└── .gitignore           # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.8+ (for calendar backend development)
- MongoDB instance

### Environment Setup

1. **Copy environment template:**
   ```bash
   cp env.template .env
   ```

2. **Configure environment variables:**
   - MongoDB connection string
   - JWT secret
   - Stripe API keys
   - PropelAuth configuration
   - Google OAuth credentials

### Development

#### Using Docker (Recommended)

```bash
# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8085
# Calendar API: http://localhost:8001
```

#### Local Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Calendar Backend:**
```bash
cd calendar-backend
python -m venv venv
./venv/scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8001
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
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: PropelAuth, JWT
- **Payment**: Stripe
- **Validation**: Express Validator
- **Security**: bcryptjs, CORS

### Calendar Backend
- **Framework**: FastAPI
- **Language**: Python 3.8+
- **Database**: MongoDB with Motor
- **Authentication**: Google OAuth 2.0
- **HTTP Client**: httpx
- **Validation**: Pydantic
- **Security**: python-jose, passlib

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **Environment**: Multi-environment support (dev/test/prod)

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8085
NEXT_PUBLIC_API_KEY=api-key
NEXT_PUBLIC_CALENDAR_API_URL=https://domain.com/calendar-api
NEXT_PUBLIC_AUTH_URL=https://auth.domain.com
NEXT_PUBLIC_PROPELAUTH_URL=https://auth.domain.com
```

#### Backend (.env)
```env
NODE_ENV=production
PORT=8085
MONGODB_URI=mongodb://localhost:27017/admin-panel
JWT_SECRET=jwt-secret
STRIPE_SECRET_KEY=stripe-secret
PROPELAUTH_API_KEY=propelauth-key
PROPELAUTH_AUTH_URL=https://auth.domain.com
```

#### Calendar Backend (.env)
```env
# Google OAuth
GOOGLE_CLIENT_ID=google-client-id
GOOGLE_CLIENT_SECRET=google-client-secret
REDIRECT_URI=https://domain.com/auth/callback
CALENDAR_REDIRECT_URI=https://domain.com/calendar/callback

# MongoDB
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=calendar_db

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8001
DEBUG_MODE=false

# PropelAuth
PROPELAUTH_URL=https://auth.domain.com
PROPELAUTH_API_KEY=propelauth-key
```

## 🚀 Deployment

### Production Deployment

1. **Build and deploy with Docker:**
   ```bash
   docker-compose -f docker-compose.production.yml up --build -d
   ```

2. **Configure Nginx reverse proxy:**
   - Copy `nginx-config-updated.conf` to your server
   - Update domain names and SSL certificates
   - Restart Nginx

3. **Environment setup:**
   - Copy `env.production` to `.env`
   - Update all production environment variables
   - Ensure MongoDB is accessible

### Docker Commands

```bash
# Build all services
docker-compose build

# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up --build -d
```

## 📊 API Endpoints

### Backend API (Port 8085)
- `GET /` - Health check
- `GET /agents/all` - Get all agents
- `GET /agents/trunks` - Get agent trunks
- `POST /api/org/fetch-orgs-query` - Fetch organizations

### Calendar API (Port 8001)
- `GET /api/v1/health` - Health check
- `GET /api/v1/services` - Get calendar services
- `POST /api/v1/services` - Create calendar service
- `PUT /api/v1/services/{id}` - Update service
- `DELETE /api/v1/services/{id}` - Delete service
- `GET /api/v1/timezones` - Get timezone options

## 🔐 Authentication & Security

- **Frontend Authentication**: PropelAuth integration
- **Backend Authentication**: JWT tokens with PropelAuth
- **Calendar Service**: Google OAuth 2.0
- **Database Security**: MongoDB with proper indexing
- **API Security**: CORS, input validation, rate limiting

## 📱 Features

### Admin Panel
- User authentication and authorization
- Agent management
- Organization management
- Payment processing with Stripe
- Real-time data updates

### Calendar Integration
- Google Calendar API integration
- OAuth 2.0 authentication
- Calendar service management
- Timezone handling
- Event synchronization

## 🧪 Testing

The project includes comprehensive testing setup:
- Integration tests for backend services
- API endpoint testing
- Authentication testing
- Calendar service testing

## 🔧 Development Workflow

1. **Feature Development:**
   - Create feature branch
   - Implement changes
   - Test locally with Docker
   - Submit pull request

2. **Code Quality:**
   - ESLint for JavaScript/TypeScript
   - Prettier for code formatting
   - TypeScript strict mode enabled

3. **Deployment:**
   - Automated Docker builds
   - Environment-specific configurations
   - Nginx reverse proxy setup


## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
- Check the logs: `docker-compose logs -f`
- Verify environment variables
- Ensure all services are running
- Check network connectivity between services

---

**Last Updated**: July 2025
**Version**: 1.0.0 #   U p d a t e d   0 8 / 0 2 / 2 0 2 5   1 4 : 0 3 : 0 8  
 