export async function createOrg(orgName: string) {
  const response = await fetch('http://localhost:8000/api/org/create-org', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgName }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create organization');
  }
  return response.json();
}

export async function addUserToOrg(orgId: string, userId: string, role: string) {
  const response = await fetch('http://localhost:8000/api/org/add-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, userId, role }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to add user to organization');
  }
  return response.json();
}

export async function inviteUserToOrg(orgId: string, email: string, role: string) {
  const response = await fetch('http://localhost:8000/api/org/invite-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, email, role }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to invite user to organization');
  }
  return response.json();
}

export async function fetchUsersInOrg(orgId: string) {
  const response = await fetch('http://localhost:8000/api/org/fetch-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to fetch users in organization');
  }
  return response.json();
}

export async function fetchPendingInvites(orgId: string) {
  const response = await fetch('http://localhost:8000/api/org/fetch-pending-invites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to fetch pending invites');
  }
  return response.json();
}

export async function removeUserFromOrg(orgId: string, userId: string) {
  const response = await fetch('http://localhost:8000/api/org/remove-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, userId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to remove user from organization');
  }
  return response.json();
}

export async function changeUserRoleInOrg(orgId: string, userId: string, role: string) {
  const response = await fetch('http://localhost:8000/api/org/change-user-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, userId, role }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to change user role in organization');
  }
  return response.json();
} 