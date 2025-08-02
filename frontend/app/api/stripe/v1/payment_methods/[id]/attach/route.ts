import { NextRequest, NextResponse } from 'next/server';
import { attachPaymentMethod } from '@/lib/controllers/stripeController';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    url.searchParams.set('id', id);
    const newRequest = new NextRequest(url, request);
    return await attachPaymentMethod(newRequest, id);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 