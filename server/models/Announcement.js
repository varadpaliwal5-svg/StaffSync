const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['General', 'Company News', 'Holiday', 'Policy Update', 'Urgent'],
      default: 'General',
    },
    targetAudience: {
      type: String,
      enum: ['All', 'HR', 'Manager', 'Employee'],
      default: 'All',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postedByName: {
      type: String,
      default: 'Management',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Announcement', announcementSchema);
