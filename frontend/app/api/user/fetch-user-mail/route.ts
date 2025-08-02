import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/controllers/userController';

export async function GET(request: NextRequest) {
  try {
    return await getUserByEmail(request);
  } catch (error) {
    console.error('User API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 