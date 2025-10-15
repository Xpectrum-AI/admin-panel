import { NextRequest, NextResponse } from 'next/server';

const DIFY_BASE_URL = process.env.NEXT_PUBLIC_DIFY_BASE_URL || '';

export async function GET(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    console.log('📖 Getting agent config:', body);
    
    // Use the Dify API key from the request body, fallback to environment variable
    const difyApiKey = body.chatbot_api_key || request.headers.get('authorization')?.replace('Bearer ', '') || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
    console.log('🔍 Dify API key:', difyApiKey ? 'Present' : 'Missing');
    
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
      console.log('🔍 Making request to Dify API:', {
        url: `${DIFY_BASE_URL}/apps/current`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${difyApiKey}`,
          'Content-Type': 'application/json',
        }
      });

      const response = await fetch(`${DIFY_BASE_URL}/apps/current`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${difyApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 Dify API response status:', response.status);
      console.log('🔍 Dify API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to get agent config:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: errorData.error || `HTTP ${response.status}: ${response.statusText}` 
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('✅ Agent config retrieved successfully:', data);
      
      return NextResponse.json({
        success: true,
        data,
        message: 'Agent configuration retrieved successfully'
      });
      
    } catch (difyError) {
      console.error('❌ Dify API call failed:', difyError);
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
    console.error('❌ Agent config error:', error);
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

