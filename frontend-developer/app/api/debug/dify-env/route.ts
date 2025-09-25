import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN: {
        value: process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN ? 'Set' : 'Missing',
        hasValue: !!process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN
      },
      NEXT_PUBLIC_DIFY_ADMIN_EMAIL: {
        value: process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL ? 'Set' : 'Missing',
        hasValue: !!process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL
      },
      NEXT_PUBLIC_DIFY_ADMIN_PASSWORD: {
        value: process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD ? 'Set' : 'Missing',
        hasValue: !!process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD
      },
      NEXT_PUBLIC_DIFY_WORKSPACE_ID: {
        value: process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID ? 'Set' : 'Missing',
        hasValue: !!process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID
      },
      NEXT_PUBLIC_LIVE_API_URL: {
        value: process.env.NEXT_PUBLIC_LIVE_API_URL ? 'Set' : 'Missing',
        hasValue: !!process.env.NEXT_PUBLIC_LIVE_API_URL
      },
      NEXT_PUBLIC_LIVE_API_KEY: {
        value: process.env.NEXT_PUBLIC_LIVE_API_KEY ? 'Set' : 'Missing',
        hasValue: !!process.env.NEXT_PUBLIC_LIVE_API_KEY
      }
    };

    const allSet = Object.values(envCheck).every(env => env.hasValue);
    
    return NextResponse.json({
      success: true,
      allEnvironmentVariablesSet: allSet,
      environmentVariables: envCheck,
      platform: process.platform,
      nodeVersion: process.version
    });

  } catch (error) {
    console.error('Debug env error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
