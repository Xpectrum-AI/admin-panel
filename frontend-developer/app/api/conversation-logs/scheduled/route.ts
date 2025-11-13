// app/api/conversation-logs/scheduled/route.ts
import { NextRequest, NextResponse } from 'next/server';
import ConversationLogService from '@/service/conversationLogService';

/**
 * POST /api/conversation-logs/scheduled
 * Scheduled job to automatically save conversation logs
 * This endpoint should be called by a cron job or scheduled task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      apps, // Array of { dify_api_url, app_id, api_key, organization_id }
      filters,
    } = body;

    if (!apps || !Array.isArray(apps) || apps.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'apps array is required',
        },
        { status: 400 }
      );
    }

    const results = [];
    let totalSaved = 0;
    let totalFailed = 0;

    for (const app of apps) {
      try {
        const { dify_api_url, app_id, api_key, organization_id } = app;

        if (!dify_api_url || !app_id || !api_key) {
          results.push({
            app_id,
            success: false,
            error: 'Missing required fields',
          });
          continue;
        }

        const result = await ConversationLogService.saveConversationsWithMessages(
          dify_api_url,
          app_id,
          api_key,
          filters,
          organization_id
        );

        totalSaved += result.saved_count;
        totalFailed += result.failed_count;

        results.push({
          app_id,
          success: result.success,
          ...result,
        });
      } catch (error) {
        results.push({
          app_id: app.app_id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled log job completed',
      total_apps: apps.length,
      total_saved: totalSaved,
      total_failed: totalFailed,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled logs',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

