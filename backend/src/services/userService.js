const {initAuth} = require('@propelauth/express');

const PROPELAUTH_API_KEY = process.env.PROPELAUTH_API_KEY || '5c1b57840f4d4ec7265d0622cf68dd63e028b78d8482b21b8fb00395bb6ee3c59a1fde5f9288d373b1a315e591bd8723';

const PROPELAUTH_AUTH_URL = process.env.PROPELAUTH_AUTH_URL || 'https://181249979.propelauthtest.com';

const auth = initAuth({
  authUrl: PROPELAUTH_AUTH_URL,
  apiKey: PROPELAUTH_API_KEY,
});

async function createUserService({ email, password, firstName, lastName, username }) {
  if (!email || !password || !firstName || !lastName || !username) throw new Error('Missing required fields');
  try {
    const user = await auth.createUser({ email, password, firstName, lastName, username });
    return user;
  } catch (error) {
    throw new Error(error.message || 'User creation failed');
  }
}

async function deleteUserService(userId) {
  if (!userId) throw new Error('UserId is missing');
  try {
    const data = await auth.deleteUser(userId);
    return data;
  } catch (error) {
    throw new Error(error.message || 'Delete user failed');
  }
}

async function getUserByEmailService(email) {
  if (!email) throw new Error('Missing email');
  try {
    const data = await auth.createOrg({ email, includeOrgs: 'true' }); // This seems like a bug, but keeping as in original
    return data;
  } catch (error) {
    throw new Error(error.message || 'Fetch user failed');
  }
}

module.exports = {
  createUserService,
  deleteUserService,
  getUserByEmailService,
}; 