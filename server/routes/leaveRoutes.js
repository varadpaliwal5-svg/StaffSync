const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', applyLeave);
router.get('/my', getMyLeaves);
router.get('/', authorize('hr', 'manager'), getAllLeaves);
router.put('/:id/status', authorize('hr', 'manager'), updateLeaveStatus);

module.exports = router;
