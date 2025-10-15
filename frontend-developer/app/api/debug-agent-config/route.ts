import { NextRequest, NextResponse } from 'next/server';

const DIFY_BASE_URL = process.env.NEXT_PUBLIC_DIFY_BASE_URL || '';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || "ghosh.ishw@gmail.com";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || "Ghosh1@*123";
const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || "661d95ae-77ee-4cfd-88e3-e6f3ef8d638b";

async function getAuthToken() {
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
    console.log('🔍 Debug: Getting agent configuration from Dify');
    
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

    console.log('🔍 Config response status:', configResponse.status);

    if (!configResponse.ok) {
      const errorData = await configResponse.text();
      console.error('❌ Failed to get agent config:', errorData);
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
    console.log('✅ Agent config from Dify:', configData);
    
    return NextResponse.json({
      success: true,
      data: configData,
      message: 'Agent configuration retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Debug agent config error:', error);
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

