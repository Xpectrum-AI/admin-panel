const express = require('express');
const router = express.Router();
const { getUserByEmail, signup } = require("../controllers/userController")

router.get('/fetch-user-mail', getUserByEmail);
router.post('/create-user', signup);

module.exports = router;