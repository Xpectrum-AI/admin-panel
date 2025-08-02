import { NextRequest, NextResponse } from 'next/server';
import { getAgentByPhone } from '@/lib/controllers/agentController';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phoneNumber: string }> }
) {
  try {
    const { phoneNumber } = await params;
    return await getAgentByPhone(request, phoneNumber);
  } catch (error) {
    console.error('Agents API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 