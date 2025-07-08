# 🚀 Complete Setup Guide: Calendar Services

## 📁 Project Structure

```
admin-panel/
├── frontend/                 # Next.js frontend
│   ├── app/services/        # Calendar Services dashboard
│   └── .env.local          # Frontend environment variables
├── calendar-backend/        # Python FastAPI backend
│   ├── main.py             # FastAPI application
│   ├── database.py         # MongoDB operations
│   ├── models.py           # Pydantic models
│   ├── requirements.txt    # Python dependencies
│   ├── env_config.txt     # Backend environment variables
│   └── start.py           # Startup script
└── SETUP_GUIDE.md         # This guide
```

## 🔧 Backend Setup (Port 8086)

### 1. Navigate to Calendar Backend
```bash
cd calendar-backend
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
The backend uses `env_config.txt` with these settings:
```env
SERVER_HOST=0.0.0.0
SERVER_PORT=8086
DEBUG_MODE=true
API_KEY=xpectrum-ai@123
MONGODB_URL=mongodb+srv://mongo_access:3gfaAKMQsCwEjIXG@cluster0.4os5zqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DATABASE_NAME=google_oauth
SERVICES_COLLECTION=calendar_services
SESSIONS_COLLECTION=sessions
SESSION_TIMEOUT_HOURS=24
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

### 4. Start the Backend Server
```bash
# Option 1: Using the startup script
python start.py

# Option 2: Direct uvicorn
uvicorn main:app --host 0.0.0.0 --port 8086 --reload

# Option 3: Using main.py
python main.py
```

### 5. Verify Backend is Running
```bash
curl http://localhost:8086/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🎨 Frontend Setup (Port 3000)

### 1. Navigate to Frontend
```bash
cd frontend
```

### 2. Create Environment File
```bash
touch .env.local
```

### 3. Add Environment Variables
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

### 4. Start the Frontend Server
```bash
npm run dev
```

### 5. Access the Dashboard
Navigate to: `http://localhost:3000/services`

## 🔗 API Integration

### Backend Endpoints (Port 8086)
- `GET /api/v1/services/calendar` - Get all services
- `POST /api/v1/services/calendar` - Create service
- `PUT /api/v1/services/calendar/{id}` - Update service
- `DELETE /api/v1/services/calendar/{id}` - Delete service
- `PATCH /api/v1/services/calendar/{id}/status` - Toggle status

### Authentication
All API calls require the header:
```
X-API-Key: xpectrum-ai@123
```

## 🧪 Testing the Integration

### 1. Test Backend Health
```bash
curl http://localhost:8086/health
```

### 2. Test API Authentication
```bash
curl -H "X-API-Key: xpectrum-ai@123" \
  http://localhost:8086/api/v1/services/calendar
```

### 3. Create a Test Service
```bash
curl -X POST "http://localhost:8086/api/v1/services/calendar" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: xpectrum-ai@123" \
  -d '{
    "name": "Test Calendar Service",
    "description": "A test calendar service",
    "timezone": "America/New_York"
  }'
```

### 4. Access Frontend Dashboard
- Open: `http://localhost:3000/services`
- You should see the Calendar Services dashboard
- Try creating, editing, and deleting services

## 🎯 Features Available

### Backend Features
- ✅ **Service Management**: CRUD operations
- ✅ **Status Control**: Toggle active/inactive
- ✅ **Statistics**: Track users and events
- ✅ **Timezone Support**: Configure per service
- ✅ **API Authentication**: Secure access
- ✅ **MongoDB Integration**: Persistent storage
- ✅ **CORS Support**: Cross-origin requests

### Frontend Features
- ✅ **Service Dashboard**: Complete management interface
- ✅ **Statistics Display**: Real-time metrics
- ✅ **Search & Filter**: Find services quickly
- ✅ **Responsive Design**: Works on all devices
- ✅ **TypeScript Support**: Type-safe development
- ✅ **Propelauth Integration**: Authentication

## 🚨 Troubleshooting

### Backend Issues
- **Port 8086 in use**: Change `SERVER_PORT` in `env_config.txt`
- **MongoDB connection failed**: Check `MONGODB_URL` in `env_config.txt`
- **Import errors**: Run `pip install -r requirements.txt`

### Frontend Issues
- **Environment variables not loading**: Restart Next.js dev server
- **API connection failed**: Verify backend is running on port 8086
- **Authentication issues**: Check PropelAuth configuration

### Common Solutions
1. **Restart both servers** after environment changes
2. **Check CORS settings** if frontend can't reach backend
3. **Verify API key** matches in both frontend and backend
4. **Check MongoDB connection** string and credentials

## 📊 Monitoring

### Backend Health
```bash
curl http://localhost:8086/health
```

### API Documentation
- Swagger UI: `http://localhost:8086/docs`
- ReDoc: `http://localhost:8086/redoc`

### Frontend Status
- Dashboard: `http://localhost:3000/services`
- Main app: `http://localhost:3000`

## 🎉 Success Indicators

✅ **Backend Running**: `http://localhost:8086/health` returns healthy status
✅ **Frontend Running**: `http://localhost:3000` loads without errors
✅ **Dashboard Access**: `http://localhost:3000/services` shows calendar services
✅ **API Integration**: Can create/edit/delete services from frontend
✅ **Database Connection**: Services are saved to MongoDB

## 🔄 Development Workflow

1. **Start Backend**: `cd calendar-backend && python start.py`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Make Changes**: Edit files in either directory
4. **Auto-reload**: Both servers will reload automatically
5. **Test Changes**: Check both `localhost:8086` and `localhost:3000`

## 📝 Next Steps

1. **Add more services** through the dashboard
2. **Customize the UI** in `frontend/app/services/page.tsx`
3. **Extend the API** in `calendar-backend/main.py`
4. **Add authentication** if needed
5. **Deploy to production** when ready

---

**🎯 You're all set!** The Calendar Services integration is complete and ready to use. 