# Conversation Logs Management Guide

This guide explains how to use the conversation logging system to save, manage, and export conversation logs from your Dify applications.

## Overview

The conversation logging system provides:
- **Automatic log saving** from Dify API to local filesystem
- **Organized storage** by organization, year, month, and day
- **Export capabilities** to download logs for specific date ranges
- **Cleanup utilities** to manage disk space
- **Scheduled logging** for automated backups

## Directory Structure

Logs are saved in the following structure:

```
logs/
└── conversations/
    └── [organization_id]/          # Optional organization grouping
        └── [year]/                  # e.g., 2025
            └── [month]/             # e.g., 10
                └── [day]/           # e.g., 15
                    └── conversation_[id]_[timestamp].json
```

## Features

### 1. Save Conversation Logs

Save conversations from Dify API to local log files.

**API Endpoint:**
```bash
POST /api/conversation-logs
```

**Request Body:**
```json
{
  "dify_api_url": "https://api.dify.ai/v1",
  "app_id": "your-app-id",
  "api_key": "your-api-key",
  "organization_id": "optional-org-id",
  "filters": {
    "start_date": "2025-10-01T00:00:00Z",
    "end_date": "2025-10-15T23:59:59Z",
    "from_source": "api"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation logs saved successfully",
  "total_conversations": 150,
  "saved_count": 148,
  "failed_count": 2,
  "file_paths": ["logs/conversations/org-123/2025/10/15/conversation_xxx.json"]
}
```

### 2. Get Logs Summary

Retrieve statistics about saved logs.

**API Endpoint:**
```bash
GET /api/conversation-logs?action=summary&organization_id=optional-org-id
```

**Response:**
```json
{
  "success": true,
  "total_files": 1250,
  "total_size_bytes": 52428800,
  "directories": ["logs/conversations/2025/10/14", "logs/conversations/2025/10/15"]
}
```

### 3. Export Logs

Export logs for a specific date range as JSON.

**API Endpoint:**
```bash
GET /api/conversation-logs?action=export&start_date=2025-10-01&end_date=2025-10-15&organization_id=optional-org-id
```

**Response:**
```json
{
  "success": true,
  "count": 150,
  "conversations": [
    {
      "conversation_id": "conv-xxx",
      "app_id": "app-xxx",
      "name": "Customer Support Chat",
      "messages": [...],
      "logged_at": "2025-10-15T12:00:00Z"
    }
  ]
}
```

### 4. Clean Old Logs

Delete logs older than a specified number of days.

**API Endpoint:**
```bash
DELETE /api/conversation-logs?days_to_keep=30&organization_id=optional-org-id
```

**Response:**
```json
{
  "success": true,
  "message": "Deleted logs older than 30 days",
  "deleted_files": 245,
  "deleted_size_bytes": 10485760
}
```

### 5. Scheduled Logging

Automatically save logs for multiple apps at once.

**API Endpoint:**
```bash
POST /api/conversation-logs/scheduled
```

**Request Body:**
```json
{
  "apps": [
    {
      "dify_api_url": "https://api.dify.ai/v1",
      "app_id": "app-1",
      "api_key": "key-1",
      "organization_id": "org-1"
    },
    {
      "dify_api_url": "https://api.dify.ai/v1",
      "app_id": "app-2",
      "api_key": "key-2",
      "organization_id": "org-2"
    }
  ],
  "filters": {
    "start_date": "2025-10-15T00:00:00Z"
  }
}
```

## Usage Examples

### Using the UI Component

1. Import the `ConversationLogsTab` component:

```tsx
import ConversationLogsTab from '@/app/components/ConversationLogsTab';

// In your page/component
<ConversationLogsTab organizationId="optional-org-id" />
```

2. The UI provides:
   - View current logs summary
   - Save new conversation logs
   - Export logs for date ranges
   - Clean old logs

### Using the Service Directly

```typescript
import ConversationLogService from '@/service/conversationLogService';

// Save conversations with messages
const result = await ConversationLogService.saveConversationsWithMessages(
  'https://api.dify.ai/v1',
  'your-app-id',
  'your-api-key',
  {
    start_date: '2025-10-01T00:00:00Z',
    end_date: '2025-10-15T23:59:59Z',
  },
  'optional-org-id'
);

console.log(`Saved ${result.saved_count} conversations`);

// Get logs summary
const summary = ConversationLogService.getLogsSummary('optional-org-id');
console.log(`Total files: ${summary.total_files}`);

// Export logs for date range
const logs = await ConversationLogService.exportLogsForDateRange(
  new Date('2025-10-01'),
  new Date('2025-10-15'),
  'optional-org-id'
);

// Clean old logs (keep last 30 days)
const cleaned = ConversationLogService.cleanOldLogs(30, 'optional-org-id');
console.log(`Deleted ${cleaned.deleted_files} files`);
```

## Automation with Cron Jobs

### Setup with Node-Cron (Next.js)

