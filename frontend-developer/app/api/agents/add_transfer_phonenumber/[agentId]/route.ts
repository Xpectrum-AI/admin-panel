import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

// POST /api/agents/add_transfer_phonenumber/[agentId] - Add transfer phone number for agent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId } = await params;
    const body = await request.json();
    const { transfer_phonenumber } = body;

    if (!transfer_phonenumber) {
      return NextResponse.json({ error: 'transfer_phonenumber is required' }, { status: 400 });
    }

    // Call the real backend service
    const backendUrl = process.env.NEXT_PUBLIC_LIVE_API_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_LIVE_API_URL is not configured' }, { status: 500 });
    }
    const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || 'xpectrum-ai@123';

    const response = await fetch(`${backendUrl}/agents/add_transfer_phonenumber/${agentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        transfer_phonenumber: transfer_phonenumber
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend service error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result.data || result,
      message: 'Transfer phone number added successfully'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

