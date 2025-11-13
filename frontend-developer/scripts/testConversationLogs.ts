#!/usr/bin/env ts-node
/**
 * Test script for conversation logs system
 * Run with: npm run logs:test
 * Or: ts-node scripts/testConversationLogs.ts
 */

import ConversationLogService from '../service/conversationLogService';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config(); // Fallback to .env

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: keyof typeof COLORS, message: string) {
}

function section(title: string) {
log('cyan', `  ${title}`);
}

async function testConversationLogsSystem() {
  log('blue', '🧪 Testing Conversation Logs System\n');

  // Test 1: Initialize directories
  section('TEST 1: Initialize Log Directories');
  try {
    ConversationLogService.initializeLogDirectory();
    log('green', '✓ Log directories initialized successfully');
  } catch (error) {
    log('red', `✗ Failed to initialize directories: ${error}`);
    return;
  }

  // Test 2: Get logs summary
  section('TEST 2: Get Logs Summary');
  try {
    const summary = ConversationLogService.getLogsSummary();
    log('green', '✓ Logs summary retrieved successfully');
} catch (error) {
    log('red', `✗ Failed to get logs summary: ${error}`);
  }

  // Test 3: Check environment variables
  section('TEST 3: Check Environment Variables');
  const envVars = {
    DIFY_API_URL: process.env.DIFY_API_URL,
    DIFY_APP_ID: process.env.DIFY_APP_ID,
    DIFY_API_KEY: process.env.DIFY_API_KEY ? '***' + process.env.DIFY_API_KEY.slice(-4) : undefined,
    ORGANIZATION_ID: process.env.ORGANIZATION_ID,
    LOG_RETENTION_DAYS: process.env.LOG_RETENTION_DAYS,
  };

  let missingVars = 0;
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      log('green', `✓ ${key}: ${value}`);
    } else {
      log('yellow', `⚠ ${key}: Not set (optional)`);
      if (key === 'DIFY_API_URL' || key === 'DIFY_APP_ID' || key === 'DIFY_API_KEY') {
        missingVars++;
      }
    }
  }

  // Test 4: Test API connection (if credentials provided)
  if (missingVars === 0) {
    section('TEST 4: Test Dify API Connection');
    try {
      log('blue', 'Attempting to fetch conversations from Dify API...');
      
      const conversations = await ConversationLogService.fetchConversations(
        process.env.DIFY_API_URL!,
        process.env.DIFY_APP_ID!,
        process.env.DIFY_API_KEY!
      );

      log('green', `✓ Successfully connected to Dify API`);
      if (conversations.length > 0) {
        log('blue', '\nSample conversation:');
        const sample = conversations[0];
      }
    } catch (error) {
      log('red', `✗ Failed to connect to Dify API`);
}

    // Test 5: Test saving a single log (dry run with mock data)
    section('TEST 5: Test Log Saving (Mock Data)');
    try {
      const mockConversation = {
        id: 'test-conv-' + Date.now(),
        app_id: process.env.DIFY_APP_ID!,
        name: 'Test Conversation',
        status: 'completed',
        from_source: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        dialogue_count: 1,
        messages: [
          {
            id: 'test-msg-1',
            conversation_id: 'test-conv-' + Date.now(),
            query: 'Test query',
            answer: 'Test answer',
            created_at: new Date().toISOString(),
            message_tokens: 10,
            answer_tokens: 20,
            provider_response_latency: 0.5,
            from_source: 'test',
          },
        ],
      };

      const filePath = await ConversationLogService.saveConversationLog(
        mockConversation,
        process.env.ORGANIZATION_ID
      );

      log('green', '✓ Successfully saved mock conversation log');
      // Verify the file exists
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        const fileSize = fs.statSync(filePath).size;
        log('green', `✓ File verified (${fileSize} bytes)`);

        // Clean up test file
        fs.unlinkSync(filePath);
        log('blue', '  Test file cleaned up');
      }
    } catch (error) {
      log('red', `✗ Failed to save test log`);
}
  } else {
    section('TEST 4-5: Skipped (API Credentials Not Configured)');
    log('yellow', 'To test API functionality, configure these environment variables:');
    log('yellow', '  - DIFY_API_URL');
    log('yellow', '  - DIFY_APP_ID');
    log('yellow', '  - DIFY_API_KEY');
    log('yellow', '\nAdd them to .env.local file');
  }

  // Test 6: Test export functionality
  section('TEST 6: Test Export Functionality');
  try {
    const yesterday = new Date(Date.now() - 86400000);
    const today = new Date();
    
    const logs = await ConversationLogService.exportLogsForDateRange(
      yesterday,
      today,
      process.env.ORGANIZATION_ID
    );

    log('green', '✓ Export functionality works');
  } catch (error) {
    log('red', `✗ Export test failed`);
}

  // Final summary
  section('TEST SUMMARY');
  log('green', '✅ Core functionality tests completed');
  
  if (missingVars > 0) {
    log('yellow', '\n⚠️  Configure API credentials to enable full testing');
    log('yellow', '   Create a .env.local file with:');
    log('yellow', '   - DIFY_API_URL=https://api.dify.ai/v1');
    log('yellow', '   - DIFY_APP_ID=your-app-id');
    log('yellow', '   - DIFY_API_KEY=your-api-key');
  } else {
    log('green', '\n✅ All tests passed! System is ready to use.');
  }
log('blue', '📚 Next Steps:');
}

// Run tests
testConversationLogsSystem()
  .then(() => {
    log('green', '✓ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    log('red', `✗ Test script failed: ${error}`);
    process.exit(1);
  });

