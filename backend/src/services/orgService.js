const {initAuth} = require('@propelauth/express');

const PROPELAUTH_API_KEY = process.env.PROPELAUTH_API_KEY || "41f5b65faf738abef77864b5753afd5d7f12231eb4556a14667b6cc3a8e0e103830a9789e8ee5a54773d9f512f11d17a";
const PROPELAUTH_AUTH_URL = process.env.PROPELAUTH_AUTH_URL || 'https://auth.admin-test.xpectrum-ai.com';

// Validate required environment variables
if (!PROPELAUTH_API_KEY) {
  throw new Error('PROPELAUTH_API_KEY environment variable is required');
}

// Lazy initialization - only create auth when needed
let auth = null;

function getAuth() {
  if (!auth) {
    try {
      auth = initAuth({
        authUrl: PROPELAUTH_AUTH_URL,
        apiKey: PROPELAUTH_API_KEY,
      });
    } catch (error) {
      throw new Error('PropelAuth initialization failed');
    }
  }
  return auth;
}

async function createOrgService(orgName) {
  if (!orgName) throw new Error('Missing orgName');
  try {
    const authInstance = getAuth();
    const data = await authInstance.createOrg({ name: orgName });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Org creation failed');
  }
}

async function addUserToOrgService(orgId, userId, role) {
  if (!orgId || !userId || !role) throw new Error('Missing required fields');
  try {
    const authInstance = getAuth();
    const data = await authInstance.addUserToOrg({ userId, orgId, role });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Add user to org failed');
  }
}

async function deleteOrgService(orgId) {
  if (!orgId) throw new Error('OrgId is missing');
  try {
    const authInstance = getAuth();
    const data = await authInstance.deleteOrg({ orgId });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Delete org failed');
  }
}

async function inviteUserToOrgService(orgId, email, role) {
  if (!orgId || !email || !role) throw new Error('Missing required fields');
  try {
    const authInstance = getAuth();
    const data = await authInstance.inviteUserToOrg({ orgId, email, role });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Invite user to org failed');
  }
}

async function fetchUsersInOrgService(orgId) {
  if (!orgId) throw new Error('Missing orgId');
  try {
    const authInstance = getAuth();
    const data = await authInstance.fetchUsersInOrg({ orgId });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Fetch users in org failed');
  }
}

async function fetchPendingInvitesService(orgId) {
  if (!orgId) throw new Error('Missing orgId');
  try {
    const authInstance = getAuth();
    const data = await authInstance.fetchPendingInvites({ orgId });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Fetch pending invites failed');
  }
}

async function removeUserFromOrgService(orgId, userId) {
  if (!orgId || !userId) throw new Error('Missing required fields');
  try {
    const authInstance = getAuth();
    const data = await authInstance.removeUserFromOrg({ orgId, userId });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Remove user from org failed');
  }
}

async function changeUserRoleInOrgService(orgId, userId, role) {
  if (!orgId || !userId || !role) throw new Error('Missing required fields');
  try {
    const authInstance = getAuth();
    const data = await authInstance.changeUserRoleInOrg({ orgId, userId, role });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Change user role in org failed');
  }
}

async function updateOrgService(orgId, updates) {
  if (!orgId) throw new Error('Missing orgId');
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('No updates provided');
  }
  try {
    const authInstance = getAuth();
    const data = await authInstance.updateOrg({ orgId, updates });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Update org failed');
  }
}

async function fetchOrgDetailsService(orgId) {
  if (!orgId) throw new Error('Missing orgId');
  try {
    const authInstance = getAuth();
    const data = await authInstance.fetchOrg({ orgId });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Fetch org details failed');
  }
}

async function fetchOrgByQueryService(query) {
  if (!query) throw new Error('Missing query');
  try {
    const authInstance = getAuth();
    const data = await authInstance.fetchOrgsByQuery(query);
    return data;
  } catch (error) {
    throw new Error(error.message || 'Fetch org by query failed');
  }
}

module.exports = {
  createOrgService,
  addUserToOrgService,
  deleteOrgService,
  inviteUserToOrgService,
  fetchUsersInOrgService,
  fetchPendingInvitesService,
  removeUserFromOrgService,
  changeUserRoleInOrgService,
  updateOrgService,
  fetchOrgDetailsService,
  fetchOrgByQueryService,
}; 