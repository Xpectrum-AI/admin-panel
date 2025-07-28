# Port Configuration Analysis

## 📋 **Complete Port Configuration Breakdown**

### **1. Backend Server Code (`backend/src/server.js`)**
```javascript
const port = process.env.PORT || 8000;  // Default: 8000
```

### **2. Docker Compose Files**

#### **Regular docker-compose.yml (Local/Development)**
```yaml
backend:
  ports:
    - "8085:8085"  # Host:Container
  environment:
          - PORT=8085
```

#### **Production docker-compose.production.yml**
```yaml
backend:
  ports:
    - "8085:8085"  # Host:Container
  environment:
    - PORT=8085
  env_file:
    - ./backend/env.production  # Contains PORT=8085
```

### **3. Environment Files**

#### **backend/env.production**
```env
PORT=8085
```

#### **env.production (Root)**
```env
# No PORT specified here
```

### **4. Current Running Containers (from your logs)**
```
backend_1           | 🚀 Server running on port 8085
```

## 🔍 **Analysis Results**

### **What's Actually Running:**
- ✅ **Backend**: Port **8085** (from regular docker-compose.yml)
- ✅ **Frontend**: Port **3000**
- ✅ **Calendar Backend**: Port **8001**

### **What Should Be Running (Production):**
- ❌ **Backend**: Should be on port **8085** (production config)
- ✅ **Frontend**: Port **3000**
- ✅ **Calendar Backend**: Port **8001**

## 🚨 **The Problem**

You're running the **regular docker-compose.yml** instead of the **production docker-compose.production.yml**!

### **Current Setup:**
- Using: `docker-compose up` (regular config)
- Backend running on: **8085**
- Nginx trying to proxy to: **8085** (production config)

### **Solution Options:**

#### **Option 1: Update nginx to use port 8085 (Quick Fix)**
```bash
sudo nano /etc/nginx/sites-available/admin-test.xpectrum-ai.com
```
Change:
```nginx
location /api/ {
    proxy_pass http://localhost:8085/;  # ❌ Wrong
}
```
To:
```nginx
location /api/ {
    proxy_pass http://localhost:8085/;  # ✅ Correct
}
```

#### **Option 2: Use Production Docker Compose (Recommended)**
```bash
# Stop current containers
docker-compose down

# Start with production configuration
docker-compose -f docker-compose.production.yml up -d
```

## 📊 **Port Summary**

| Environment | Backend Port | Frontend Port | Calendar Port |
|-------------|--------------|---------------|---------------|
| **Local** | 8000 | 3000 | 8001 |
| **Production (Current)** | 8085 | 3000 | 8001 |
| **Production (Should be)** | 8085 | 3000 | 8001 |

## 🎯 **Recommendation**

Since you're in production, I recommend **Option 2** - using the production docker-compose configuration:

```bash
# 1. Stop current containers
docker-compose down

# 2. Start with production configuration
docker-compose -f docker-compose.production.yml up -d

# 3. Update nginx to use port 8085
sudo nano /etc/nginx/sites-available/admin-test.xpectrum-ai.com
# Change proxy_pass to http://localhost:8085/

# 4. Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

This will ensure you're using the proper production configuration with the correct ports. 