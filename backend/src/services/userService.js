const {initAuth} = require('@propelauth/express');

const PROPELAUTH_API_KEY = process.env.PROPELAUTH_API_KEY || '41f5b65faf738abef77864b5753afd5d7f12231eb4556a14667b6cc3a8e0e103830a9789e8ee5a54773d9f512f11d17a';
const PROPELAUTH_AUTH_URL = process.env.PROPELAUTH_AUTH_URL || 'https://auth.admin-test.xpectrum-ai.com';

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

async function createUserService({ email, password, firstName, lastName, username }) {
  if (!email || !password || !firstName || !lastName || !username) throw new Error('Missing required fields');
  try {
    const authInstance = getAuth();
    const user = await authInstance.createUser({ email, password, firstName, lastName, username });
    return user;
  } catch (error) {
    throw new Error(error.message || 'User creation failed');
  }
}

async function deleteUserService(userId) {
  if (!userId) throw new Error('UserId is missing');
  try {
    const authInstance = getAuth();
    const data = await authInstance.deleteUser(userId);
    return data;
  } catch (error) {
    throw new Error(error.message || 'Delete user failed');
  }
}

async function getUserByEmailService(email) {
  if (!email) throw new Error('Missing email');
  try {
    const authInstance = getAuth();
    const data = await authInstance.fetchUserByEmail(email, { includeOrgs: true });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Fetch user failed');
  }
}

async function fetchUsersByQueryService(query) {
  try {
    const authInstance = getAuth();
    const users = await authInstance.fetchUsersByQuery(query);
    return users;
  } catch (error) {
    throw new Error(error.message || 'Fetch users by query failed');
  }
}

module.exports = {
  createUserService,
  deleteUserService,
  getUserByEmailService,
  fetchUsersByQueryService,
}; 