const TrainingProgram = require('../models/TrainingProgram');

// @desc    Get all training programs
// @route   GET /api/training
// @access  Private (All authenticated users)
const getTrainingPrograms = async (req, res) => {
  try {
    const { status, department } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    const programs = await TrainingProgram.find(query)
      .populate('participants.employee')
      .populate('createdBy', 'name email role')
      .sort({ startDate: 1 });

    return res.status(200).json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch (err) {
    console.error('[TrainingController.getTrainingPrograms] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Create new training program
// @route   POST /api/training
// @access  Private (Manager, HR)
const createTrainingProgram = async (req, res) => {
  try {
    const { title, description, trainer, department, startDate, endDate, status, participantIds } = req.body;

    const participants = Array.isArray(participantIds)
      ? participantIds.map((id) => ({ employee: id, completionStatus: 'Enrolled', progress: 0 }))
      : [];

    const program = await TrainingProgram.create({
      title,
      description,
      trainer,
      department: department || 'All Departments',
      startDate,
      endDate,
      status: status || 'Upcoming',
      participants,
      createdBy: req.user.id,
    });

    const populated = await TrainingProgram.findById(program._id)
      .populate('participants.employee')
      .populate('createdBy', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Training program created successfully',
      data: populated,
    });
  } catch (err) {
    console.error('[TrainingController.createTrainingProgram] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Update training program
// @route   PUT /api/training/:id
// @access  Private (Manager, HR)
const updateTrainingProgram = async (req, res) => {
  try {
    const { title, description, trainer, department, startDate, endDate, status } = req.body;

    const program = await TrainingProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Training program not found' });
    }

    if (title) program.title = title;
    if (description) program.description = description;
    if (trainer) program.trainer = trainer;
    if (department) program.department = department;
    if (startDate) program.startDate = startDate;
    if (endDate) program.endDate = endDate;
    if (status) program.status = status;

    await program.save();

    const updated = await TrainingProgram.findById(program._id)
      .populate('participants.employee')
      .populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Training program updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('[TrainingController.updateTrainingProgram] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Enroll employee into a training program
// @route   POST /api/training/:id/enroll
// @access  Private (Manager, HR, or self-enroll)
const enrollEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const program = await TrainingProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Training program not found' });
    }

    const alreadyEnrolled = program.participants.some(
      (p) => p.employee && p.employee.toString() === employeeId.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Employee is already enrolled in this training program',
      });
    }

    program.participants.push({
      employee: employeeId,
      enrolledAt: new Date(),
      progress: 0,
      completionStatus: 'Enrolled',
    });

    await program.save();

    const updated = await TrainingProgram.findById(program._id).populate('participants.employee');

    return res.status(200).json({
      success: true,
      message: 'Employee enrolled successfully',
      data: updated,
    });
  } catch (err) {
    console.error('[TrainingController.enrollEmployee] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Update participant progress & completion
// @route   PUT /api/training/:id/participant/:employeeId
// @access  Private (Manager, HR)
const updateParticipantProgress = async (req, res) => {
  try {
    const { progress, completionStatus } = req.body;
    const program = await TrainingProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Training program not found' });
    }

    const participant = program.participants.find(
      (p) => p.employee && p.employee.toString() === req.params.employeeId
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant record not found in this training program',
      });
    }

    if (progress !== undefined) participant.progress = progress;
    if (completionStatus) participant.completionStatus = completionStatus;

    await program.save();

    const updated = await TrainingProgram.findById(program._id).populate('participants.employee');

    return res.status(200).json({
      success: true,
      message: 'Participant progress updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('[TrainingController.updateParticipantProgress] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Delete a training program
// @route   DELETE /api/training/:id
// @access  Private (Manager, HR)
const deleteTrainingProgram = async (req, res) => {
  try {
    const program = await TrainingProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Training program not found' });
    }

    await TrainingProgram.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Training program deleted successfully',
    });
  } catch (err) {
    console.error('[TrainingController.deleteTrainingProgram] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports = {
  getTrainingPrograms,
  createTrainingProgram,
  updateTrainingProgram,
  enrollEmployee,
  updateParticipantProgress,
  deleteTrainingProgram,
};
