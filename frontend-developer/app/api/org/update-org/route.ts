import { NextRequest, NextResponse } from 'next/server';
import { updateOrg } from '@/lib/controllers/orgController';

export async function PUT(request: NextRequest) {
  try {
    return await updateOrg(request);
  } catch (error) {
    console.error('Organization API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
