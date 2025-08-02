import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/lib/controllers/stripeController';

export async function GET(request: NextRequest) {
  try {
    return await getEvents(request);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 