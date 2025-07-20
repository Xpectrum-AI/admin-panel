# API Routing Fix for 404 Errors

## Issue Summary

You were experiencing 404 errors for the following API endpoints in production:

1. `POST https://admin-test.xpectrum-ai.com/api/v1/auth/callback` - 404 Not Found
2. `GET https://admin-test.xpectrum-ai.com/api/v1/welcome-form/status` - 404 Not Found

## Root Cause Analysis

The issue was caused by a **mismatch between frontend API calls and backend routing configuration**:

### Problem Details

1. **Frontend Configuration**: 
   - Frontend was calling: `https://admin-test.xpectrum-ai.com/api/v1/...`
   - Environment variable: `NEXT_PUBLIC_CALENDAR_API_URL=https://admin-test.xpectrum-ai.com/api/v1`

2. **Nginx Routing**:
   - `/api/` requests → routed to `localhost:8085` (main Node.js backend)
   - `/calendar-api/` requests → routed to `localhost:8001` (calendar backend)

3. **Backend Services**:
   - Main backend (Node.js): Runs on port 8085, handles `/api/` routes
   - Calendar backend (FastAPI): Runs on port 8001, handles `/api/v1/` routes
   - But calendar backend is only accessible via `/calendar-api/` path

### The Mismatch

- Frontend was trying to access calendar endpoints via `/api/v1/`
- But nginx routes `/api/` to the main backend (port 8085)
- Calendar endpoints only exist in the calendar backend (port 8001)
- Calendar backend is only accessible via `/calendar-api/` path

## Solution Implemented

### 1. Updated Frontend API Base URLs

**Files Updated:**
- `frontend/app/(admin)/dashboard/page.tsx`
- `frontend/app/(admin)/auth/AuthContextProvider.tsx`
- `frontend/app/(admin)/components/WelcomeSetupModel.tsx`
- `frontend/service/calendarService.ts`

**Change:**
```javascript
// Before
const API_BASE_URL = 'https://admin-test.xpectrum-ai.com/api/v1'

// After  
const API_BASE_URL = 'https://admin-test.xpectrum-ai.com/calendar-api'
```

### 2. Updated OAuth Redirect URIs

**Files Updated:**
- `env.production`
- `calendar-backend/env_config.txt`

**Change:**
```env
# Before
REDIRECT_URI=https://admin-test.xpectrum-ai.com/api/v1/oauth2callback
CALENDAR_REDIRECT_URI=https://admin-test.xpectrum-ai.com/api/v1/calendar/oauth2callback

# After
REDIRECT_URI=https://admin-test.xpectrum-ai.com/calendar-api/oauth2callback
CALENDAR_REDIRECT_URI=https://admin-test.xpectrum-ai.com/calendar-api/calendar/oauth2callback
```

### 3. Verified Environment Configuration

**Files Verified:**
- `frontend/env.production` - Already had correct URL
- `docker-compose.yml` - Already had correct URL
- `docker-compose.production.yml` - Already had correct URL

## Current Architecture

```
Frontend (Next.js) → Nginx → Backend Services
                                    ├── Main Backend (Node.js, port 8085) - /api/
                                    └── Calendar Backend (FastAPI, port 8001) - /calendar-api/
```

## Deployment Instructions

### Option 1: Using Bash Script (Linux/Mac)
```bash
chmod +x deploy-production-fixed.sh
./deploy-production-fixed.sh
```

### Option 2: Using PowerShell Script (Windows)
```powershell
.\deploy-production-fixed.ps1
```

### Option 3: Manual Deployment
```bash
# Stop existing containers
docker-compose -f docker-compose.production.yml down

# Build and start with updated configuration
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to start
sleep 30

# Check status
docker-compose -f docker-compose.production.yml ps
```

## Testing the Fix

After deployment, test these endpoints:

1. **Calendar API Root**: `https://admin-test.xpectrum-ai.com/calendar-api/`
2. **Auth Callback**: `https://admin-test.xpectrum-ai.com/calendar-api/auth/callback`
3. **Welcome Form Status**: `https://admin-test.xpectrum-ai.com/calendar-api/welcome-form/status`

## Expected Results

- ✅ No more 404 errors for calendar API endpoints
- ✅ Auth callback should work properly
- ✅ Welcome form status should be accessible
- ✅ OAuth redirects should work correctly

## Files Modified

### Frontend Files
- `frontend/app/(admin)/dashboard/page.tsx`
- `frontend/app/(admin)/auth/AuthContextProvider.tsx`
- `frontend/app/(admin)/components/WelcomeSetupModel.tsx`
- `frontend/service/calendarService.ts`

### Environment Files
- `env.production`
- `calendar-backend/env_config.txt`

### Deployment Scripts
- `deploy-production-fixed.sh` (new)
- `deploy-production-fixed.ps1` (new)

## Verification Checklist

- [ ] Frontend loads without console errors
- [ ] Auth callback endpoint responds (not 404)
- [ ] Welcome form status endpoint responds (not 404)
- [ ] OAuth redirects work properly
- [ ] Calendar API endpoints are accessible
- [ ] No more 404 errors in browser console

## Troubleshooting

If you still see 404 errors after deployment:

1. **Check nginx configuration**: Ensure `/calendar-api/` routes to port 8001
2. **Verify container status**: `docker-compose -f docker-compose.production.yml ps`
3. **Check logs**: `docker-compose -f docker-compose.production.yml logs calendar-backend`
4. **Test direct access**: `curl https://admin-test.xpectrum-ai.com/calendar-api/`

## Summary

The 404 errors were caused by incorrect API routing configuration. The frontend was trying to access calendar endpoints via `/api/v1/` but the calendar backend is only accessible via `/calendar-api/`. The fix involved updating all frontend API calls and OAuth redirect URIs to use the correct `/calendar-api/` path. 