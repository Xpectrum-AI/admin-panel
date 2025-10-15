# Conversation Logs System - Installation Guide

## 🎯 Quick Installation

This guide will help you set up and start using the conversation logging system in 5 minutes.

## 📦 Step 1: Install Dependencies (Optional)

If you want to use automated scheduling with Node.js:

```bash
cd /Users/subhankarghosh/subhankar/developers/admin-panel/frontend-developer

# Install node-cron for automated scheduling
npm install node-cron

# Install dotenv if not already installed
npm install dotenv

# Install @types for TypeScript
npm install -D @types/node-cron
```

## 🔧 Step 2: Configure Environment Variables

### Option A: Using .env.local (Recommended)

Create a `.env.local` file in the project root:

```bash
cat > .env.local << 'EOF'
# Dify API Configuration
DIFY_API_URL=https://api.dify.ai/v1
DIFY_APP_ID=your-app-id-here
DIFY_API_KEY=your-api-key-here

# Optional: Organization ID for multi-tenant setup
ORGANIZATION_ID=your-org-id

# Optional: Log retention period (days)
LOG_RETENTION_DAYS=30

# Optional: Enable auto logging
ENABLE_AUTO_LOGGING=true
EOF
```

### Option B: Using System Environment Variables

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export DIFY_API_URL="https://api.dify.ai/v1"
export DIFY_APP_ID="your-app-id"
export DIFY_API_KEY="your-api-key"
export ORGANIZATION_ID="your-org-id"
export LOG_RETENTION_DAYS="30"
```

Then reload:
```bash
source ~/.bashrc  # or ~/.zshrc
```

## 🧪 Step 3: Test the Installation

Run the test script to verify everything is working:

```bash
npm run logs:test
```

This will:
- ✅ Initialize log directories
- ✅ Get logs summary
- ✅ Check environment variables
- ✅ Test Dify API connection (if configured)
- ✅ Test log saving functionality
- ✅ Test export functionality

Expected output:
```
🧪 Testing Conversation Logs System

============================================================
  TEST 1: Initialize Log Directories
============================================================

✓ Log directories initialized successfully

============================================================
  TEST 2: Get Logs Summary
============================================================

✓ Logs summary retrieved successfully
  Total Files: 0
  Total Size: 0.00 MB
  Directories: 0
...
```

## 🎨 Step 4: Add UI Component to Your App

### Option A: Add to an existing page

Edit your page (e.g., `app/page.tsx`):

```tsx
import ConversationLogsTab from './components/ConversationLogsTab';

export default function Page() {
  return (
    <div>
      <h1>Admin Panel</h1>
      <ConversationLogsTab organizationId="your-org-id" />
    </div>
  );
}
```

### Option B: Create a dedicated logs page

Create `app/logs/page.tsx`:

```tsx
import ConversationLogsTab from '../components/ConversationLogsTab';

export default function LogsPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Conversation Logs</h1>
      <ConversationLogsTab />
    </div>
  );
}
```

## 🚀 Step 5: Start Using the System

### Via UI

1. Start your Next.js app:
```bash
npm run dev
```

2. Navigate to the logs page in your browser

3. Fill in the form:
   - Dify API URL (or use env variable)
   - App ID (or use env variable)
   - API Key (or use env variable)
   - Optional: Date range filter
   - Optional: Source filter

4. Click "Save Conversation Logs"

### Via API

Use curl or any HTTP client:

```bash
# Save logs
curl -X POST http://localhost:3001/api/conversation-logs \
  -H "Content-Type: application/json" \
  -d '{
    "dify_api_url": "https://api.dify.ai/v1",
    "app_id": "your-app-id",
    "api_key": "your-api-key"
  }'

# Get summary
curl http://localhost:3001/api/conversation-logs?action=summary

# Export logs
curl "http://localhost:3001/api/conversation-logs?action=export&start_date=2025-10-01&end_date=2025-10-15"

# Clean old logs
curl -X DELETE "http://localhost:3001/api/conversation-logs?days_to_keep=30"
```

### Via Code

Use the service directly in your application:

```typescript
import ConversationLogService from '@/service/conversationLogService';

async function saveMyLogs() {
  const result = await ConversationLogService.saveConversationsWithMessages(
    process.env.DIFY_API_URL!,
    process.env.DIFY_APP_ID!,
    process.env.DIFY_API_KEY!
  );
  
  console.log(`Saved ${result.saved_count} conversations`);
}
```

## ⏰ Step 6: Set Up Automation (Optional)

### Option A: Node.js Cron Scheduler (Recommended)

1. Make sure dependencies are installed:
```bash
npm install node-cron dotenv
```

2. Run the scheduler:
```bash
npm run logs:scheduler
```

This starts a background process that:
- Backs up logs daily at 2:00 AM
- Cleans old logs weekly at 3:00 AM (Sunday)
- Runs health checks hourly

3. Keep it running in the background (using PM2):
```bash
# Install PM2
npm install -g pm2

