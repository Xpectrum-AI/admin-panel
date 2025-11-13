import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

// GET /api/phone-numbers/assigned - Get assigned phone numbers
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fetch assigned phone numbers from backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/phone-numbers/status/assigned`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.phone_numbers || [],
      message: `Retrieved ${data.phone_numbers?.length || 0} assigned phone numbers`
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
