const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Helper to format current date as YYYY-MM-DD
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format current time as HH:MM AM/PM
const getCurrentTimeString = () => {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// @desc    Record employee Check-In for today
// @route   POST /api/attendance/check-in
// @access  Private (Employee, Manager, HR)
const checkIn = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const date = getTodayDateString();

    let employeeId = null;
    if (req.user.employee) {
      employeeId = req.user.employee._id || req.user.employee;
    } else {
      const emp = await Employee.findOne({ email: req.user.email });
      if (emp) employeeId = emp._id;
    }

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee record found for your user account.',
      });
    }

    // Check if already checked in today
    let record = await Attendance.findOne({ employee: employeeId, date });
    if (record && record.checkIn) {
      return res.status(400).json({
        success: false,
        message: `Already checked in today at ${record.checkIn}`,
        data: record,
      });
    }

    const checkInTime = getCurrentTimeString();
    if (!record) {
      record = await Attendance.create({
        employee: employeeId,
        date,
        checkIn: checkInTime,
        status: status || 'Present',
        notes: notes || '',
      });
    } else {
      record.checkIn = checkInTime;
      record.status = status || record.status;
      if (notes) record.notes = notes;
      await record.save();
    }

    const populated = await Attendance.findById(record._id).populate('employee');

    return res.status(200).json({
      success: true,
      message: `Checked in successfully at ${checkInTime}`,
      data: populated,
    });
  } catch (err) {
    console.error('[AttendanceController.checkIn] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Record employee Check-Out for today
// @route   POST /api/attendance/check-out
// @access  Private (Employee, Manager, HR)
const checkOut = async (req, res) => {
  try {
    const { notes } = req.body;
    const date = getTodayDateString();

    let employeeId = null;
    if (req.user.employee) {
      employeeId = req.user.employee._id || req.user.employee;
    } else {
      const emp = await Employee.findOne({ email: req.user.email });
      if (emp) employeeId = emp._id;
    }

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No associated employee record found for your user account.',
      });
    }

    let record = await Attendance.findOne({ employee: employeeId, date });
    if (!record || !record.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You have not checked in yet today. Please check in first.',
      });
    }

    if (record.checkOut) {
      return res.status(400).json({
        success: false,
        message: `Already checked out today at ${record.checkOut}`,
        data: record,
      });
    }

    const checkOutTime = getCurrentTimeString();
    record.checkOut = checkOutTime;
    if (notes) {
      record.notes = record.notes ? `${record.notes} | ${notes}` : notes;
    }
    await record.save();

    const populated = await Attendance.findById(record._id).populate('employee');

    return res.status(200).json({
      success: true,
      message: `Checked out successfully at ${checkOutTime}`,
      data: populated,
    });
  } catch (err) {
    console.error('[AttendanceController.checkOut] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Get logged in employee's attendance history
// @route   GET /api/attendance/my
// @access  Private
const getMyAttendance = async (req, res) => {
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

    const records = await Attendance.find({ employee: employeeId })
      .populate('employee')
      .sort({ date: -1 });

    const todayDate = getTodayDateString();
    const todayRecord = records.find((r) => r.date === todayDate) || null;

    return res.status(200).json({
      success: true,
      count: records.length,
      today: todayRecord,
      data: records,
    });
  } catch (err) {
    console.error('[AttendanceController.getMyAttendance] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Get all attendance records (HR and Manager)
// @route   GET /api/attendance
// @access  Private (HR, Manager)
const getAllAttendance = async (req, res) => {
  try {
    const { date, status, department } = req.query;
    const query = {};

    if (date) {
      query.date = date;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    let records = await Attendance.find(query)
      .populate('employee')
      .sort({ date: -1, createdAt: -1 });

    if (department && department !== 'All') {
      records = records.filter(
        (r) => r.employee && r.employee.department === department
      );
    }

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    console.error('[AttendanceController.getAllAttendance] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Admin mark / override attendance record
// @route   POST /api/attendance/admin-mark
// @access  Private (HR only)
const adminMarkAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, notes } = req.body;

    const record = await Attendance.findOneAndUpdate(
      { employee: employeeId, date },
      {
        employee: employeeId,
        date,
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        status: status || 'Present',
        notes: notes || '',
      },
      { upsert: true, new: true, runValidators: true }
    ).populate('employee');

    return res.status(200).json({
      success: true,
      message: 'Attendance record updated by HR',
      data: record,
    });
  } catch (err) {
    console.error('[AttendanceController.adminMarkAttendance] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  adminMarkAttendance,
};
