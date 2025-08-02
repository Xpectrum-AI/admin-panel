import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/lib/controllers/stripeController';

export async function POST(request: NextRequest) {
  try {
    return await createSubscription(request);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 