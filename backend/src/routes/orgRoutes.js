// routes/orgRoutes.js
const express = require('express');
const router = express.Router();
const { createOrg } = require('../controllers/orgController');

router.post('/create-org', createOrg);

module.exports = router;
