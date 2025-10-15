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
  console.log('═══════════════════════════════════════════════════════');
  console.log('🕐 Starting scheduled conversation logs backup...');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════');

  const yesterday = new Date(Date.now() - 86400000); // 24 hours ago
  const today = new Date();

  let totalSaved = 0;
  let totalFailed = 0;
  let totalConversations = 0;

  for (const app of APPS) {
    if (!app.app_id || !app.api_key) {
      console.warn(`⚠️  Skipping app: Missing app_id or api_key`);
      continue;
    }

    try {
      console.log(`\n📱 Processing App: ${app.app_id}`);
      console.log(`🔗 API URL: ${app.dify_api_url}`);
      
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

      console.log(`✅ App ${app.app_id}:`);
      console.log(`   📊 Total conversations: ${result.total_conversations}`);
      console.log(`   💾 Saved: ${result.saved_count}`);
      console.log(`   ❌ Failed: ${result.failed_count}`);
      console.log(`   📁 Files: ${result.file_paths.length}`);
    } catch (error) {
      console.error(`❌ App ${app.app_id} failed:`, error);
      totalFailed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📈 Backup Summary:');
  console.log(`   Total Conversations: ${totalConversations}`);
  console.log(`   Successfully Saved: ${totalSaved}`);
  console.log(`   Failed: ${totalFailed}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Get overall summary
  try {
    const summary = ConversationLogService.getLogsSummary();
    const sizeMB = (summary.total_size_bytes / 1024 / 1024).toFixed(2);
    console.log('💽 Storage Summary:');
    console.log(`   Total Files: ${summary.total_files}`);
    console.log(`   Total Size: ${sizeMB} MB`);
    console.log(`   Directories: ${summary.directories.length}`);
  } catch (error) {
    console.error('❌ Failed to get storage summary:', error);
  }
});

/**
 * Weekly cleanup job - runs at 3:00 AM every Sunday
 * Cleans logs older than LOG_RETENTION_DAYS
 */
cron.schedule('0 3 * * 0', async () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧹 Starting scheduled log cleanup...');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`📆 Retention period: ${LOG_RETENTION_DAYS} days`);
  console.log('═══════════════════════════════════════════════════════');

  try {
    const result = ConversationLogService.cleanOldLogs(LOG_RETENTION_DAYS);
    const sizeMB = (result.deleted_size_bytes / 1024 / 1024).toFixed(2);

    console.log('\n✅ Cleanup completed:');
    console.log(`   🗑️  Deleted Files: ${result.deleted_files}`);
    console.log(`   💾 Freed Space: ${sizeMB} MB`);
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
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
      console.warn(`⚠️  WARNING: Log storage exceeds 10 GB (${sizeGB} GB)`);
      console.warn(`   Consider running cleanup or archiving old logs`);
    }

    // Log hourly stats (optional, comment out if too verbose)
    // console.log(`📊 Hourly Check: ${summary.total_files} files, ${sizeMB} MB`);
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
});

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║     Conversation Logs Scheduler Started              ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');
console.log('📅 Scheduled Jobs:');
console.log('   • Daily Backup: 2:00 AM (saves yesterday\'s logs)');
console.log('   • Weekly Cleanup: 3:00 AM Sunday (removes old logs)');
console.log('   • Hourly Health Check: Every hour (monitors storage)');
console.log('');
console.log('⚙️  Configuration:');
console.log(`   • Apps configured: ${APPS.filter(a => a.app_id && a.api_key).length}`);
console.log(`   • Log retention: ${LOG_RETENTION_DAYS} days`);
console.log('');
console.log('Press Ctrl+C to stop the scheduler');
console.log('═══════════════════════════════════════════════════════\n');

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n\n🛑 Scheduler stopped by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Scheduler terminated');
  process.exit(0);
});

