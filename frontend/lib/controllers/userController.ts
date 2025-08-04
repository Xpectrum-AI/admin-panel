import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { initAuth } from '@propelauth/express';

const API_KEY= process.env.PROPELAUTH_API_KEY || "";
const AUTH_URL= process.env.NEXT_PUBLIC_PROPELAUTH_URL || "";

const auth = initAuth({
  authUrl: AUTH_URL,
  apiKey: API_KEY,
});

// GET /api/user/fetch-user-mail
export async function getUserByEmail(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
    }

    const data = await auth.fetchUserMetadataByEmail(email, true);

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('getUserByEmail error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/user/create-user
export async function signup(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, firstName, lastName, username } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !username) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const data = await auth.createUser({ email, password, firstName, lastName, username });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: data
    });
  } catch (error) {
    console.error('signup error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/user/fetch-users-query
export async function fetchUsersByQuery(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const query = body;

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const data = await auth.fetchUsersByQuery(query);

    // Handle the nested response structure from PropelAuth
    const users = data.users || data;
    const totalUsers = data.totalUsers;
    const currentPage = data.currentPage || 0;
    const pageSize = data.pageSize || 10;
    const hasMoreResults = data.hasMoreResults || false;

    return NextResponse.json({
      success: true,
      data: {
        users: users,
        totalUsers: totalUsers,
        currentPage: currentPage,
        pageSize: pageSize,
        hasMoreResults: hasMoreResults
      }
    });
  } catch (error) {
    console.error('fetchUsersByQuery error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 