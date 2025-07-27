# Production Issues Analysis and Fixes

## Issues Identified

### 1. **Nginx Configuration Port Mismatch**
- **Problem**: Nginx was trying to connect to backend on port 8085, but Docker containers are running on port 8005
- **Error**: `connect() failed (111: Unknown error) while connecting to upstream`
- **Fix**: Updated nginx configuration to use correct port 8005

### 2. **Incorrect API Route Proxying**
- **Problem**: Nginx was stripping `/api` prefix when proxying to backend
- **Error**: Backend routes mounted at `/api/org` but nginx was proxying to `/`
- **Fix**: Updated proxy_pass to preserve `/api` prefix: `proxy_pass http://localhost:8005/api/`

### 3. **Missing Route Handlers**
- **Problem**: Nginx wasn't handling `/agents/` and `/stripe/` routes separately
- **Fix**: Added specific location blocks for these routes

## Updated Nginx Configuration

The nginx configuration now properly handles:

1. **Calendar API** (`/calendar-api/`) → `localhost:8001/api/v1/`
2. **Agents API** (`/agents/`) → `localhost:8005/agents/`
3. **Stripe API** (`/stripe/`) → `localhost:8005/stripe/`
4. **General API** (`/api/`) → `localhost:8005/api/`
5. **Frontend** (`/`) → `localhost:3000/`

## Backend Route Structure

The backend (Node.js/Express) has the following route structure:
- `/agents` - Agent management routes
- `/stripe` - Stripe payment routes
- `/api/org` - Organization management routes
- `/api/user` - User management routes

## Calendar Backend Route Structure

The calendar backend (FastAPI/Python) uses:
- `/api/v1/` - Base API prefix
- Various endpoints under this prefix

## Testing Commands

### Check Container Status
```bash
docker-compose ps
```

### Test Direct Connections
```bash
# Test backend
curl http://localhost:8005/

# Test calendar backend
curl http://localhost:8001/api/v1/

# Test frontend
curl http://localhost:3000/
```

### Test External Endpoints
```bash
# Test calendar API
curl https://admin-test.xpectrum-ai.com/calendar-api/

# Test backend API
curl https://admin-test.xpectrum-ai.com/api/

# Test agents API
curl https://admin-test.xpectrum-ai.com/agents/
```

### Check Logs
```bash
# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Container logs
docker-compose logs backend --tail=20
docker-compose logs calendar-backend --tail=20
```

## Fix Scripts

1. **update-nginx-production.sh** - Updates nginx configuration
2. **fix-production-issues.sh** - Comprehensive diagnosis and fix script
3. **test-backend-connection.js** - Node.js script to test backend connections

## Deployment Steps

1. Run the fix script:
   ```bash
   chmod +x fix-production-issues.sh
   ./fix-production-issues.sh
   ```

2. Verify the fix:
   ```bash
   # Test external endpoints
   curl https://admin-test.xpectrum-ai.com/api/
   curl https://admin-test.xpectrum-ai.com/agents/
   curl https://admin-test.xpectrum-ai.com/calendar-api/
   ```

## Expected Results

After applying the fixes:
- ✅ Backend API accessible at `/api/`
- ✅ Agents API accessible at `/agents/`
- ✅ Calendar API accessible at `/calendar-api/`
- ✅ No more nginx connection errors
- ✅ All Docker containers running properly

## Monitoring

Monitor the following for ongoing issues:
- Nginx error logs: `/var/log/nginx/error.log`
- Container logs: `docker-compose logs [service-name]`
- Container status: `docker-compose ps` 