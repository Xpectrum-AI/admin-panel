const express = require('express');
const router = express.Router();
const { getUserByEmail, signup, fetchUsersByQuery } = require("../controllers/userController")

router.get('/fetch-user-mail', getUserByEmail);
router.post('/create-user', signup);
router.post('/fetch-users-query', fetchUsersByQuery);

module.exports = router;