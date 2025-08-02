import { NextRequest, NextResponse } from 'next/server';
import { getTrunks } from '@/lib/controllers/agentController';

export async function GET(request: NextRequest) {
  try {
    return await getTrunks(request);
  } catch (error) {
    console.error('Agents API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 