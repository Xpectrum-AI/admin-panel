// scripts/cronScheduler.ts
// Automated cron scheduler for conversation logs backup
// Run this script with: ts-node scripts/cronScheduler.ts

import cron from 'node-cron';
import ConversationLogService from '../service/conversationLogService';

// Configuration from environment variables
const APPS = [
  {
    dify_api_url: process.env.DIFY_API_URL || 'https://api.dify.ai/v1',
    app_id: process.env.DIFY_APP_ID || '',
    api_key: process.env.DIFY_API_KEY || '',
    organization_id: process.env.ORGANIZATION_ID,
  },
  // Add more apps from environment variables if needed
  // You can also load from a config file
];

const LOG_RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || '30');

/**
 * Daily backup job - runs at 2:00 AM every day
 * Saves conversation logs from the previous day
 */
cron.schedule('0 2 * * *', async () => {
const yesterday = new Date(Date.now() - 86400000); // 24 hours ago
  const today = new Date();

  let totalSaved = 0;
  let totalFailed = 0;
  let totalConversations = 0;

  for (const app of APPS) {
    if (!app.app_id || !app.api_key) {
      continue;
    }

    try {
      const result = await ConversationLogService.saveConversationsWithMessages(
        app.dify_api_url,
        app.app_id,
        app.api_key,
        {
          start_date: yesterday.toISOString(),
          end_date: today.toISOString(),
        },
        app.organization_id
      );

      totalSaved += result.saved_count;
      totalFailed += result.failed_count;
      totalConversations += result.total_conversations;
    } catch (error) {
      totalFailed++;
    }
  }
  // Get overall summary
  try {
    const summary = ConversationLogService.getLogsSummary();
    const sizeMB = (summary.total_size_bytes / 1024 / 1024).toFixed(2);
  } catch (error) {
  }
});

/**
 * Weekly cleanup job - runs at 3:00 AM every Sunday
 * Cleans logs older than LOG_RETENTION_DAYS
 */
cron.schedule('0 3 * * 0', async () => {
try {
    const result = ConversationLogService.cleanOldLogs(LOG_RETENTION_DAYS);
    const sizeMB = (result.deleted_size_bytes / 1024 / 1024).toFixed(2);
  } catch (error) {
  }
});

/**
 * Hourly health check - runs every hour
 * Monitors log storage and sends alerts if needed
 */
cron.schedule('0 * * * *', async () => {
  try {
    const summary = ConversationLogService.getLogsSummary();
    const sizeMB = (summary.total_size_bytes / 1024 / 1024).toFixed(2);
    const sizeGB = (summary.total_size_bytes / 1024 / 1024 / 1024).toFixed(2);

    // Alert if storage exceeds 10 GB
    if (summary.total_size_bytes > 10 * 1024 * 1024 * 1024) {
}

    // Log hourly stats (optional, comment out if too verbose)
    // 
  } catch (error) {
  }
});
// Keep the process running
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

