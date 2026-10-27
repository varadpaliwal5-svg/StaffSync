import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

const HRDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Employees state
  const [employees, setEmployees] = useState([]);
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('All');
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Add/Edit Employee Modal state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  const [employeeFormData, setEmployeeFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    salary: '',
    dateOfJoining: '',
    status: 'Active',
    createLogin: true,
    password: 'Password123!',
    role: 'employee',
  });

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('All');
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Leaves state
  const [leaves, setLeaves] = useState([]);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('All');
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [reviewModalLeave, setReviewModalLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approved');
  const [reviewComments, setReviewComments] = useState('');

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementFormData, setAnnouncementFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    targetAudience: 'All',
  });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  // Toast / Feedback message
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.get('/stats/dashboard');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Employees
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await api.get('/employees', {
        params: {
          department: empDeptFilter,
          search: empSearch,
        },
      });
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
      showToast('danger', 'Failed to load employee records');
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fetch Attendance
  const fetchAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const res = await api.get('/attendance', {
        params: {
          date: attendanceDate,
          status: attendanceStatusFilter,
        },
      });
      if (res.data.success) {
        setAttendanceRecords(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Fetch Leaves
  const fetchLeaves = async () => {
    try {
      setLoadingLeaves(true);
      const res = await api.get('/leaves', {
        params: {
          status: leaveStatusFilter,
        },
      });
      if (res.data.success) {
        setLeaves(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  // Fetch Announcements
  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const res = await api.get('/announcements');
      if (res.data.success) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'employees') fetchEmployees();
    if (activeTab === 'attendance') fetchAttendance();
    if (activeTab === 'leaves') fetchLeaves();
    if (activeTab === 'announcements') fetchAnnouncements();
  }, [activeTab, empDeptFilter, attendanceDate, attendanceStatusFilter, leaveStatusFilter]);

  // Employee Form submit (Add or Edit)
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      if (isEditingEmployee) {
        const res = await api.put(`/employees/${currentEmployeeId}`, employeeFormData);
        if (res.data.success) {
          showToast('success', 'Employee updated successfully');
          setShowEmployeeModal(false);
          fetchEmployees();
          fetchStats();
        }
      } else {
        const res = await api.post('/employees', employeeFormData);
        if (res.data.success) {
          showToast('success', 'Employee added successfully');
          setShowEmployeeModal(false);
          fetchEmployees();
          fetchStats();
        }
      }
    } catch (err) {
      showToast('danger', err.response?.data?.message || 'Error saving employee');
    }
  };

  const openAddEmployeeModal = () => {
    setIsEditingEmployee(false);
    setCurrentEmployeeId(null);
    setEmployeeFormData({
      employeeId: `EMP${Math.floor(100 + Math.random() * 900)}`,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: 'Engineering',
      designation: '',
      salary: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      status: 'Active',
      createLogin: true,
      password: 'Password123!',
      role: 'employee',
    });
    setShowEmployeeModal(true);
  };

  const openEditEmployeeModal = (emp) => {
    setIsEditingEmployee(true);
    setCurrentEmployeeId(emp._id);
    setEmployeeFormData({
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation,
      salary: emp.salary,
      dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.split('T')[0] : '',
      status: emp.status,
      createLogin: false,
      role: 'employee',
    });
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove employee "${name}"? This will also remove login access.`)) {
      try {
        const res = await api.delete(`/employees/${id}`);
        if (res.data.success) {
          showToast('success', 'Employee deleted successfully');
          fetchEmployees();
          fetchStats();
        }
      } catch (err) {
        showToast('danger', err.response?.data?.message || 'Error deleting employee');
      }
    }
  };

  // Leave Status Review
  const handleUpdateLeaveStatus = async () => {
    if (!reviewModalLeave) return;
    try {
      const res = await api.put(`/leaves/${reviewModalLeave._id}/status`, {
        status: reviewAction,
        reviewComments,
      });
      if (res.data.success) {
        showToast('success', `Leave request ${reviewAction.toLowerCase()} successfully`);
        setReviewModalLeave(null);
        setReviewComments('');
        fetchLeaves();
        fetchStats();
      }
    } catch (err) {
      showToast('danger', err.response?.data?.message || 'Error updating leave request');
    }
  };

  // Post Announcement
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/announcements', announcementFormData);
      if (res.data.success) {
        showToast('success', 'Announcement published successfully');
        setShowAnnouncementModal(false);
        setAnnouncementFormData({
          title: '',
          content: '',
          category: 'General',
          targetAudience: 'All',
        });
        fetchAnnouncements();
        fetchStats();
      }
    } catch (err) {
      showToast('danger', err.response?.data?.message || 'Error posting announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm('Delete this announcement?')) {
      try {
        await api.delete(`/announcements/${id}`);
        showToast('success', 'Announcement deleted');
        fetchAnnouncements();
        fetchStats();
      } catch (err) {
        showToast('danger', err.response?.data?.message || 'Error deleting announcement');
      }
    }
  };

  return (
    <div className="container-fluid max-w-7xl py-4 px-3 px-md-4">
      {/* Toast Feedback */}
      {feedback.message && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show shadow-sm`} role="alert">
          <i className={`bi ${feedback.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          {feedback.message}
          <button type="button" className="btn-close" onClick={() => setFeedback({ type: '', message: '' })}></button>
        </div>
      )}

      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">HR Administration Portal</h2>
          <p className="text-muted small mb-0">
            Welcome back, {user?.name}. Complete workforce, leave, attendance, and corporate announcements control.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary-custom d-flex align-items-center gap-2" onClick={openAddEmployeeModal}>
            <i className="bi bi-person-plus-fill"></i>
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Navigation Pills */}
      <ul className="nav nav-pills nav-pills-custom mb-4 bg-white p-2 rounded-3 border">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <i className="bi bi-grid-1x2"></i> Overview
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
            <i className="bi bi-people"></i> Employees
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
            <i className="bi bi-calendar-check"></i> Attendance
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}>
            <i className="bi bi-file-earmark-medical"></i> Leave Requests
            {stats?.pendingLeaves > 0 && (
              <span className="badge bg-danger ms-1">{stats.pendingLeaves}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
            <i className="bi bi-megaphone"></i> Announcements
          </button>
        </li>
      </ul>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          {/* Metrics Row */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Total Employees"
                value={loadingStats ? '...' : stats?.totalEmployees || 0}
                subtitle={`${stats?.activeEmployees || 0} active members`}
                icon="bi-people-fill"
                iconBg="#e0e7ff"
                iconColor="#4f46e5"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Pending Leaves"
                value={loadingStats ? '...' : stats?.pendingLeaves || 0}
                subtitle="Awaiting management review"
                icon="bi-clock-history"
                iconBg="#ffedd5"
                iconColor="#ea580c"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Marked Present Today"
                value={loadingStats ? '...' : stats?.attendanceToday?.present || 0}
                subtitle={`${stats?.attendanceToday?.wfh || 0} remote / WFH`}
                icon="bi-check2-circle"
                iconBg="#dcfce7"
                iconColor="#16a34a"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Active Trainings"
                value={loadingStats ? '...' : stats?.activeTrainings || 0}
                subtitle="Ongoing skill programs"
                icon="bi-mortarboard-fill"
                iconBg="#f3e8ff"
                iconColor="#9333ea"
              />
            </div>
          </div>

          {/* Department Breakdown & Quick Actions */}
          <div className="row g-4">
            <div className="col-12 col-lg-7">
              <div className="card-custom p-4 h-100">
                <h5 className="fw-bold mb-3"><i className="bi bi-diagram-3-fill text-primary me-2"></i>Department Headcount</h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Staff Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.departments?.map((dept, idx) => {
                        const pct = stats.totalEmployees > 0 ? Math.round((dept.count / stats.totalEmployees) * 100) : 0;
                        return (
                          <tr key={idx}>
                            <td className="fw-semibold">{dept.department}</td>
                            <td><span className="badge bg-light text-dark border px-2 py-1">{dept.count} members</span></td>
                            <td style={{ width: '40%' }}>
                              <div className="d-flex align-items-center gap-2">
                                <div className="progress flex-grow-1" style={{ height: '8px' }}>
                                  <div
                                    className="progress-bar bg-primary"
                                    role="progressbar"
                                    style={{ width: `${pct}%` }}
                                    aria-valuenow={pct}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  ></div>
                                </div>
                                <span className="small text-muted">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="card-custom p-4 h-100">
                <h5 className="fw-bold mb-3"><i className="bi bi-lightning-charge-fill text-warning me-2"></i>Quick HR Workflows</h5>
                <div className="d-grid gap-2">
                  <button className="btn btn-outline-primary text-start p-3 rounded-3" onClick={() => setActiveTab('employees')}>
                    <div className="fw-bold"><i className="bi bi-people me-2"></i>Manage Employee Records</div>
                    <div className="small text-muted">Add, view, update, or remove personnel profiles</div>
                  </button>
                  <button className="btn btn-outline-warning text-start p-3 rounded-3 text-dark" onClick={() => setActiveTab('leaves')}>
                    <div className="fw-bold"><i className="bi bi-file-earmark-medical me-2"></i>Process Leave Approvals</div>
                    <div className="small text-muted">{stats?.pendingLeaves || 0} leave applications pending approval</div>
                  </button>
                  <button className="btn btn-outline-success text-start p-3 rounded-3" onClick={() => setActiveTab('attendance')}>
                    <div className="fw-bold"><i className="bi bi-calendar-check me-2"></i>View Organization Attendance</div>
                    <div className="small text-muted">Monitor daily punch logs and remote check-ins</div>
                  </button>
                  <button className="btn btn-outline-info text-start p-3 rounded-3 text-dark" onClick={() => { setActiveTab('announcements'); setShowAnnouncementModal(true); }}>
                    <div className="fw-bold"><i className="bi bi-megaphone me-2"></i>Broadcast Company Notice</div>
                    <div className="small text-muted">Publish notifications and organization policy updates</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMPLOYEES */}
      {activeTab === 'employees' && (
        <div className="card-custom p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <h5 className="fw-bold mb-0">Employee Directory ({employees.length})</h5>
            <div className="d-flex flex-wrap gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search name, ID, or email..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                style={{ width: '220px' }}
              />
              <select
                className="form-select form-select-sm"
                value={empDeptFilter}
                onChange={(e) => setEmpDeptFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchEmployees}>
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingEmployees ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">Loading employees...</td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No employees match current filters.</td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp._id}>
                      <td className="fw-bold text-primary">{emp.employeeId}</td>
                      <td>
                        <div className="fw-semibold text-dark">{emp.firstName} {emp.lastName}</div>
                        <div className="small text-muted">{emp.email} • {emp.phone}</div>
                      </td>
                      <td><span className="badge bg-light text-secondary border">{emp.department}</span></td>
                      <td>{emp.designation}</td>
                      <td className="fw-semibold">${emp.salary.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${
                          emp.status === 'Active' ? 'bg-success-subtle text-success' :
                          emp.status === 'On Leave' ? 'bg-warning-subtle text-warning' : 'bg-secondary-subtle text-secondary'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => openEditEmployeeModal(emp)}
                          title="Edit Employee"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteEmployee(emp._id, `${emp.firstName} ${emp.lastName}`)}
                          title="Delete Employee"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="card-custom p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1">Organization Attendance</h5>
              <p className="text-muted small mb-0">Daily check-in logs and work modes across the workforce.</p>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <input
                type="date"
                className="form-control form-control-sm"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                style={{ width: '160px' }}
              />
              <select
                className="form-select form-select-sm"
                value={attendanceStatusFilter}
                onChange={(e) => setAttendanceStatusFilter(e.target.value)}
                style={{ width: '150px' }}
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Work From Home">Work From Home</option>
                <option value="Half-day">Half-day</option>
                <option value="Absent">Absent</option>
              </select>
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchAttendance}>
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loadingAttendance ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">Loading attendance logs...</td>
                  </tr>
                ) : attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No attendance logs found for this date.</td>
                  </tr>
                ) : (
                  attendanceRecords.map((att) => (
                    <tr key={att._id}>
                      <td>
                        <div className="fw-semibold text-dark">{att.employee?.firstName} {att.employee?.lastName}</div>
                        <div className="small text-muted">{att.employee?.employeeId}</div>
                      </td>
                      <td><span className="badge bg-light text-dark border">{att.employee?.department || 'N/A'}</span></td>
                      <td>{att.date}</td>
                      <td>{att.checkIn ? <span className="text-success fw-semibold"><i className="bi bi-box-arrow-in-right me-1"></i>{att.checkIn}</span> : '—'}</td>
                      <td>{att.checkOut ? <span className="text-primary fw-semibold"><i className="bi bi-box-arrow-right me-1"></i>{att.checkOut}</span> : '—'}</td>
                      <td>
                        <span className={`badge ${
                          att.status === 'Present' ? 'bg-success-subtle text-success' :
                          att.status === 'Work From Home' ? 'bg-info-subtle text-info' :
                          att.status === 'Half-day' ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="small text-muted">{att.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LEAVE REQUESTS */}
      {activeTab === 'leaves' && (
        <div className="card-custom p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1">Workforce Leave Requests</h5>
              <p className="text-muted small mb-0">Review, approve, or reject employee leave applications.</p>
            </div>
            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={leaveStatusFilter}
                onChange={(e) => setLeaveStatusFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="All">All Requests</option>
                <option value="Pending">Pending Only</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchLeaves}>
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Date Range</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Decision / Review</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingLeaves ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">Loading leave requests...</td>
                  </tr>
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No leave requests found.</td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave._id}>
                      <td>
                        <div className="fw-semibold text-dark">{leave.employee?.firstName} {leave.employee?.lastName}</div>
                        <div className="small text-muted">{leave.employee?.department} • {leave.employee?.employeeId}</div>
                      </td>
                      <td><span className="badge bg-light text-dark border">{leave.leaveType}</span></td>
                      <td className="small">
                        {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="small" style={{ maxWidth: '240px' }}>{leave.reason}</td>
                      <td>
                        <span className={`badge ${
                          leave.status === 'Approved' ? 'bg-success-subtle text-success' :
                          leave.status === 'Rejected' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="small text-muted">
                        {leave.reviewComments ? (
                          <div>
                            <em>"{leave.reviewComments}"</em>
                            <div className="text-secondary" style={{ fontSize: '0.75rem' }}>By: {leave.reviewedBy?.name || 'Reviewer'}</div>
                          </div>
                        ) : 'Pending review'}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            setReviewModalLeave(leave);
                            setReviewAction(leave.status === 'Pending' ? 'Approved' : leave.status);
                            setReviewComments(leave.reviewComments || '');
                          }}
                        >
                          <i className="bi bi-sliders me-1"></i> Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="card-custom p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1">Company Announcements Board</h5>
              <p className="text-muted small mb-0">Publish broadcasts, holidays, and organizational updates.</p>
            </div>
            <button className="btn btn-primary-custom btn-sm d-flex align-items-center gap-1" onClick={() => setShowAnnouncementModal(true)}>
              <i className="bi bi-megaphone-fill"></i>
              <span>Post Announcement</span>
            </button>
          </div>

          <div className="row g-3">
            {loadingAnnouncements ? (
              <div className="col-12 text-center py-4 text-muted">Loading announcements...</div>
            ) : announcements.length === 0 ? (
              <div className="col-12 text-center py-4 text-muted">No announcements posted yet.</div>
            ) : (
              announcements.map((ann) => (
                <div className="col-12" key={ann._id}>
                  <div className="card-custom p-3 border-start border-4 border-primary">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary-subtle text-primary">{ann.category}</span>
                        <span className="badge bg-light text-muted border">Audience: {ann.targetAudience}</span>
                        <span className="text-muted small">
                          <i className="bi bi-clock me-1"></i>
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger border-0"
                        onClick={() => handleDeleteAnnouncement(ann._id)}
                        title="Delete announcement"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">{ann.title}</h6>
                    <p className="text-secondary small mb-2">{ann.content}</p>
                    <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                      Posted by: <span className="fw-semibold">{ann.postedByName || 'Management'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {showEmployeeModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  {isEditingEmployee ? 'Edit Employee Details' : 'Add New Employee Record'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEmployeeModal(false)}></button>
              </div>
              <form onSubmit={handleSaveEmployee}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Employee ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={employeeFormData.employeeId}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, employeeId: e.target.value })}
                        disabled={isEditingEmployee}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={employeeFormData.firstName}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={employeeFormData.lastName}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, lastName: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={employeeFormData.email}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                        disabled={isEditingEmployee}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Phone Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={employeeFormData.phone}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Department *</label>
                      <select
                        className="form-select"
                        value={employeeFormData.department}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Designation *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={employeeFormData.designation}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, designation: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Annual Salary ($) *</label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        min="0"
                        value={employeeFormData.salary}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, salary: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Date of Joining</label>
                      <input
                        type="date"
                        className="form-control"
                        value={employeeFormData.dateOfJoining}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, dateOfJoining: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Employment Status</label>
                      <select
                        className="form-select"
                        value={employeeFormData.status}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    {!isEditingEmployee && (
                      <div className="col-12 pt-2 border-top">
                        <div className="form-check form-switch mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="createLoginSwitch"
                            checked={employeeFormData.createLogin}
                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, createLogin: e.target.checked })}
                          />
                          <label className="form-check-label fw-semibold small" htmlFor="createLoginSwitch">
                            Automatically create login credentials for this employee
                          </label>
                        </div>
                        {employeeFormData.createLogin && (
                          <div className="row g-2">
                            <div className="col-md-6">
                              <label className="form-label small text-muted">Role</label>
                              <select
                                className="form-select form-select-sm"
                                value={employeeFormData.role}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, role: e.target.value })}
                              >
                                <option value="employee">Employee</option>
                                <option value="manager">Manager</option>
                                <option value="hr">HR Admin</option>
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small text-muted">Initial Password</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={employeeFormData.password}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light" onClick={() => setShowEmployeeModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom">
                    {isEditingEmployee ? 'Save Changes' : 'Create Employee Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW LEAVE REQUEST */}
      {reviewModalLeave && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Review Leave Request</h5>
                <button type="button" className="btn-close" onClick={() => setReviewModalLeave(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="p-3 bg-light rounded-3 mb-3 small">
                  <div><strong>Employee:</strong> {reviewModalLeave.employee?.firstName} {reviewModalLeave.employee?.lastName}</div>
                  <div><strong>Leave Type:</strong> {reviewModalLeave.leaveType}</div>
                  <div>
                    <strong>Duration:</strong> {new Date(reviewModalLeave.startDate).toLocaleDateString()} to {new Date(reviewModalLeave.endDate).toLocaleDateString()}
                  </div>
                  <div className="mt-2"><strong>Reason:</strong> {reviewModalLeave.reason}</div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Action Decision</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="leaveDecision"
                        id="decApproved"
                        value="Approved"
                        checked={reviewAction === 'Approved'}
                        onChange={(e) => setReviewAction(e.target.value)}
                      />
                      <label className="form-check-label fw-semibold text-success" htmlFor="decApproved">
                        <i className="bi bi-check-circle me-1"></i> Approve Leave
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="leaveDecision"
                        id="decRejected"
                        value="Rejected"
                        checked={reviewAction === 'Rejected'}
                        onChange={(e) => setReviewAction(e.target.value)}
                      />
                      <label className="form-check-label fw-semibold text-danger" htmlFor="decRejected">
                        <i className="bi bi-x-circle me-1"></i> Reject Leave
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Reviewer Comments / Note</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Provide any context, approval notes, or reason for rejection..."
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-light" onClick={() => setReviewModalLeave(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary-custom" onClick={handleUpdateLeaveStatus}>
                  Submit Decision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POST ANNOUNCEMENT */}
      {showAnnouncementModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Broadcast Company Announcement</h5>
                <button type="button" className="btn-close" onClick={() => setShowAnnouncementModal(false)}></button>
              </div>
              <form onSubmit={handleCreateAnnouncement}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Q4 Townhall Meeting Schedule"
                      required
                      value={announcementFormData.title}
                      onChange={(e) => setAnnouncementFormData({ ...announcementFormData, title: e.target.value })}
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Category</label>
                      <select
                        className="form-select"
                        value={announcementFormData.category}
                        onChange={(e) => setAnnouncementFormData({ ...announcementFormData, category: e.target.value })}
                      >
                        <option value="General">General</option>
                        <option value="Company News">Company News</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Policy Update">Policy Update</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Target Audience</label>
                      <select
                        className="form-select"
                        value={announcementFormData.targetAudience}
                        onChange={(e) => setAnnouncementFormData({ ...announcementFormData, targetAudience: e.target.value })}
                      >
                        <option value="All">All Staff</option>
                        <option value="Employee">Employees</option>
                        <option value="Manager">Managers</option>
                        <option value="HR">HR Only</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Content / Body *</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      required
                      placeholder="Write your announcement details here..."
                      value={announcementFormData.content}
                      onChange={(e) => setAnnouncementFormData({ ...announcementFormData, content: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light" onClick={() => setShowAnnouncementModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom">
                    Publish Announcement
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
