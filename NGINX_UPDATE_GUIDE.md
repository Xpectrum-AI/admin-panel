# Nginx Configuration Update Guide

## 🔧 **What Changed:**

Your nginx configuration needs to be updated to include the calendar backend service. The calendar backend runs on port 8001 and needs to be accessible via `/calendar-api/` path.

## 📋 **Updated Configuration:**

### **Key Changes:**

1. **Added Calendar API Route:**
   ```nginx
   location /calendar-api/ {
       proxy_pass http://localhost:8001/api/v1/;
       # ... proxy settings
   }
   ```

2. **Updated OAuth Redirect URIs:**
   - `REDIRECT_URI`: `https://admin-test.xpectrum-ai.com/calendar-api/oauth2callback`
   - `CALENDAR_REDIRECT_URI`: `https://admin-test.xpectrum-ai.com/calendar-api/calendar/oauth2callback`

3. **Added CORS Headers:**
   - Proper CORS configuration for the calendar API
   - Preflight request handling

## 🚀 **Deployment Steps:**

### **Step 1: Update Nginx Configuration**

1. **Backup your current nginx config:**
   ```bash
   sudo cp /etc/nginx/sites-available/admin-test.xpectrum-ai.com /etc/nginx/sites-available/admin-test.xpectrum-ai.com.backup
   ```

2. **Update the nginx configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/admin-test.xpectrum-ai.com
   ```

3. **Replace the content with the updated configuration** (use the `nginx-config-updated.conf` file)

### **Step 2: Test Nginx Configuration**

```bash
sudo nginx -t
```

### **Step 3: Reload Nginx**

```bash
sudo systemctl reload nginx
```

## 🌐 **Service URLs After Update:**

- **Frontend:** `https://admin-test.xpectrum-ai.com`
- **Main Backend API:** `https://admin-test.xpectrum-ai.com/api/`
- **Calendar Backend API:** `https://admin-test.xpectrum-ai.com/calendar-api/`
- **Calendar API Docs:** `https://admin-test.xpectrum-ai.com/calendar-api/docs`

## 🔍 **Testing the Configuration:**

### **Test Calendar API:**
```bash
curl https://admin-test.xpectrum-ai.com/calendar-api/
```

### **Test OAuth Callback:**
```bash
curl https://admin-test.xpectrum-ai.com/calendar-api/oauth2callback
```

## ⚠️ **Important Notes:**

1. **Port Mapping:**
   - Frontend: `localhost:3000`
   - Main Backend: `localhost:8085`
   - Calendar Backend: `localhost:8001`

2. **SSL Certificate:**
   - Make sure your SSL certificate covers `admin-test.xpectrum-ai.com`
   - The calendar API will use the same SSL certificate

3. **Firewall:**
   - Ensure port 8001 is accessible internally
   - External access is handled through nginx proxy

## 🔧 **Troubleshooting:**

### **If nginx fails to reload:**
```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check nginx configuration
sudo nginx -t
```

### **If calendar API is not accessible:**
```bash
# Check if calendar backend is running
curl http://localhost:8001/api/v1/

# Check nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### **If OAuth redirects fail:**
1. Verify the redirect URIs in Google Console
2. Check the PropelAuth configuration
3. Ensure CORS headers are properly set

## 📝 **Environment Variables to Update:**

Make sure your production environment has the correct URLs:

```bash
# In env.production
REDIRECT_URI=https://admin-test.xpectrum-ai.com/calendar-api/oauth2callback
CALENDAR_REDIRECT_URI=https://admin-test.xpectrum-ai.com/calendar-api/calendar/oauth2callback
FRONTEND_URL=https://admin-test.xpectrum-ai.com
CORS_ORIGINS=https://admin-test.xpectrum-ai.com,https://auth.admin-test.xpectrum-ai.com
```

## 🎯 **Result:**

After updating nginx, your calendar backend will be accessible at:
- **API Base:** `https://admin-test.xpectrum-ai.com/calendar-api/`
- **OAuth Callback:** `https://admin-test.xpectrum-ai.com/calendar-api/oauth2callback`
- **API Documentation:** `https://admin-test.xpectrum-ai.com/calendar-api/docs`

The calendar backend will be properly integrated with your existing nginx setup and SSL certificate! 🎉 