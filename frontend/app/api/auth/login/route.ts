import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    console.log('Login route accessed:', req.url);
    console.log('Environment variables:', {
      auth_url: process.env.NEXT_PUBLIC_AUTH_URL,
      propelauth_url: process.env.NEXT_PUBLIC_PROPELAUTH_URL
    });

    // Build your OAuth URL here using environment variables
    const auth_url = process.env.NEXT_PUBLIC_AUTH_URL;
    
    if (!auth_url) {
      console.error('NEXT_PUBLIC_AUTH_URL is not configured');
      return NextResponse.json(
        { error: 'Authentication URL not configured', debug: { auth_url, propelauth_url: process.env.NEXT_PUBLIC_PROPELAUTH_URL } },
        { status: 500 }
      );
    }

    const oauthUrl = `${auth_url}/google/login?scope=openid+email+profile&external_param_access_type=offline&external_param_prompt=consent`;
    
    console.log('Redirecting to:', oauthUrl);
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error('Error in login GET handler:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Login POST route accessed:', req.url);
    
    // Handle POST requests for login (if needed)
    const auth_url = process.env.NEXT_PUBLIC_AUTH_URL;
    
    if (!auth_url) {
      console.error('NEXT_PUBLIC_AUTH_URL is not configured');
      return NextResponse.json(
        { error: 'Authentication URL not configured' },
        { status: 500 }
      );
    }

    const oauthUrl = `${auth_url}/google/login?scope=openid+email+profile&external_param_access_type=offline&external_param_prompt=consent`;

    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error('Error in login POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 