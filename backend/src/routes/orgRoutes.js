const express = require('express');
const router = express.Router();
const { createOrg, addUserToOrg } = require('../controllers/orgController');

router.post('/create-org', createOrg);
router.post('/add-user', addUserToOrg);

module.exports = router;
