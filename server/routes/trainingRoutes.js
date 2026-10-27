const express = require('express');
const router = express.Router();
const {
  getTrainingPrograms,
  createTrainingProgram,
  updateTrainingProgram,
  enrollEmployee,
  updateParticipantProgress,
  deleteTrainingProgram,
} = require('../controllers/trainingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getTrainingPrograms)
  .post(authorize('hr', 'manager'), createTrainingProgram);

router
  .route('/:id')
  .put(authorize('hr', 'manager'), updateTrainingProgram)
  .delete(authorize('hr', 'manager'), deleteTrainingProgram);

router.post('/:id/enroll', enrollEmployee);
router.put(
  '/:id/participant/:employeeId',
  authorize('hr', 'manager'),
  updateParticipantProgress
);

module.exports = router;
