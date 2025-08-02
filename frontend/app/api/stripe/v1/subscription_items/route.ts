import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionItem } from '@/lib/controllers/stripeController';

export async function POST(request: NextRequest) {
  try {
    return await createSubscriptionItem(request);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 