const Announcement = require('../models/Announcement');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private (All authenticated users)
const getAnnouncements = async (req, res) => {
  try {
    const role = req.user.role;
    // Target audience: 'All' or specific role
    const announcements = await Announcement.find({
      targetAudience: { $in: ['All', role.charAt(0).toUpperCase() + role.slice(1)] },
    })
      .populate('postedBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (err) {
    console.error('[AnnouncementController.getAnnouncements] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Private (HR, Manager)
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, category, targetAudience } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      category: category || 'General',
      targetAudience: targetAudience || 'All',
      postedBy: req.user.id,
      postedByName: req.user.name,
    });

    const populated = await Announcement.findById(announcement._id).populate(
      'postedBy',
      'name email role'
    );

    return res.status(201).json({
      success: true,
      message: 'Announcement posted successfully',
      data: populated,
    });
  } catch (err) {
    console.error('[AnnouncementController.createAnnouncement] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (HR, or authoring Manager)
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // Only HR or the original author can delete
    if (
      req.user.role !== 'hr' &&
      announcement.postedBy.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this announcement',
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (err) {
    console.error('[AnnouncementController.deleteAnnouncement] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};
