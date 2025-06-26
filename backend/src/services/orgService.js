
//const PROPELAUTH_API_KEY = process.env.PROPELAUTH_API_KEY;
const PROPELAUTH_API_KEY = 'a6507ff709be44c345d989e6e3222608b9c4ec1117473c6b265f98e29dcc6ce25bdb6fad9523abcbf96a379c5a8cf72d';
const PROPELAUTH_AUTH_URL = 'https://181249979.propelauthtest.com';

async function createOrgService(orgName) {
  if (!orgName) {
    throw new Error('Missing orgName');
  }

  const response = await fetch(`${PROPELAUTH_AUTH_URL}/api/backend/v1/org/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PROPELAUTH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: orgName,
    }),
  });

  if (!response.ok) {
    let error = {};
    try {
      error = await response.json(); // Try parsing error JSON
    } catch (e) {
      error = { message: 'Failed to parse error response' };
    }
    throw new Error(
      `Failed to create org. Status: ${response.status}. Error: ${JSON.stringify(error)}`
    );
  }

  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    throw new Error('Org created, but failed to parse response JSON.');
  }

  return data;

}

module.exports = {
  createOrgService,
}; 