import { NextRequest, NextResponse } from 'next/server';
import { createProduct, getProducts } from '@/lib/controllers/stripeController';

export async function GET(request: NextRequest) {
  try {
    return await getProducts(request);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await createProduct(request);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 