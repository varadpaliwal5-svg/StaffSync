const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  adminMarkAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/my', getMyAttendance);
router.get('/', authorize('hr', 'manager'), getAllAttendance);
router.post('/admin-mark', authorize('hr'), adminMarkAttendance);

module.exports = router;
