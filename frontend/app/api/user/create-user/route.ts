import { NextRequest, NextResponse } from 'next/server';
import { signup } from '@/lib/controllers/userController';

export async function POST(request: NextRequest) {
  try {
    return await signup(request);
  } catch (error) {
    console.error('User API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 