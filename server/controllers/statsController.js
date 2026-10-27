const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const TrainingProgram = require('../models/TrainingProgram');
const Announcement = require('../models/Announcement');

// Helper to format today's date YYYY-MM-DD
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const today = getTodayDateString();

    const [
      totalEmployees,
      activeEmployees,
      pendingLeaves,
      todayAttendance,
      activeTrainings,
      totalAnnouncements,
      departmentAgg,
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'Active' }),
      LeaveRequest.countDocuments({ status: 'Pending' }),
      Attendance.find({ date: today }),
      TrainingProgram.countDocuments({ status: { $in: ['Upcoming', 'Ongoing'] } }),
      Announcement.countDocuments(),
      Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]),
    ]);

    const presentToday = todayAttendance.filter((a) => a.status === 'Present').length;
    const wfhToday = todayAttendance.filter((a) => a.status === 'Work From Home').length;
    const halfDayToday = todayAttendance.filter((a) => a.status === 'Half-day').length;

    return res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        pendingLeaves,
        activeTrainings,
        totalAnnouncements,
        attendanceToday: {
          totalMarked: todayAttendance.length,
          present: presentToday,
          wfh: wfhToday,
          halfDay: halfDayToday,
        },
        departments: departmentAgg.map((d) => ({
          department: d._id || 'Unassigned',
          count: d.count,
        })),
      },
    });
  } catch (err) {
    console.error('[StatsController.getDashboardStats] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports = { getDashboardStats };
