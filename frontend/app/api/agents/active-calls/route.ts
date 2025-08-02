import { NextRequest, NextResponse } from 'next/server';
import { getActiveCalls } from '@/lib/controllers/agentController';

export async function GET(request: NextRequest) {
  try {
    return await getActiveCalls(request);
  } catch (error) {
    console.error('Agents API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 