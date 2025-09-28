import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      NEXT_PUBLIC_LIVE_API_KEY: process.env.NEXT_PUBLIC_LIVE_API_KEY,
      NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY: process.env.NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY,
      NEXT_PUBLIC_DIFY_BASE_URL: process.env.NEXT_PUBLIC_DIFY_BASE_URL,
      NEXT_PUBLIC_CHATBOT_API_URL: process.env.NEXT_PUBLIC_CHATBOT_API_URL,
      NEXT_PUBLIC_CHATBOT_API_KEY: process.env.NEXT_PUBLIC_CHATBOT_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
    };

    console.log('🔍 Environment variables debug:', envVars);

    return NextResponse.json({
      success: true,
      environment: envVars,
      message: 'Environment variables debug info',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug environment error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get environment variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
