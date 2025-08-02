import { NextRequest, NextResponse } from 'next/server';
import { fetchUsersByQuery } from '@/lib/controllers/userController';

export async function POST(request: NextRequest) {
  try {
    return await fetchUsersByQuery(request);
  } catch (error) {
    console.error('User API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 