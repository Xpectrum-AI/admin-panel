import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NEXT_PUBLIC_SUPER_ADMIN_ORG_ID: process.env.NEXT_PUBLIC_SUPER_ADMIN_ORG_ID,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_PROPELAUTH_URL: process.env.NEXT_PUBLIC_PROPELAUTH_URL,
  };

  return NextResponse.json({
    success: true,
    data: envVars,
    timestamp: new Date().toISOString(),
  });
}
