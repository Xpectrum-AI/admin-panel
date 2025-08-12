import { NextResponse } from 'next/server';

export async function GET() {
  // Return runtime environment variables
  const runtimeConfig = {
    PROPELAUTH_URL: process.env.PROPELAUTH_URL || '',
    PROPELAUTH_API_KEY: process.env.PROPELAUTH_API_KEY || '',
    LIVE_API_KEY: process.env.LIVE_API_KEY || '',
    SUPER_ADMIN_ORG_ID: process.env.SUPER_ADMIN_ORG_ID || '',
    LIVE_API_URL: process.env.LIVE_API_URL || '',
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || '3000',
  };

  return NextResponse.json(runtimeConfig);
}
