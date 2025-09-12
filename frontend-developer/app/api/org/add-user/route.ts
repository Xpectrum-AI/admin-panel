import { NextRequest, NextResponse } from 'next/server';
import { addUserToOrg } from '@/lib/controllers/orgController';

export async function POST(request: NextRequest) {
  try {
    return await addUserToOrg(request);
  } catch (error) {
    console.error('Organization API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
