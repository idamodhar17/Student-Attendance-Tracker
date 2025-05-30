const express = require('express');
const router = express.Router();
const defaulterLetterController = require('../controllers/defaulterLetterController');
const authController = require('../middlewares/auth');

// Protect all routes after this middleware
router.use(authController.protect);

router
  .route('/')
  .post(authController.restrictTo('teacher', 'hod', 'coordinator'), defaulterLetterController.generateDefaulterLetters)
  .get(defaulterLetterController.getDefaulterLetters);

module.exports = router;