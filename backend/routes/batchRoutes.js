const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const authController = require('../middlewares/auth');

// Protect all routes
router.use(authController.protect);
router.use(authController.restrictTo('hod', 'coordinator'));

router
  .route('/')
  .get(batchController.getAllBatches)
  .post(batchController.createBatch);

router
  .route('/:id')
  .get(batchController.getBatch)
  .patch(batchController.updateBatch)
  .delete(batchController.deleteBatch);

// Get batches by division
router.get('/by-division/:divisionId', batchController.getBatchesByDivision);

// Get students in batch
router.get('/:batchId/students', batchController.getBatchStudents);

module.exports = router;