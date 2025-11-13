import { NextRequest, NextResponse } from 'next/server';

async function getAuthToken() {
  const DIFY_BASE_URL = process.env.NEXT_PUBLIC_DIFY_BASE_URL;
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD;
  
  if (!DIFY_BASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('NEXT_PUBLIC_DIFY_BASE_URL, NEXT_PUBLIC_DIFY_ADMIN_EMAIL, or NEXT_PUBLIC_DIFY_ADMIN_PASSWORD is not configured');
  }

  const loginResponse = await fetch(`${DIFY_BASE_URL.replace('/v1', '')}/console/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  if (!loginResponse.ok) {
    throw new Error('Failed to authenticate');
  }

  const loginData = await loginResponse.json();
  return loginData.data?.access_token || loginData.access_token || loginData.data?.token;
}

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables at runtime
    const DIFY_BASE_URL = process.env.NEXT_PUBLIC_DIFY_BASE_URL;
    const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;
    
    if (!DIFY_BASE_URL || !WS_ID) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'NEXT_PUBLIC_DIFY_BASE_URL or NEXT_PUBLIC_DIFY_WORKSPACE_ID is not configured'
        },
        { status: 500 }
      );
    }
    
    // Get authenticaton token
    const token = await getAuthToken();
    
    // Get current agent config using console API
    const configResponse = await fetch(`${DIFY_BASE_URL.replace('/v1', '')}/console/api/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
        'Content-Type': 'application/json',
      },
    });
    if (!configResponse.ok) {
      const errorData = await configResponse.text();
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to get agent config: ${configResponse.status}`,
          details: errorData
        },
        { status: configResponse.status }
      );
    }

    const configData = await configResponse.json();
    return NextResponse.json({
      success: true,
      data: configData,
      message: 'Agent configuration retrieved successfully'
    });
    
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

