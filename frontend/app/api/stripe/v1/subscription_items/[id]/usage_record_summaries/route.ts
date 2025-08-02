import { NextRequest, NextResponse } from 'next/server';
import { getUsageSummary } from '@/lib/controllers/stripeController';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await getUsageSummary(request, id);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 