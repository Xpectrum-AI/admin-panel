import { NextRequest, NextResponse } from 'next/server';
import { fetchOrgByQuery } from '@/lib/controllers/orgController';

export async function POST(request: NextRequest) {
  try {
    return await fetchOrgByQuery(request);
  } catch (error) {
    console.error('Organization API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 