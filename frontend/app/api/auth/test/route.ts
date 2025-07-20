import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Test route working',
    url: req.url,
    timestamp: new Date().toISOString()
  });
} 