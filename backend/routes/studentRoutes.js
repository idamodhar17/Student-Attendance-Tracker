const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authController = require('../middlewares/auth');

// Protect all routes after this middleware
router.use(authController.protect);

// Restrict to HOD and Coordinator for modification routes
router.use(authController.restrictTo('hod', 'coordinator'));

router
  .route('/')
  .get(studentController.getAllStudents)
  .post(studentController.createStudent);

router
  .route('/:id')
  .get(studentController.getStudent)
  .patch(studentController.updateStudent)
  .delete(studentController.deleteStudent);

// Get student attendance (accessible to teachers)
router.get('/:studentId/attendance', authController.restrictTo('hod', 'coordinator', 'teacher'), studentController.getStudentAttendance);

// Assign batch to students (HOD and Coordinator)
router.post('/assign-batch', studentController.assignBatchToStudents);

module.exports = router;