const express = require('express');
const router = express.Router();
const { createOrg, addUserToOrg, inviteUserToOrg, fetchUsersInOrg, fetchPendingInvites, removeUserFromOrg, changeUserRoleInOrg, updateOrg, fetchOrgDetails, fetchOrgByQuery } = require('../controllers/orgController');
const { initAuth } = require('@propelauth/express');

// Initialize PropelAuth
const auth = initAuth({
  authUrl: process.env.PROPELAUTH_AUTH_URL || 'https://auth.admin-test.xpectrum-ai.com',
  apiKey: process.env.PROPELAUTH_API_KEY || '0fe5896d1060306a9c4ad9df5d6143ac6bcf2fc67cd212b2a45eca5b03e021bfcdee85047883424517c52dca1dcc2952',
});

// Apply authentication middleware to all routes
router.use(auth.requireUser);

router.post('/create-org', createOrg);
router.post('/add-user', addUserToOrg);
router.post('/invite-user', inviteUserToOrg);
router.post('/fetch-users', fetchUsersInOrg);
router.post('/fetch-pending-invites', fetchPendingInvites);
router.post('/remove-user', removeUserFromOrg);
router.post('/change-user-role', changeUserRoleInOrg);
router.post('/update-org', updateOrg);
router.post('/fetch-org-details', fetchOrgDetails);
router.post('/fetch-orgs-query', fetchOrgByQuery);

module.exports = router;
