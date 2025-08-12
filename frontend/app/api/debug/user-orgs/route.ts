import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const SUPER_ADMIN_ORG_ID = process.env.SUPER_ADMIN_ORG_ID;
    
    return NextResponse.json({
      success: true,
      data: {
        superAdminOrgId: SUPER_ADMIN_ORG_ID,
        environment: process.env.NODE_ENV,
        propelauthUrl: process.env.PROPELAUTH_URL,
        message: 'This endpoint shows environment variables. Check browser console for client-side debug info.',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug env error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch debug info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