# Start scheduler
pm2 start npm --name "conversation-logs-scheduler" -- run logs:scheduler

# Save PM2 config
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Option B: System Cron (Unix/Linux/Mac)

1. Make script executable:
```bash
chmod +x scripts/save-conversation-logs.sh
```

2. Edit crontab:
```bash
crontab -e
```

3. Add these lines:
```cron
# Daily backup at 2 AM
0 2 * * * cd /Users/subhankarghosh/subhankar/developers/admin-panel/frontend-developer && ./scripts/save-conversation-logs.sh

# Weekly cleanup at 3 AM Sunday
0 3 * * 0 curl -X DELETE "http://localhost:3001/api/conversation-logs?days_to_keep=30"
```

4. Verify crontab:
```bash
crontab -l
```

### Option C: Manual Backup Script

Run the backup script whenever needed:

```bash
npm run logs:backup
```

Or directly:
```bash
./scripts/save-conversation-logs.sh
```

## 📁 Step 7: Verify Logs are Being Saved

Check the logs directory:

```bash
# Navigate to logs directory
cd logs/conversations

# List logs
ls -lah

# View a log file
find . -name "*.json" -type f | head -1 | xargs cat | jq
```

Expected structure:
```
logs/
└── conversations/
    └── [org-id]/              # If using organization ID
        └── 2025/
            └── 10/
                └── 15/
                    ├── conversation_abc123_2025-10-15T10-30-00.json
                    ├── conversation_def456_2025-10-15T11-45-00.json
                    └── ...
```

## ✅ Verification Checklist

- [ ] Dependencies installed (if using scheduler)
- [ ] Environment variables configured
- [ ] Test script passes (`npm run logs:test`)
- [ ] UI component renders correctly
- [ ] Can save logs manually via UI
- [ ] Can get logs summary
- [ ] Can export logs
- [ ] Can clean old logs
- [ ] Automation set up (optional)
- [ ] Logs directory exists and has proper permissions

## 🐛 Troubleshooting

### Issue: Test script fails

**Error:** `Cannot find module 'node-cron'`

**Solution:**
```bash
npm install node-cron dotenv
npm install -D @types/node-cron
```

### Issue: Permission denied on logs directory

**Solution:**
```bash
# Create logs directory with proper permissions
mkdir -p logs/conversations
chmod -R 755 logs
```

### Issue: API connection fails

**Checklist:**
- [ ] Verify DIFY_API_URL is correct
- [ ] Check API key is valid
- [ ] Ensure app ID is correct
- [ ] Check network connectivity
- [ ] Verify Dify API is accessible

### Issue: Cannot write to logs directory

**Solution:**
```bash
# Check current user
whoami

# Fix ownership
sudo chown -R $(whoami):$(whoami) logs/

# Fix permissions
chmod -R 755 logs/
```

### Issue: Cron job not running

**Solutions:**

For Node.js scheduler:
```bash
# Check if process is running
ps aux | grep cronScheduler

# Check PM2 status
pm2 status

# View logs
pm2 logs conversation-logs-scheduler
```

For system cron:
```bash
# Check if cron is running
sudo systemctl status cron

# View cron logs
grep CRON /var/log/syslog | tail

# Verify crontab
crontab -l
```

## 🎓 Next Steps

1. **Read the detailed guide:** `CONVERSATION_LOGS_GUIDE.md`
2. **Understand the implementation:** `CONVERSATION_LOGS_README.md`
3. **Customize as needed:**
   - Modify log storage path
   - Adjust retention period
   - Add custom filters
   - Implement additional features

## 📞 Support

If you encounter issues:

1. Run the test script: `npm run logs:test`
2. Check application logs
3. Verify environment variables
4. Review error messages
5. Check file permissions
6. Consult the troubleshooting section

## 📚 Additional Resources

- **Usage Guide:** `CONVERSATION_LOGS_GUIDE.md`
- **Implementation Details:** `CONVERSATION_LOGS_README.md`
- **Dify API Docs:** https://docs.dify.ai/
- **Next.js Docs:** https://nextjs.org/docs

## 🎉 Success!

Once you complete all steps, your conversation logging system is ready to:

✅ Automatically backup conversations  
✅ Manage logs through UI  
✅ Export data for analysis  
✅ Clean old logs automatically  
✅ Support multiple organizations  
✅ Monitor storage usage  

**Happy logging! 🎊**

---

**Last Updated:** October 15, 2025  
**Project:** Admin Panel Frontend Developer  
**Location:** `/Users/subhankarghosh/subhankar/developers/admin-panel/frontend-developer`

