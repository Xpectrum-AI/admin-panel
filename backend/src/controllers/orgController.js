const {initAuth} = require('@propelauth/express');

//const PROPELAUTH_API_KEY = process.env.PROPELAUTH_API_KEY;
const PROPELAUTH_API_KEY = 'a6507ff709be44c345d989e6e3222608b9c4ec1117473c6b265f98e29dcc6ce25bdb6fad9523abcbf96a379c5a8cf72d';
const PROPELAUTH_AUTH_URL = 'https://181249979.propelauthtest.com';

const auth = initAuth({
  authUrl: PROPELAUTH_AUTH_URL,
  apiKey: PROPELAUTH_API_KEY,
});

let errorMsg = 'Internal Server Error';

exports.createOrg = async (req, res) => {
  const { orgName } = req.body;

  if (!orgName) {
    return res.status(400).json({ success: false, error: 'Missing orgName' });
  }

  try {
    const data = await auth.createOrg({ name: orgName });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    
    if (error && error.message) {
      errorMsg = error.message;
    }
    console.error('Org creation failed:', error);
    return res.status(500).json({ success: false, error: errorMsg });
  }
};

exports.addUserToOrg = async (req, res) => {
  const { orgId, userId, role } = req.body;

  if (!orgId || !userId || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const data = await auth.addUserToOrg({ userId : userId, orgId : orgId, role : role });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    
    if (error && error.message) {
      errorMsg = error.message;
    }
    console.error('User addition to Org failed:', error);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

exports.deleteOrg = async (req, res) => {
  const { orgId } = req.body;
  if (!orgId) {
    return res.status(400).json({ success: false, error: 'OrgId is missing' });
  }
  
  try {
    const data = await auth.deleteOrg({orgId});
    return res.status(200).json({ success: true, data });
  } catch (error) {
    
    if (error && error.message) {
      errorMsg = error.message;
    }
    console.error('User addition to Org failed:', error);
    return res.status(500).json({ success: false, error: errorMsg });
  }

};
