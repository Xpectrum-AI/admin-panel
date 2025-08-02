import { NextRequest, NextResponse } from 'next/server';
import { getCustomerBalanceTransactions, createBalanceTransaction } from '@/lib/controllers/stripeController';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await getCustomerBalanceTransactions(request, id);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await createBalanceTransaction(request, id);
  } catch (error) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 