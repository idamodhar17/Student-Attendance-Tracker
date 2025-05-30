const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authController = require('../middlewares/auth');

// Protect all routes after this middleware
router.use(authController.protect);

// Only HOD can modify teachers
router.use(authController.restrictTo('hod'));

router
  .route('/')
  .get(teacherController.getAllTeachers)
  .post(teacherController.createTeacher);

router
  .route('/:id')
  .get(teacherController.getTeacher)
  .patch(teacherController.updateTeacher)
  .delete(teacherController.deleteTeacher);

// Assign subjects to teacher (HOD only)
router.post('/:teacherId/assign-subjects', teacherController.assignSubjectsToTeacher);

// Get teacher's subjects (accessible to teachers and HOD)
router.get('/:teacherId/subjects', authController.restrictTo('hod', 'teacher'), teacherController.getTeacherSubjects);

module.exports = router;