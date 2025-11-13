import { NextRequest, NextResponse } from 'next/server';

const DIFY_BASE_URL = process.env.NEXT_PUBLIC_DIFY_BASE_URL || '';

export async function GET(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    // Use the Dify API key from the request body, fallback to environment variable
    const difyApiKey = body.chatbot_api_key || request.headers.get('authorization')?.replace('Bearer ', '') || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
    // Validate required configuration
    if (!DIFY_BASE_URL) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'DIFY_BASE_URL not configured' 
        },
        { status: 400 }
      );
    }
    
    if (!difyApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dify API key not provided' 
        },
        { status: 400 }
      );
    }
    
    try {
      // Try to get app details which might contain configuration
      // Note: Dify doesn't have a direct GET for model-config, so we try app details
      const response = await fetch(`${DIFY_BASE_URL}/apps/current`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${difyApiKey}`,
          'Content-Type': 'application/json',
        },
      });
if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { 
            success: false, 
            error: errorData.error || `HTTP ${response.status}: ${response.statusText}` 
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json({
        success: true,
        data,
        message: 'Agent configuration retrieved successfully'
      });
      
    } catch (difyError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dify API call failed',
          details: difyError instanceof Error ? difyError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get agent configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

