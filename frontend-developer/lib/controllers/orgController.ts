import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { getAuth } from '@/lib/config/propelAuth';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

// Helper function to check if auth is available
function isAuthAvailable() {
  try {
    const auth = getAuth();
    return auth !== null;
  } catch (error) {
    return false;
  }
}

// POST /api/org/create-org
export async function createOrg(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return handleApiError(new Error('Unauthorized'), 'Organization Create API');
    }

    const body = await request.json();
    const { orgName } = body;

    if (!orgName) {
      return handleApiError(new Error('Missing orgName'), 'Organization Create API');
    }

    const auth = getAuth();
    const data = await auth.createOrg({ name: orgName });

    return createSuccessResponse(data, 'Organization created successfully', 201);
  } catch (error: any) {
    // Handle PropelAuth specific validation errors
    if (error.message && error.message.includes('Name can only contain')) {
      return handleApiError(new Error('Organization name can only contain letters, numbers, underscores, and spaces'), 'Organization Create API');
    }
    return handleApiError(error, 'Organization Create API');
  }
}

// POST /api/org/add-user
export async function addUserToOrg(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return handleApiError(new Error('Unauthorized'), 'Add User to Organization API');
    }

    const body = await request.json();
    const { orgId, userId, role } = body;

    if (!orgId || !userId || !role) {
      return handleApiError(new Error('Missing required fields: orgId, userId, role'), 'Add User to Organization API');
    }

    const auth = getAuth();
    const data = await auth.addUserToOrg({ userId, orgId, role });

    return createSuccessResponse(data, 'User added to organization successfully');
  } catch (error) {
    return handleApiError(error, 'Add User to Organization API');
  }
}

// POST /api/org/invite-user
export async function inviteUserToOrg(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return handleApiError(new Error('Unauthorized'), 'Invite User to Organization API');
    }

    const body = await request.json();
    const { orgId, email, role } = body;

    if (!orgId || !email || !role) {
      return handleApiError(new Error('Missing required fields: orgId, email, role'), 'Invite User to Organization API');
    }

    const auth = getAuth();
    const data = await auth.inviteUserToOrg({ orgId, email, role });

    return createSuccessResponse(data, `User ${email} invited to organization`);
  } catch (error) {
    return handleApiError(error, 'Invite User to Organization API');
  }
}

// POST /api/org/fetch-users
export async function fetchUsersInOrg(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    const auth = getAuth();
    const data = await auth.fetchUsersInOrg( {orgId} );
    return NextResponse.json({
      success: true,
      data: data,
      total: data.length
    });
  } catch (error) {
    console.error('fetchUsersInOrg error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/org/fetch-pending-invites
export async function fetchPendingInvites(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    const auth = getAuth();
    const data = await auth.fetchPendingInvites( orgId );
    return NextResponse.json({
      success: true,
      data: data,
      total: data.length
    });
  } catch (error) {
    console.error('fetchPendingInvites error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/org/remove-user
export async function removeUserFromOrg(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId, userId } = body;

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Missing required fields: orgId, userId' }, { status: 400 });
    }

    const auth = getAuth();
    const data = await auth.removeUserFromOrg({ orgId, userId });

    return NextResponse.json({
      success: true,
      message: 'User removed from organization successfully',
      data: data
    });
  } catch (error) {
    console.error('removeUserFromOrg error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/org/change-user-role
export async function changeUserRoleInOrg(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId, userId, role } = body;

    if (!orgId || !userId || !role) {
      return NextResponse.json({ error: 'Missing required fields: orgId, userId, role' }, { status: 400 });
    }

    const auth = getAuth();
    const data = await auth.changeUserRoleInOrg({ orgId, userId, role });

    return NextResponse.json({
      success: true,
      message: 'User role changed successfully',
      data: data
    });
  } catch (error) {
    console.error('changeUserRoleInOrg error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/org/update-org
export async function updateOrg(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId, updates } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const auth = getAuth();
    const data = await auth.updateOrg({ orgId, updates });

    return NextResponse.json({
      success: true,
      message: 'Organization updated successfully',
      data: data
    });
  } catch (error) {
    console.error('updateOrg error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/org/fetch-org-details
export async function fetchOrgDetails(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    const auth = getAuth();
    const data = await auth.fetchOrg(orgId);

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('fetchOrgDetails error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/org/fetch-orgs-query
export async function fetchOrgByQuery(request: NextRequest) {
  try {
    if (!isAuthAvailable()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const query = body;

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const auth = getAuth();
    const data = await auth.fetchOrgByQuery(query);

    // Handle the nested response structure from PropelAuth
    const orgs = data.orgs || data;
    const totalOrgs = data.totalOrgs;
    const currentPage = data.currentPage || 0;
    const pageSize = data.pageSize || 10;
    const hasMoreResults = data.hasMoreResults || false;

    return NextResponse.json({
      success: true,
      data: {
        orgs: orgs,
        totalOrgs: totalOrgs,
        currentPage: currentPage,
        pageSize: pageSize,
        hasMoreResults: hasMoreResults
      }
    });
  } catch (error) {
    console.error('fetchOrgByQuery error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
