import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { initAuth } from '@propelauth/express';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

const API_KEY= process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY || "";
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

// POST /api/user/fetch-users-query
export async function fetchUsersByQuery(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return handleApiError(new Error('Unauthorized'), 'Fetch Users by Query API');
    }

    const body = await request.json();
    const query = body;

    if (!query) {
      return handleApiError(new Error('Missing query'), 'Fetch Users by Query API');
    }

    const data = await auth.fetchUsersByQuery(query);

    // Handle the nested response structure from PropelAuth
    const users = data.users || data;
    const totalUsers = data.totalUsers;
    const currentPage = data.currentPage || 0;
    const pageSize = data.pageSize || 10;
    const hasMoreResults = data.hasMoreResults || false;

    const responseData = {
      users,
      totalUsers,
      currentPage,
      pageSize,
      hasMoreResults
    };

    return createSuccessResponse(responseData, 'Users retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'Fetch Users by Query API');
  }
} 