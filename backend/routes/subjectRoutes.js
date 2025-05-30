const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const authController = require('../middlewares/auth');

// Protect all routes after this middleware
router.use(authController.protect);

// Restrict to HOD and Coordinator for modification routes
router.use(authController.restrictTo('hod', 'coordinator'));

router
  .route('/')
  .get(subjectController.getAllSubjects)
  .post(subjectController.createSubject);

router
  .route('/:id')
  .get(subjectController.getSubject)
  .patch(subjectController.updateSubject)
  .delete(subjectController.deleteSubject);

// Get subjects by class (accessible to teachers)
router.get('/class/:classId', authController.restrictTo('hod', 'coordinator', 'teacher'), subjectController.getSubjectsByClass);

module.exports = router;