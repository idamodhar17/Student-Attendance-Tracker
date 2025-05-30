const express = require('express');
const router = express.Router();
const authController = require('../middlewares/auth');

router.post('/login', authController.login);

module.exports = router;