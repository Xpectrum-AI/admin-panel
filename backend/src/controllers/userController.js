const {initAuth} = require('@propelauth/express');

//const PROPELAUTH_API_KEY = process.env.PROPELAUTH_API_KEY;
const PROPELAUTH_API_KEY = 'a6507ff709be44c345d989e6e3222608b9c4ec1117473c6b265f98e29dcc6ce25bdb6fad9523abcbf96a379c5a8cf72d';
const PROPELAUTH_AUTH_URL = 'https://181249979.propelauthtest.com';

const auth = initAuth({
  authUrl: PROPELAUTH_AUTH_URL,
  apiKey: PROPELAUTH_API_KEY,
});

async function fetchUserByEmail(email, include_orgs = true) {
  const res = await fetch(`${PROPELAUTH_AUTH_URL}/api/backend/v1/user/email?email=${email}&include_orgs=true`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PROPELAUTH_API_KEY}`,
    },
  });
  if (!res.ok) {
    const errBody = await res.text();
    const err = new Error(`Auth API error: ${res.status} – ${errBody}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

exports.getUserByEmail = async (req, res, next) => {
  try {
    const { email, includeOrgs } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Missing `email` query parameter' });
    }
    const data = await fetchUserByEmail(email, includeOrgs === 'true');
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.signup = async (req, res, next) => {
  let user = null;
  let org = null;
  try {
    const { email, password, firstName, lastName, username } = req.body;
    if (!email || !password || !firstName || !lastName || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    user = await auth.createUser({
      email,
      password,
      firstName,
      lastName,
      username
    });
    const orgName = username + "workspace";
    try {
      // You need to call the orgController's createOrg logic here, or inline the fetch as in orgController.js
      const response = await fetch(`${PROPELAUTH_AUTH_URL}/api/backend/v1/org/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PROPELAUTH_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: orgName }),
      });
      if (!response.ok) {
        let error = {};
        try {
          error = await response.json();
        } catch (e) {
          error = { message: 'Failed to parse error response' };
        }
        // Rollback: delete user if org creation fails
        let rollbackError = null;
        if (user && user.userId) {
          try {
            await auth.deleteUser(user.userId);
          } catch (delUserErr) {
            rollbackError = delUserErr.message;
          }
        }
        let errorMsg = 'Organization creation failed. User rolled back.';
        if (rollbackError) {
          errorMsg += ` User rollback error: ${rollbackError}`;
        }
        return res.status(response.status).json({ success: false, error: errorMsg });
      }
      org = await response.json();
    } catch (orgErr) {
      // Already handled above
    }
    const role = "Owner";
    try {
      const addUserResponse = await fetch(`${PROPELAUTH_AUTH_URL}/api/backend/v1/org/add_user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PROPELAUTH_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.userId, org_id: org.org_id, role }),
      });
      if (!addUserResponse.ok) {
        let orgDeleteError = null;
        let userDeleteError = null;
        if (org && org.org_id) {
          try {
            await fetch(`${PROPELAUTH_AUTH_URL}/api/backend/v1/org/${org.org_id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${PROPELAUTH_API_KEY}`,
                'Content-Type': 'application/json',
              },
            });
          } catch (delOrgErr) {
            orgDeleteError = delOrgErr.message;
          }
        }
        if (user && user.userId) {
          try {
            await auth.deleteUser(user.userId);
          } catch (delUserErr) {
            userDeleteError = delUserErr.message;
          }
        }
        let errorMsg = 'Failed to add user to org. User and org rolled back.';
        if (orgDeleteError || userDeleteError) {
          errorMsg += ` Rollback errors: org: ${orgDeleteError || 'none'}, user: ${userDeleteError || 'none'}`;
        }
        return res.status(addUserResponse.status).json({ success: false, error: errorMsg });
      }
      const data = await addUserResponse.json();
      return res.json({ success: true, data });
    } catch (addUserErr) {
      // Already handled above
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to create user' });
  }
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'UserId is missing' });
  }
  try {
    const data = await auth.deleteUser(userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to delete user' });
  }
};
