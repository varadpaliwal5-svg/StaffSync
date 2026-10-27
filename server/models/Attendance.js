const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
    },
    date: {
      type: String, // Stored as YYYY-MM-DD for straightforward unique day indexing & querying
      required: [true, 'Date is required'],
    },
    checkIn: {
      type: String, // e.g., "09:05 AM"
      default: '',
    },
    checkOut: {
      type: String, // e.g., "05:30 PM"
      default: '',
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half-day', 'Work From Home'],
      default: 'Present',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance records for the same employee on the same date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
