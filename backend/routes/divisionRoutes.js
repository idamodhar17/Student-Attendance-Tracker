const express = require('express');
const router = express.Router();
const divisionController = require('../controllers/divisionController');
const authController = require('../middlewares/auth');

// Protect all routes
router.use(authController.protect);
router.use(authController.restrictTo('hod', 'coordinator'));

router
  .route('/')
  .get(divisionController.getAllDivisions)
  .post(divisionController.createDivision);

router
  .route('/:id')
  .get(divisionController.getDivision)
  .patch(divisionController.updateDivision)
  .delete(divisionController.deleteDivision);

// Get divisions by academic year
router.get('/by-year/:yearId', divisionController.getDivisionsByYear);

module.exports = router;