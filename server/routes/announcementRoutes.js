const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getAnnouncements)
  .post(authorize('hr', 'manager'), createAnnouncement);

router.delete('/:id', deleteAnnouncement);

module.exports = router;
