const express = require('express');
const router = express.Router();
const academicYearController = require('../controllers/academicYearController');
const authController = require('../middlewares/auth');

// Protect all routes
router.use(authController.protect);
router.use(authController.restrictTo('hod', 'coordinator'));

router
  .route('/')
  .get(academicYearController.getAllAcademicYears)
  .post(academicYearController.createAcademicYear);

router
  .route('/:id')
  .get(academicYearController.getAcademicYear)
  .patch(academicYearController.updateAcademicYear)
  .delete(academicYearController.deleteAcademicYear);

module.exports = router;