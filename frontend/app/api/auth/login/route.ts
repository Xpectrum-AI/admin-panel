import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Build your OAuth URL here using environment variables
  const auth_url = process.env.NEXT_PUBLIC_AUTH_URL;

  const oauthUrl = `${auth_url}/google/login?scope=openid+email+profile&external_param_access_type=offline&external_param_prompt=consent`;

  return NextResponse.redirect(oauthUrl);
} 