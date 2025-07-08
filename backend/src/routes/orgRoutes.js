const express = require('express');
const router = express.Router();
const { createOrg, addUserToOrg, inviteUserToOrg, fetchUsersInOrg, fetchPendingInvites, removeUserFromOrg, changeUserRoleInOrg, updateOrg, fetchOrgDetails } = require('../controllers/orgController');

router.post('/create-org', createOrg);
router.post('/add-user', addUserToOrg);
router.post('/invite-user', inviteUserToOrg);
router.post('/fetch-users', fetchUsersInOrg);
router.post('/fetch-pending-invites', fetchPendingInvites);
router.post('/remove-user', removeUserFromOrg);
router.post('/change-user-role', changeUserRoleInOrg);
router.post('/update-org', updateOrg);
router.post('/fetch-org-details', fetchOrgDetails);

module.exports = router;
