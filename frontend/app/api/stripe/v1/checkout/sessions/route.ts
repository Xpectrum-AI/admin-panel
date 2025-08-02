import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, getCustomerCheckoutSessions } from '@/lib/controllers/stripeController';

export async function GET(request: NextRequest) {
  try {
    return await getCustomerCheckoutSessions(request);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await createCheckoutSession(request);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 