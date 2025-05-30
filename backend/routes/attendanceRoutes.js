const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authController = require('../middlewares/auth');

// Protect all routes after this middleware
router.use(authController.protect);

// Teachers can only access these routes
router.use(authController.restrictTo('teacher', 'hod', 'coordinator'));

router
  .route('/')
  .get(attendanceController.getAttendance)
  .post(attendanceController.createAttendance);

router
  .route('/:id')
  .patch(attendanceController.updateAttendance);

module.exports = router;