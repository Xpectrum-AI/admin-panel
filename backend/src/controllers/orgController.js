const { createOrgService } = require('../services/orgService');

exports.createOrg = async (req, res) => {
  const { orgName } = req.body;

  if (!orgName) {
    return res.status(400).json({ error: 'Missing orgName' });
  }

  try {
    const data = await createOrgService(orgName);
    res.status(200).json({ org: data });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.data });
    }
    console.error('Org creation failed:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
