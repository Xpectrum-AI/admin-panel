import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    SUPER_ADMIN_ORG_ID: process.env.SUPER_ADMIN_ORG_ID,
    NODE_ENV: process.env.NODE_ENV,
    PROPELAUTH_URL: process.env.PROPELAUTH_URL,
  };

  return NextResponse.json({
    success: true,
    data: envVars,
    timestamp: new Date().toISOString(),
  });
}
