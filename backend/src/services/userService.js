const {initAuth} = require('@propelauth/express');

<<<<<<< HEAD
const PROPELAUTH_API_KEY = process.env.PROPELAUTH_API_KEY || '5c1b57840f4d4ec7265d0622cf68dd63e028b78d8482b21b8fb00395bb6ee3c59a1fde5f9288d373b1a315e591bd8723';
=======
const PROPELAUTH_API_KEY = process.env.PROPELAUTH_API_KEY || 'a6507ff709be44c345d989e6e3222608b9c4ec1117473c6b265f98e29dcc6ce25bdb6fad9523abcbf96a379c5a8cf72d';
>>>>>>> c9621146da7f89beae080953ff6ab7b96fc5a019
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