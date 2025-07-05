const express = require('express');
const router = express.Router();
const { createOrg, addUserToOrg, inviteUserToOrg, fetchUsersInOrg, fetchPendingInvites, removeUserFromOrg, changeUserRoleInOrg } = require('../controllers/orgController');

router.post('/create-org', createOrg);
router.post('/add-user', addUserToOrg);
router.post('/invite-user', inviteUserToOrg);
router.post('/fetch-users', fetchUsersInOrg);
router.post('/fetch-pending-invites', fetchPendingInvites);
router.post('/remove-user', removeUserFromOrg);
router.post('/change-user-role', changeUserRoleInOrg);

module.exports = router;
