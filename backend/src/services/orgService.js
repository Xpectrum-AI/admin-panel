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

module.exports = {
  createOrgService,
  addUserToOrgService,
  deleteOrgService,
}; 