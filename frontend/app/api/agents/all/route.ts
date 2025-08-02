import { NextRequest, NextResponse } from 'next/server';
import { getAllAgents } from '@/lib/controllers/agentController';

export async function GET(request: NextRequest) {
  try {
    return await getAllAgents(request);
  } catch (error) {
    console.error('Agents API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 