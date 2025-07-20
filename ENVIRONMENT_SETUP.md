# Environment Configuration Setup Guide

This guide explains how to set up environment variables for all components of the admin panel.

## 📁 Environment Files Structure

```
admin-panel/
├── env-overview.txt              # Complete overview of all URLs and configurations
├── frontend/
│   └── env-config.txt           # Frontend environment variables
├── backend/
│   └── env-config.txt           # Backend environment variables
└── calendar-backend/
    └── env_config.txt           # Calendar backend environment variables
```

## 🚀 Quick Setup

### 1. Frontend Setup
```bash
cd frontend
cp env-config.txt .env.local
```

### 2. Backend Setup
```bash
cd backend
cp env-config.txt .env
```

### 3. Calendar Backend Setup
```bash
cd calendar-backend
cp env_config.txt .env
```

## 📋 Environment Variables by Component

### Frontend (Next.js)
**File**: `frontend/env-config.txt` → `frontend/.env.local`

Key variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_CALENDAR_API_URL` - Calendar backend API URL
- `NEXT_PUBLIC_AUTH_URL` - PropelAuth URL
- `NEXT_PUBLIC_API_KEY` - API key for backend requests
- `NEXT_PUBLIC_DEFAULT_TIMEZONE` - Default timezone

### Backend (Node.js)
**File**: `backend/env-config.txt` → `backend/.env`

Key variables:
- `PORT` - Server port (8000)
- `API_KEY` - API key for authentication
- `LIVE_API_KEY` - Live API key for external services
- `LIVE_API_BASE_URL` - Live API base URL
- `PROPELAUTH_API_KEY` - PropelAuth API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `MONGODB_URL` - MongoDB connection string

### Calendar Backend (Python)
**File**: `calendar-backend/env_config.txt` → `calendar-backend/.env`

Key variables:
- `SERVER_PORT` - Server port (8001)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `MONGODB_URL` - MongoDB connection string

## 🔧 Development URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| Backend | http://localhost:8000 | 8000 |
| Calendar Backend | http://localhost:8001 | 8001 |

## 🔐 Authentication Configuration

### PropelAuth
- **Base URL**: https://181249979.propelauthtest.com
- **API Key**: Available in backend env-config.txt

### Google OAuth
- **Client ID**: Available in calendar-backend env_config.txt
- **Client Secret**: Available in calendar-backend env_config.txt

## 💳 Payment Configuration

### Stripe
- **Test Secret Key**: Available in backend env-config.txt
- **Publishable Key**: Configure in frontend .env.local

## 🗄️ Database Configuration

### MongoDB
- **Production URL**: Available in all env-config files
- **Test URL**: Available in calendar-backend env_config.txt

## 🌐 CORS Configuration

All components are configured to allow:
- http://localhost:3000
- http://localhost:3001
- http://localhost:5173

## ⚠️ Security Notes

1. **Never commit `.env` files** to version control
2. **Change all default secrets** in production
3. **Use environment-specific configurations** for dev/staging/prod
4. **Rotate API keys** regularly

## 🔄 Environment File Updates

When updating environment variables:

1. **Update the corresponding `env-config.txt` file**
2. **Copy the updated config to `.env` or `.env.local`**
3. **Restart the respective service**
4. **Update `env-overview.txt` if adding new URLs**

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8000, 8001 are available
2. **CORS errors**: Check that frontend URLs are in CORS configuration
3. **Database connection**: Verify MongoDB connection strings
4. **API key errors**: Ensure all API keys are correctly set

### Verification Commands

```bash
# Check if services are running
curl http://localhost:8000/health  # Backend
curl http://localhost:8001/health  # Calendar Backend

# Check environment variables
cd frontend && npm run dev         # Frontend
cd backend && npm start           # Backend
cd calendar-backend && python main.py  # Calendar Backend
```

## 📝 Migration Guide

When moving to production:

1. **Update all URLs** to production domains
2. **Change all API keys** to production keys
3. **Update database URLs** to production databases
4. **Configure SSL certificates**
5. **Set up proper CORS origins**
6. **Update environment variables** in deployment platform

## 🔗 Related Files

- `env-overview.txt` - Complete overview of all configurations
- `SETUP_GUIDE.md` - General setup instructions
- `DEPLOYMENT.md` - Deployment instructions
- `README.md` - Project overview 