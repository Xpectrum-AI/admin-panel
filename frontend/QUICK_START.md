# 🚀 Quick Start: Calendar Services Dashboard

## What You Need to Do Now

### 1. **Create Environment File**
Create a `.env.local` file in your `frontend` directory:

```bash
cd frontend
touch .env.local
```

### 2. **Add Environment Variables**
Copy this into your `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8086/api/v1

# Backend Server Configuration
NEXT_PUBLIC_BACKEND_HOST=localhost
NEXT_PUBLIC_BACKEND_PORT=8086

# Calendar Configuration
NEXT_PUBLIC_DEFAULT_TIMEZONE=America/New_York

# Timezone Options
NEXT_PUBLIC_TIMEZONE_OPTIONS=IST:Asia/Kolkata,EST:America/New_York,PST:America/Los_Angeles

# Local Storage Keys
NEXT_PUBLIC_AUTH_TOKEN_KEY=auth_token
NEXT_PUBLIC_PENDING_FIRST_NAME_KEY=pending_first_name
NEXT_PUBLIC_PENDING_LAST_NAME_KEY=pending_last_name
NEXT_PUBLIC_TIMEZONE_KEY=selected_timezone

# Application Configuration
NEXT_PUBLIC_APP_TITLE=Admin Panel Calendar Services
NEXT_PUBLIC_APP_DESCRIPTION=Calendar Services Management Dashboard

# API Key for Services
NEXT_PUBLIC_API_KEY=xpectrum-ai@123
```

### 3. **Start Your Development Server**
```bash
npm run dev
```

### 4. **Access the Dashboard**
Navigate to: `http://localhost:3000/services`

## ✅ What's Already Done

- ✅ Calendar Services page created (`/services`)
- ✅ Navigation link added to header dropdown
- ✅ API service layer implemented
- ✅ TypeScript interfaces defined
- ✅ Responsive UI with statistics dashboard
- ✅ CRUD operations for services
- ✅ Search and filter functionality
- ✅ Status toggle functionality
- ✅ Timezone configuration support

## 🔧 Backend Requirements

Your backend should run on **port 8086** with these endpoints:

- `GET /api/v1/services/calendar` - Get all services
- `POST /api/v1/services/calendar` - Create service
- `PUT /api/v1/services/calendar/{id}` - Update service
- `DELETE /api/v1/services/calendar/{id}` - Delete service
- `PATCH /api/v1/services/calendar/{id}/status` - Toggle status

## 🎯 Key Features Available

1. **Service Management**: Add, edit, delete calendar services
2. **Status Control**: Activate/deactivate services
3. **Statistics Dashboard**: View metrics and usage stats
4. **Search & Filter**: Find services quickly
5. **Timezone Support**: Configure timezone for each service
6. **Responsive Design**: Works on all devices

## 🔐 Authentication

The dashboard uses PropelAuth for authentication and is protected by the `ProtectedRoute` component.

## 📁 File Structure

```
frontend/app/services/
├── page.tsx              # Main services dashboard
├── calendarService.ts    # API service layer
├── README.md            # Documentation
└── SETUP.md             # Setup guide
```

## 🚨 Troubleshooting

- **Environment variables not loading**: Restart the Next.js dev server
- **API connection issues**: Check if backend is running on port 8086
- **Authentication issues**: Verify PropelAuth configuration

## 🎉 You're Ready!

Once you've created the `.env.local` file and started your dev server, you can access the Calendar Services dashboard at `http://localhost:3000/services`. 