Install node-cron:
```bash
npm install node-cron
```

Create a cron job script:

```typescript
// scripts/logScheduler.ts
import cron from 'node-cron';
import ConversationLogService from '@/service/conversationLogService';

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting scheduled conversation log backup...');
  
  const apps = [
    {
      dify_api_url: process.env.DIFY_API_URL,
      app_id: process.env.DIFY_APP_ID_1,
      api_key: process.env.DIFY_API_KEY_1,
      organization_id: 'org-1',
    },
    // Add more apps as needed
  ];

  for (const app of apps) {
    try {
      const result = await ConversationLogService.saveConversationsWithMessages(
        app.dify_api_url!,
        app.app_id!,
        app.api_key!,
        {
          // Get yesterday's conversations
          start_date: new Date(Date.now() - 86400000).toISOString(),
          end_date: new Date().toISOString(),
        },
        app.organization_id
      );
      
      console.log(`✓ App ${app.app_id}: Saved ${result.saved_count} conversations`);
    } catch (error) {
      console.error(`✗ App ${app.app_id}: Failed to save logs`, error);
    }
  }
  
  console.log('Scheduled backup completed');
});

// Clean old logs every Sunday at 3 AM
cron.schedule('0 3 * * 0', async () => {
  console.log('Cleaning old conversation logs...');
  
  const result = ConversationLogService.cleanOldLogs(30); // Keep 30 days
  console.log(`Deleted ${result.deleted_files} old log files (${(result.deleted_size_bytes / 1024 / 1024).toFixed(2)} MB)`);
});
```

### Setup with System Cron (Unix/Linux)

Create a script:

```bash
#!/bin/bash
# scripts/save-conversation-logs.sh

curl -X POST http://localhost:3000/api/conversation-logs/scheduled \
  -H "Content-Type: application/json" \
  -d '{
    "apps": [
      {
        "dify_api_url": "'$DIFY_API_URL'",
        "app_id": "'$DIFY_APP_ID'",
        "api_key": "'$DIFY_API_KEY'",
        "organization_id": "org-1"
      }
    ]
  }'
```

Add to crontab:
```bash
# Save logs daily at 2 AM
0 2 * * * /path/to/scripts/save-conversation-logs.sh

# Clean old logs weekly on Sunday at 3 AM
0 3 * * 0 curl -X DELETE "http://localhost:3000/api/conversation-logs?days_to_keep=30"
```

## Log File Format

Each conversation log file contains:

```json
{
  "conversation_id": "conv-abc123",
  "app_id": "app-xyz789",
  "name": "Customer Support Chat #123",
  "status": "completed",
  "from_source": "whatsapp",
  "created_at": "2025-10-15T10:30:00Z",
  "updated_at": "2025-10-15T10:45:00Z",
  "dialogue_count": 15,
  "messages": [
    {
      "id": "msg-1",
      "conversation_id": "conv-abc123",
      "query": "Hello, I need help with my order",
      "answer": "Hello! I'd be happy to help you with your order...",
      "created_at": "2025-10-15T10:30:15Z",
      "message_tokens": 25,
      "answer_tokens": 150,
      "provider_response_latency": 1.23,
      "from_source": "whatsapp",
      "from_end_user_id": "user-456"
    }
  ],
  "logged_at": "2025-10-15T12:00:00Z"
}
```

## Best Practices

1. **Regular Backups**: Schedule daily backups to ensure no data loss
2. **Disk Space Management**: Regularly clean old logs to manage storage
3. **Organization Structure**: Use organization IDs for multi-tenant systems
4. **API Rate Limits**: Be mindful of Dify API rate limits when fetching logs
5. **Error Handling**: Monitor the scheduled job results for failures
6. **Security**: Protect API keys and never commit them to version control
7. **Data Retention**: Comply with data retention policies for your organization

## Troubleshooting

### Logs Not Saving

- Check Dify API credentials
- Verify API endpoint is accessible
- Check disk space availability
- Review application logs for errors

### Large File Sizes

- Implement log rotation
- Clean old logs regularly
- Consider compressing old log files

### Permission Issues

- Ensure the application has write permissions to the logs directory
- Check directory ownership and permissions

## Environment Variables

Add these to your `.env` file for convenience:

```env
# Dify API Configuration
DIFY_API_URL=https://api.dify.ai/v1
DIFY_APP_ID=your-app-id
DIFY_API_KEY=your-api-key

# Logging Configuration
LOG_RETENTION_DAYS=30
ENABLE_AUTO_LOGGING=true
```

## Support

For issues or questions:
1. Check the application logs
2. Review the API response messages
3. Verify your Dify API credentials
4. Ensure proper network connectivity

## Future Enhancements

Potential improvements:
- Compression of old log files
- Upload logs to cloud storage (S3, GCS)
- Real-time log streaming
- Analytics and reporting on logs
- Search and filter capabilities
- Webhook notifications for failed backups

