import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key') || 
                   request.headers.get('X-API-Key') ||
                   request.headers.get('authorization')?.replace('Bearer ', '');

    const envVars = {
      NEXT_PUBLIC_LIVE_API_KEY: process.env.NEXT_PUBLIC_LIVE_API_KEY ? 'Present' : 'Missing',
      NEXT_PUBLIC_PROPELAUTH_API_KEY: process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY ? 'Present' : 'Missing',
      NEXT_PUBLIC_DIFY_BASE_URL: process.env.NEXT_PUBLIC_DIFY_BASE_URL ? 'Present' : 'Missing',
      NEXT_PUBLIC_CHATBOT_API_KEY: process.env.NEXT_PUBLIC_CHATBOT_API_KEY ? 'Present' : 'Missing'
    };

    return NextResponse.json({
      success: true,
      receivedApiKey: apiKey ? 'Present' : 'Missing',
      apiKeyValue: apiKey,
      environmentVariables: envVars,
      headers: Object.fromEntries(request.headers.entries())
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
