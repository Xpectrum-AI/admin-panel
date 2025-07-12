const {initAuth} = require('@propelauth/express');
const { createOrgService, addUserToOrgService, deleteOrgService, inviteUserToOrgService, fetchUsersInOrgService, fetchPendingInvitesService, removeUserFromOrgService, changeUserRoleInOrgService, updateOrgService, fetchOrgDetailsService, fetchOrgByQueryService } = require('../services/orgService');

exports.createOrg = async (req, res) => {
  const { orgName } = req.body;
  try {
    const data = await createOrgService(orgName);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.addUserToOrg = async (req, res) => {
  const { orgId, userId, role } = req.body;
  try {
    const data = await addUserToOrgService(orgId, userId, role);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteOrg = async (req, res) => {
  const { orgId } = req.body;
  try {
    const data = await deleteOrgService(orgId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.inviteUserToOrg = async (req, res) => {
  const { orgId, email, role } = req.body;
  try {
    const data = await inviteUserToOrgService(orgId, email, role);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.fetchUsersInOrg = async (req, res) => {
  const { orgId } = req.body;
  try {
    const data = await fetchUsersInOrgService(orgId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.fetchPendingInvites = async (req, res) => {
  const { orgId } = req.body;
  try {
    const data = await fetchPendingInvitesService(orgId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.removeUserFromOrg = async (req, res) => {
  const { orgId, userId } = req.body;
  try {
    const data = await removeUserFromOrgService(orgId, userId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.changeUserRoleInOrg = async (req, res) => {
  const { orgId, userId, role } = req.body;
  try {
    const data = await changeUserRoleInOrgService(orgId, userId, role);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateOrg = async (req, res) => {
  const { orgId, ...updates } = req.body;

  if (!orgId) {
    return res.status(400).json({ success: false, error: 'Missing orgId' });
  }

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'No updates provided' });
  }

  try {
    const data = await updateOrgService(orgId, updates);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.message.startsWith('Invalid update keys')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.fetchOrgDetails = async (req, res) => {
  const { orgId } = req.body;
  try {
    const data = await fetchOrgDetailsService(orgId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.fetchOrgByQuery = async (req, res) => {
  try {
    const orgs = await fetchOrgByQueryService(req.body);
    return res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
