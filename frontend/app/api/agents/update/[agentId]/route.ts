import { NextRequest, NextResponse } from 'next/server';
import { updateAgent } from '@/lib/controllers/agentController';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    return await updateAgent(request, agentId);
  } catch (error) {
    console.error('Agents API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 