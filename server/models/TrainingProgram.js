const mongoose = require('mongoose');

const trainingProgramSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Training title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Training description is required'],
      trim: true,
    },
    trainer: {
      type: String,
      required: [true, 'Trainer name is required'],
      trim: true,
    },
    department: {
      type: String,
      default: 'All Departments',
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed'],
      default: 'Upcoming',
    },
    participants: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        progress: {
          type: Number,
          default: 0, // 0 to 100 percentage
          min: 0,
          max: 100,
        },
        completionStatus: {
          type: String,
          enum: ['Enrolled', 'In Progress', 'Completed', 'Dropped'],
          default: 'Enrolled',
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TrainingProgram', trainingProgramSchema);
