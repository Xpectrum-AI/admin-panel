import type { UpdateOrgInput } from './type';

const API_BASE = '/api'; // Changed from external backend to local Next.js API
const API_KEY = process.env.LIVE_API_KEY || "";

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export async function createOrg(orgName: string) {
  const response = await fetch(`${API_BASE}/org/create-org`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ orgName }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create organization');
  }
  const result = await response.json();
  return result.data;
}

export async function addUserToOrg(orgId: string, userId: string, role: string) {
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
}

export async function inviteUserToOrg(orgId: string, email: string, role: string) {
  const response = await fetch(`${API_BASE}/org/invite-user`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ orgId, email, role }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to invite user to organization');
  }
  const result = await response.json();
  return result.data;
}

export async function fetchUsersInOrg(orgId: string) {
  const response = await fetch(`${API_BASE}/org/fetch-users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ orgId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to fetch users in organization');
  }
  const result = await response.json();
  return result.data;
}

export async function fetchPendingInvites(orgId: string) {
  const response = await fetch(`${API_BASE}/org/fetch-pending-invites`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ orgId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to fetch pending invites');
  }
  const result = await response.json();
  return result.data;
}

export async function removeUserFromOrg(orgId: string, userId: string) {
  const response = await fetch(`${API_BASE}/org/remove-user`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ orgId, userId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to remove user from organization');
  }
  const result = await response.json();
  return result.data;
}

export async function changeUserRoleInOrg(orgId: string, userId: string, role: string) {
  const response = await fetch(`${API_BASE}/org/change-user-role`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ orgId, userId, role }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to change user role in organization');
  }
  const result = await response.json();
  return result.data;
}

const ALLOWED_FIELDS: Array<keyof UpdateOrgInput> = [
  'name',
  'description',
  'displayName',
  'domain',
  'extraDomains',
  'enableAutoJoiningByDomain',
  'membersMustHaveMatchingDomain',
  'maxUsers',
  'canSetupSaml',
  'legacyOrgId',
];

export async function updateOrg(orgId: string, updates: UpdateOrgInput): Promise<any> {
  if (!orgId) {
    throw new Error('Missing orgId');
  }
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('No updates provided');
  }

  // Validate allowed fields
  const invalidKeys = Object.keys(updates).filter(
    (k) => !ALLOWED_FIELDS.includes(k as keyof UpdateOrgInput)
  );
  if (invalidKeys.length > 0) {
    throw new Error(`Invalid update fields: ${invalidKeys.join(', ')}`);
  }

  const body: Record<string, unknown> = { orgId };
  (ALLOWED_FIELDS as (keyof UpdateOrgInput)[]).forEach((field) => {
    const val = updates[field];
    if (val !== undefined) {
      body[field] = val;
    }
  });

  const response = await fetch(`${API_BASE}/org/update-org`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    const msg = errJson.error || 'Failed to update organization';
    throw new Error(msg);
  }

  const result = await response.json();
  return result.data;
}

export async function fetchOrgDetails(orgId: string) {
  const response = await fetch(`${API_BASE}/org/fetch-org-details`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ orgId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to fetch organization details');
  }
  const result = await response.json();
  return result.data;
}

export async function fetchOrgByQuery(query: any) {
  const response = await fetch(`${API_BASE}/org/fetch-orgs-query`, {
    method: 'POST',
    headers,
    body: JSON.stringify(query),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch orgs by query');
  }
  return response.json();
}

// Helper function to get display name from org data (metadata first, then fallback to name)
export function getOrgDisplayName(orgData: any): string {
  if (orgData?.metadata?.displayName) {
    return orgData.metadata.displayName;
  }
  return orgData?.name || 'Unnamed Organization';
}

// Helper function to get description from org data (metadata first, then fallback to description field)
export function getOrgDescription(orgData: any): string {
  if (orgData?.metadata?.description) {
    return orgData.metadata.description;
  }
  return orgData?.description || 'No description available';
} 