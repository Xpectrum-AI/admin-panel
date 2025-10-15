# Conversation Logs - Quick Start (5 Minutes)

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies (30 seconds)

```bash
cd /Users/subhankarghosh/subhankar/developers/admin-panel/frontend-developer
npm install
```

### Step 2: Configure (1 minute)

Create `.env.local`:

```bash
cat > .env.local << 'EOF'
DIFY_API_URL=https://api.dify.ai/v1
DIFY_APP_ID=your-app-id-here
DIFY_API_KEY=your-api-key-here
ORGANIZATION_ID=your-org-id
LOG_RETENTION_DAYS=30
EOF
```

Replace `your-app-id-here` and `your-api-key-here` with your actual Dify credentials.

### Step 3: Test (30 seconds)

```bash
npm run logs:test
```

You should see: ✓ Tests passed

### Step 4: Choose Your Method

#### Option A: Use UI Component (Recommended)

Add to any page:

```tsx
import ConversationLogsTab from '@/app/components/ConversationLogsTab';

export default function Page() {
  return <ConversationLogsTab />;
}
```

Start your app:
```bash
npm run dev
```

Navigate to your page and click "Save Conversation Logs"!

#### Option B: Use API Directly

Save logs:
```bash
curl -X POST http://localhost:3001/api/conversation-logs \
  -H "Content-Type: application/json" \
  -d '{
    "dify_api_url": "'$DIFY_API_URL'",
    "app_id": "'$DIFY_APP_ID'",
    "api_key": "'$DIFY_API_KEY'"
  }'
```

#### Option C: Automate with Cron

Run scheduler:
```bash
npm run logs:scheduler
```

This will:
- Backup logs daily at 2 AM
- Clean old logs weekly
- Monitor storage hourly

---

## 📁 Where Are Logs Saved?

```
logs/conversations/
└── [org-id]/
    └── 2025/
        └── 10/
            └── 15/
                └── conversation_abc123_2025-10-15T10-30-00.json
```

---

## 🔍 View Your Logs

```bash
# List all logs
ls -lah logs/conversations/

# View a log file
find logs/conversations -name "*.json" | head -1 | xargs cat | jq
```

---

## 📊 Check Summary

```bash
curl http://localhost:3001/api/conversation-logs?action=summary
```

---

## 🎯 Common Commands

```bash
# Test system
npm run logs:test

# Run scheduler (automated backups)
npm run logs:scheduler

# Manual backup
npm run logs:backup

# Start dev server
npm run dev
```

---

## 📚 Need More Help?

- **Detailed Guide:** `CONVERSATION_LOGS_GUIDE.md`
- **Installation:** `INSTALLATION_GUIDE_CONVERSATION_LOGS.md`
- **Full Details:** `CONVERSATION_LOGS_README.md`
- **Changes:** `CHANGES_SUMMARY.md`

---

## ✅ That's It!

You're now logging conversations! 🎉

**Quick Tips:**
- Logs are saved automatically to `logs/conversations/`
- Old logs clean up automatically (default: 30 days)
- Use the UI for easy management
- Set up automation for hands-off operation

**Next Steps:**
- Customize retention period in `.env.local`
- Add the UI component to your app
- Set up automated backups with `npm run logs:scheduler`
- Export logs for analysis

---

**Status:** ✅ Ready to use!  
**Location:** `/Users/subhankarghosh/subhankar/developers/admin-panel/frontend-developer`

