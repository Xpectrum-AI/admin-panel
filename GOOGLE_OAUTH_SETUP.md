# Google OAuth Redirect URL Update Guide

## Current Issue
You're getting 404 errors for calendar API endpoints. After fixing the nginx routing, you may also need to update your Google OAuth redirect URLs.

## Updated Redirect URLs

### Before (Old URLs - causing 404 errors):
```
https://admin-test.xpectrum-ai.com/api/v1/oauth2callback
https://admin-test.xpectrum-ai.com/api/v1/calendar/oauth2callback
```

### After (New URLs - working with nginx routing):
```
https://admin-test.xpectrum-ai.com/calendar-api/oauth2callback
https://admin-test.xpectrum-ai.com/calendar-api/calendar/oauth2callback
```

## Steps to Update Google OAuth Redirect URLs

### 1. Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project: `xpectrum-ai` (or your project name)

### 2. Navigate to OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID: `441654168539-9tfk7ibkt2r9tbsoohpjjfmjjn8u4lf0.apps.googleusercontent.com`
3. Click on the client ID to edit

### 3. Update Authorized Redirect URIs
In the **Authorized redirect URIs** section, update these URLs:

**Remove these old URLs:**
```
https://admin-test.xpectrum-ai.com/api/v1/oauth2callback
https://admin-test.xpectrum-ai.com/api/v1/calendar/oauth2callback
```

**Add these new URLs:**
```
https://admin-test.xpectrum-ai.com/calendar-api/oauth2callback
https://admin-test.xpectrum-ai.com/calendar-api/calendar/oauth2callback
```

### 4. Save Changes
1. Click **Save** at the bottom of the page
2. Wait a few minutes for changes to propagate

## Verification Steps

### 1. Test OAuth Flow
1. Go to: https://admin-test.xpectrum-ai.com
2. Try to log in with Google
3. Check if the OAuth redirect works properly

### 2. Check Browser Console
1. Open browser developer tools (F12)
2. Go to the Network tab
3. Try logging in with Google
4. Look for successful redirects to the new URLs

### 3. Test Calendar Integration
1. After successful login, try accessing calendar features
2. Check if calendar OAuth flow works

## Environment Files Already Updated

The following files have already been updated with the new redirect URLs:

- ✅ `env.production`
- ✅ `calendar-backend/env_config.txt`

## Production Deployment Steps

### Option 1: Full Production Deployment
```bash
# On your EC2 instance
sudo ./deploy-production-ec2.sh
```

### Option 2: Update Nginx Only
```bash
# On your EC2 instance
sudo ./update-nginx-production.sh
```

### Option 3: Manual Steps
```bash
# 1. Update nginx configuration
sudo nano /etc/nginx/sites-available/admin-test.xpectrum-ai.com
# (Copy the configuration from nginx-config-updated.conf)

# 2. Test nginx configuration
sudo nginx -t

# 3. Reload nginx
sudo systemctl reload nginx

# 4. Restart Docker services
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
```

## Expected Results After Updates

✅ **No more 404 errors** for calendar API endpoints
✅ **OAuth redirects work** properly
✅ **Calendar integration** functions correctly
✅ **Welcome form** loads without errors

## Troubleshooting

### If you still get 404 errors:
1. **Check nginx logs**: `sudo tail -f /var/log/nginx/error.log`
2. **Check Docker logs**: `docker-compose -f docker-compose.production.yml logs calendar-backend`
3. **Test direct access**: `curl https://admin-test.xpectrum-ai.com/calendar-api/`
4. **Verify Google OAuth URLs**: Double-check the redirect URLs in Google Cloud Console

### If OAuth redirects fail:
1. **Check Google Cloud Console**: Ensure redirect URLs are exactly correct
2. **Wait for propagation**: Google OAuth changes can take 5-10 minutes
3. **Clear browser cache**: Clear cookies and cache for the domain
4. **Test in incognito mode**: Try the OAuth flow in a private browser window

## Summary

The 404 errors were caused by:
1. **Incorrect nginx routing** - Fixed by updating nginx configuration
2. **Wrong API base URLs** - Fixed by updating frontend code
3. **Outdated OAuth redirect URLs** - Fixed by updating Google Cloud Console

After applying all fixes, your calendar API should work properly without 404 errors. 