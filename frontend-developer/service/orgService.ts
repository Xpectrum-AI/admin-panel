// Organization service for frontend-developer
// This mirrors the organization service from the main frontend

const API_BASE = '/api'; 
const API_KEY = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export interface Organization {
  orgId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrgRequest {
  name: string;
  description?: string;
}

export interface UpdateOrgRequest {
  name?: string;
  description?: string;
}

export interface AddUserToOrgRequest {
  userId: string;
  role: string;
}

// Create a new organization
export const createOrg = async (name: string, description?: string): Promise<Organization> => {
  try {
    const response = await fetch(`${API_BASE}/org/create-org`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ orgName: name }),
    });

    if (!response.ok) {
      const err = await response.json();
      // Handle PropelAuth validation errors
      if (err.error && err.error.includes('Name can only contain')) {
        throw new Error('Organization name can only contain letters, numbers, underscores, and spaces');
      }
      throw new Error(err.error || 'Failed to create organization');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

// Update an organization
export const updateOrg = async (orgId: string, updates: UpdateOrgRequest): Promise<Organization> => {
  try {
    const response = await fetch(`${API_BASE}/org/update-org`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ orgId, ...updates }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update organization');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

// Add user to organization
export const addUserToOrg = async (orgId: string, userId: string, role: string = 'Member'): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/org/add-user`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ orgId, userId, role }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to add user to organization');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

// Note: Organization switching functionality removed - each user has only one organization

// Get organization details
export const getOrg = async (orgId: string): Promise<Organization> => {
  try {
    const response = await fetch(`${API_BASE}/org/fetch-org-details`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ orgId }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch organization');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

// Get all organizations for a user
export const getUserOrgs = async (): Promise<Organization[]> => {
  try {
    const response = await fetch(`${API_BASE}/org/fetch-orgs-query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch user organizations');
    }

    const result = await response.json();
    return result.data || result.orgs || [];
  } catch (error) {
    throw error;
  }
};
