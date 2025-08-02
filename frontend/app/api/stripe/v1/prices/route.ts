import { NextRequest, NextResponse } from 'next/server';
import { createPrice, getProductPrices } from '@/lib/controllers/stripeController';

export async function GET(request: NextRequest) {
  try {
    return await getProductPrices(request);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await createPrice(request);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 