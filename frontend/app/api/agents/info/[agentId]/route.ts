import { NextRequest, NextResponse } from 'next/server';
import { getAgentInfo } from '@/lib/controllers/agentController';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    return await getAgentInfo(request, agentId);
  } catch (error) {
    console.error('Agents API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 