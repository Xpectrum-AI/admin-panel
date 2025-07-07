const {initAuth} = require('@propelauth/express');

const PROPELAUTH_API_KEY = process.env.PROPELAUTH_API_KEY || 'a6507ff709be44c345d989e6e3222608b9c4ec1117473c6b265f98e29dcc6ce25bdb6fad9523abcbf96a379c5a8cf72d';
const PROPELAUTH_AUTH_URL = process.env.PROPELAUTH_AUTH_URL || 'https://auth.admin-test.xpectrum-ai.com';

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

module.exports = {
  createOrgService,
  addUserToOrgService,
  deleteOrgService,
  inviteUserToOrgService,
  fetchUsersInOrgService,
  fetchPendingInvitesService,
  removeUserFromOrgService,
  changeUserRoleInOrgService,
}; 