const {initAuth} = require('@propelauth/express');

const PROPELAUTH_API_KEY = process.env.PROPELAUTH_API_KEY || '5c1b57840f4d4ec7265d0622cf68dd63e028b78d8482b21b8fb00395bb6ee3c59a1fde5f9288d373b1a315e591bd8723';
const PROPELAUTH_AUTH_URL = process.env.PROPELAUTH_AUTH_URL || 'https://181249979.propelauthtest.com';

const auth = initAuth({
  authUrl: PROPELAUTH_AUTH_URL,
  apiKey: PROPELAUTH_API_KEY,
});

async function createOrgService(orgName) {
  if (!orgName) throw new Error('Missing orgName');
  try {
    const data = await auth.createOrg({ name: orgName });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Org creation failed');
  }
}

async function addUserToOrgService(orgId, userId, role) {
  if (!orgId || !userId || !role) throw new Error('Missing required fields');
  try {
    const data = await auth.addUserToOrg({ userId, orgId, role });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Add user to org failed');
  }
}

async function deleteOrgService(orgId) {
  if (!orgId) throw new Error('OrgId is missing');
  try {
    const data = await auth.deleteOrg({ orgId });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Delete org failed');
  }
}

async function inviteUserToOrgService(orgId, email, role) {
  if (!orgId || !email || !role) throw new Error('Missing required fields');
  try {
    const data = await auth.inviteUserToOrg({ orgId, email, role });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Invite user to org failed');
  }
}

async function fetchUsersInOrgService(orgId) {
  if (!orgId) throw new Error('Missing orgId');
  try {
    const data = await auth.fetchUsersInOrg({ orgId });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Fetch users in org failed');
  }
}

async function fetchPendingInvitesService(orgId) {
  if (!orgId) throw new Error('Missing orgId');
  try {
    const data = await auth.fetchPendingInvites({ orgId });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Fetch pending invites failed');
  }
}

async function removeUserFromOrgService(orgId, userId) {
  if (!orgId || !userId) throw new Error('Missing required fields');
  try {
    const data = await auth.removeUserFromOrg({ orgId, userId });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Remove user from org failed');
  }
}

async function changeUserRoleInOrgService(orgId, userId, role) {
  if (!orgId || !userId || !role) throw new Error('Missing required fields');
  try {
    const data = await auth.changeUserRoleInOrg({ orgId, userId, role });
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

  // ✅ Define allowed fields
  const ALLOWED_SETTINGS = [
    'domain',
    'extraDomains',
    'enableAutoJoiningByDomain',
    'membersMustHaveMatchingDomain',
    'maxUsers',
    'canSetupSaml',
    'legacyOrgId',
  ];
  const ALLOWED_METADATA = ['displayName', 'description'];

  const payload = { orgId };
  const metadata = {};

  ALLOWED_METADATA.forEach((key) => {
    if (updates[key] !== undefined) {
      metadata[key] = updates[key];
    }
  });
  if (Object.keys(metadata).length > 0) {
    payload.metadata = metadata;
  }

  ALLOWED_SETTINGS.forEach((key) => {
    if (updates[key] !== undefined) {
      payload[key] = updates[key];
    }
  });

  const invalidFields = Object.keys(updates).filter(
    (k) =>
      !ALLOWED_SETTINGS.includes(k) && !ALLOWED_METADATA.includes(k)
  );
  if (invalidFields.length > 0) {
    throw new Error(
      `Invalid update keys: ${invalidFields.join(', ')}`
    );
  }

  try {
    const data = await auth.updateOrg(payload);
    return data;
  } catch (err) {
    throw new Error(err.message || 'Update org failed');
  }
}


async function fetchOrgDetailsService(orgId) {
  if (!orgId) throw new Error('Missing orgId');

  try {
    const org = await auth.fetchOrg(orgId);
    return org;
  } catch (error) {
    throw new Error(error.message || 'Fetch orgs by query failed');
  }
}

async function fetchOrgByQueryService(query) {
  try {
    const orgs = await auth.fetchOrgByQuery(query);
    return orgs;
  } catch (error) {
    throw new Error(error.message || 'Fetch orgs by query failed');
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