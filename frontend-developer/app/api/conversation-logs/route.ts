// app/api/conversation-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import ConversationLogService from '@/service/conversationLogService';

/**
 * GET /api/conversation-logs
 * Get logs summary or export logs for a date range
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const organizationId = searchParams.get('organization_id') || undefined;

    if (action === 'summary') {
      // Get logs summary
      const summary = ConversationLogService.getLogsSummary(organizationId);
      return NextResponse.json({
        success: true,
        ...summary,
      });
    }

    if (action === 'export') {
      // Export logs for date range
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');

      if (!startDate || !endDate) {
        return NextResponse.json(
          { success: false, error: 'start_date and end_date are required for export' },
          { status: 400 }
        );
      }

      const conversations = await ConversationLogService.exportLogsForDateRange(
        new Date(startDate),
        new Date(endDate),
        organizationId
      );

      return NextResponse.json({
        success: true,
        count: conversations.length,
        conversations,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use action=summary or action=export' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversation-logs
 * Save conversation logs from Dify API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dify_api_url,
      app_id,
      api_key,
      organization_id,
      filters,
    } = body;

    // Validate required fields
    if (!dify_api_url || !app_id || !api_key) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: dify_api_url, app_id, api_key',
        },
        { status: 400 }
      );
    }

    // Save conversations with messages
    const result = await ConversationLogService.saveConversationsWithMessages(
      dify_api_url,
      app_id,
      api_key,
      filters,
      organization_id
    );

    return NextResponse.json({
      success: true,
      message: 'Conversation logs saved successfully',
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save conversation logs',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversation-logs
 * Clean old conversation logs
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysToKeep = parseInt(searchParams.get('days_to_keep') || '30');
    const organizationId = searchParams.get('organization_id') || undefined;

    if (isNaN(daysToKeep) || daysToKeep < 1) {
      return NextResponse.json(
        { success: false, error: 'days_to_keep must be a positive number' },
        { status: 400 }
      );
    }

    const result = ConversationLogService.cleanOldLogs(daysToKeep, organizationId);

    return NextResponse.json({
      success: true,
      message: `Deleted logs older than ${daysToKeep} days`,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clean old logs',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

