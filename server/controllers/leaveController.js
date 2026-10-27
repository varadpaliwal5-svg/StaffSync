const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');

// @desc    Apply for a leave
// @route   POST /api/leaves
// @access  Private (Employee, Manager, HR)
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    // Find linked employee record
    let employeeId = null;
    if (req.user.employee) {
      employeeId = req.user.employee._id || req.user.employee;
    } else {
      // Find employee by email
      const emp = await Employee.findOne({ email: req.user.email });
      if (emp) employeeId = emp._id;
    }

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee record found for your user account. Please contact HR.',
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date',
      });
    }

    const leave = await LeaveRequest.create({
      employee: employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'Pending',
    });

    const populatedLeave = await LeaveRequest.findById(leave._id).populate('employee');

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: populatedLeave,
    });
  } catch (err) {
    console.error('[LeaveController.applyLeave] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Get leave requests for logged in employee
// @route   GET /api/leaves/my
// @access  Private
const getMyLeaves = async (req, res) => {
  try {
    let employeeId = null;
    if (req.user.employee) {
      employeeId = req.user.employee._id || req.user.employee;
    } else {
      const emp = await Employee.findOne({ email: req.user.email });
      if (emp) employeeId = emp._id;
    }

    if (!employeeId) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const leaves = await LeaveRequest.find({ employee: employeeId })
      .populate('employee')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (err) {
    console.error('[LeaveController.getMyLeaves] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Get all leave requests (for HR and Manager)
// @route   GET /api/leaves
// @access  Private (HR, Manager)
const getAllLeaves = async (req, res) => {
  try {
    const { status, leaveType } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (leaveType && leaveType !== 'All') {
      query.leaveType = leaveType;
    }

    const leaves = await LeaveRequest.find(query)
      .populate('employee')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (err) {
    console.error('[LeaveController.getAllLeaves] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Update leave status (Approve / Reject)
// @route   PUT /api/leaves/:id/status
// @access  Private (HR, Manager)
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, reviewComments } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Approved, Rejected, or Pending',
      });
    }

    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    leave.status = status;
    leave.reviewedBy = req.user.id;
    if (reviewComments !== undefined) {
      leave.reviewComments = reviewComments;
    }

    await leave.save();

    // If leave approved, update employee status to 'On Leave' if date is current
    if (status === 'Approved') {
      const today = new Date();
      if (today >= new Date(leave.startDate) && today <= new Date(leave.endDate)) {
        await Employee.findByIdAndUpdate(leave.employee, { status: 'On Leave' });
      }
    }

    const updated = await LeaveRequest.findById(leave._id)
      .populate('employee')
      .populate('reviewedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (err) {
    console.error('[LeaveController.updateLeaveStatus] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
};
