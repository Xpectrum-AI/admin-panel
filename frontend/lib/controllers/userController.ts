import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { initAuth } from '@propelauth/express';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

const API_KEY= process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY || "";
const AUTH_URL= process.env.NEXT_PUBLIC_PROPELAUTH_URL || "";

// Only initialize auth if we have the required environment variables
let auth: any = null;
if (API_KEY && AUTH_URL) {
  try {
    auth = initAuth({
      authUrl: AUTH_URL,
      apiKey: API_KEY,
    });
  } catch (error) {
    console.error('Failed to initialize PropelAuth:', error);
  }
}

// Helper function to check if auth is available
function isAuthAvailable() {
  return auth !== null;
}

// GET /api/user/fetch-user-mail
export async function getUserByEmail(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return handleApiError(new Error('Unauthorized'), 'Get User by Email API');
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return handleApiError(new Error('Missing email parameter'), 'Get User by Email API');
    }

    const data = await auth.fetchUserMetadataByEmail(email, true);

    return createSuccessResponse(data, 'User retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'Get User by Email API');
  }
}

// POST /api/user/create-user
export async function signup(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return handleApiError(new Error('Unauthorized'), 'User Signup API');
    }

    const body = await request.json();
    const { email, password, firstName, lastName, username } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !username) {
      return handleApiError(new Error('Missing required fields'), 'User Signup API');
    }

    const data = await auth.createUser({ email, password, firstName, lastName, username });

    return createSuccessResponse(data, 'User created successfully', 201);
  } catch (error) {
    return handleApiError(error, 'User Signup API');
  }
}

// POST /api/user/fetch-user
export async function fetchUser(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return handleApiError(new Error('Unauthorized'), 'Fetch User API');
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return handleApiError(new Error('Missing userId'), 'Fetch User API');
    }

    const data = await auth.fetchUser(userId);

    return createSuccessResponse(data, 'User fetched successfully');
  } catch (error) {
    return handleApiError(error, 'Fetch User API');
  }
}

// POST /api/user/fetch-users-query
export async function fetchUsersByQuery(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return handleApiError(new Error('Unauthorized'), 'Fetch Users Query API');
    }

    const body = await request.json();
    const query = body;

    if (!query) {
      return handleApiError(new Error('Missing query'), 'Fetch Users Query API');
    }

    const data = await auth.fetchUsersByQuery(query);

    // Handle the nested response structure from PropelAuth
    const users = data.users || data;
    const totalUsers = data.totalUsers;
    const currentPage = data.currentPage || 0;
    const pageSize = data.pageSize || 10;
    const hasMoreResults = data.hasMoreResults || false;

    return createSuccessResponse({
      users: users,
      totalUsers: totalUsers,
      currentPage: currentPage,
      pageSize: pageSize,
      hasMoreResults: hasMoreResults
    }, 'Users fetched successfully');
  } catch (error) {
    return handleApiError(error, 'Fetch Users Query API');
  }
}

// POST /api/user/update-user
export async function updateUser(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return handleApiError(new Error('Unauthorized'), 'Update User API');
    }

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return handleApiError(new Error('Missing userId'), 'Update User API');
    }

    if (!updates || Object.keys(updates).length === 0) {
      return handleApiError(new Error('No updates provided'), 'Update User API');
    }

    const data = await auth.updateUser({ userId, updates });

    return createSuccessResponse(data, 'User updated successfully');
  } catch (error) {
    return handleApiError(error, 'Update User API');
  }
}

// POST /api/user/delete-user
export async function deleteUser(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return handleApiError(new Error('Unauthorized'), 'Delete User API');
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return handleApiError(new Error('Missing userId'), 'Delete User API');
    }

    const data = await auth.deleteUser(userId);

    return createSuccessResponse(data, 'User deleted successfully');
  } catch (error) {
    return handleApiError(error, 'Delete User API');
  }
} 