const { createUserService, deleteUserService, getUserByEmailService } = require('../services/userService');
const { createOrgService, addUserToOrgService, deleteOrgService } = require('../services/orgService');

exports.getUserByEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const data = await getUserByEmailService(email);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.signup = async (req, res) => {
  let user = null;
  let org = null;
  try {
    const { email, password, firstName, lastName, username } = req.body;
    user = await createUserService({ email, password, firstName, lastName, username });
    const orgName = username + " workspace";
    try {
      org = await createOrgService(orgName);
    } catch (orgErr) {
      // Rollback: delete user if org creation fails
      if (user && user.userId) {
        try { await deleteUserService(user.userId); } catch (delUserErr) {}
      }
      return res.status(500).json({ success: false, error: `Organization creation failed. User rolled back. ${orgErr.message}` });
    }
    const role = "Owner";
    try {
      await addUserToOrgService(org.orgId || org.org_id, user.userId, role);
    } catch (addUserErr) {
      // Rollback: delete org and user if add user to org fails
      if (org && (org.orgId || org.org_id)) {
        try { await deleteOrgService(org.orgId || org.org_id); } catch (delOrgErr) {}
      }
      if (user && user.userId) {
        try { await deleteUserService(user.userId); } catch (delUserErr) {}
      }
      return res.status(500).json({ success: false, error: `Failed to add user to org. User and org rolled back. ${addUserErr.message}` });
    }
    return res.json({ success: true, data: { user, org } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to create user' });
  }
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.body;
  try {
    const data = await deleteUserService(userId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to delete user' });
  }
};
