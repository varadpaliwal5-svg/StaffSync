import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EmployeeDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance');

  // Attendance State
  const [attendanceData, setAttendanceData] = useState({
    today: null,
    history: [],
  });
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [attendanceMode, setAttendanceMode] = useState('Present');

  // Leaves State
  const [myLeaves, setMyLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    leaveType: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Training Programs State
  const [myTrainings, setMyTrainings] = useState([]);
  const [loadingTrainings, setLoadingTrainings] = useState(false);

  // Toast / Feedback
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4500);
  };

  // Fetch Attendance
  const fetchMyAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const res = await api.get('/attendance/my');
      if (res.data.success) {
        setAttendanceData({
          today: res.data.today,
          history: res.data.data,
        });
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Fetch Leaves
  const fetchMyLeaves = async () => {
    try {
      setLoadingLeaves(true);
      const res = await api.get('/leaves/my');
      if (res.data.success) {
        setMyLeaves(res.data.data);
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

  // Fetch Trainings
  const fetchMyTrainings = async () => {
    try {
      setLoadingTrainings(true);
      const res = await api.get('/training');
      if (res.data.success) {
        // Filter programs where current employee is enrolled
        const empId = user?.employee?._id || user?.employee;
        const enrolled = res.data.data.filter((prog) =>
          prog.participants?.some((p) => p.employee?._id === empId || p.employee === empId)
        );
        setMyTrainings(enrolled);
      }
    } catch (err) {
      console.error('Failed to load trainings:', err);
    } finally {
      setLoadingTrainings(false);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
    fetchMyLeaves();
    fetchAnnouncements();
    fetchMyTrainings();
  }, []);

  // Daily Check-In
  const handleCheckIn = async () => {
    try {
      const res = await api.post('/attendance/check-in', {
        status: attendanceMode,
        notes: attendanceNotes,
      });
      if (res.data.success) {
        showToast('success', res.data.message);
        setAttendanceNotes('');
        fetchMyAttendance();
      }
    } catch (err) {
      showToast('danger', err.response?.data?.message || 'Check-in failed');
    }
  };

  // Daily Check-Out
  const handleCheckOut = async () => {
    try {
      const res = await api.post('/attendance/check-out', {
        notes: attendanceNotes,
      });
      if (res.data.success) {
        showToast('success', res.data.message);
        setAttendanceNotes('');
        fetchMyAttendance();
      }
    } catch (err) {
      showToast('danger', err.response?.data?.message || 'Check-out failed');
    }
  };

  // Submit Leave Application
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/leaves', leaveFormData);
      if (res.data.success) {
        showToast('success', 'Leave application submitted successfully for review');
        setShowApplyModal(false);
        setLeaveFormData({
          leaveType: 'Casual Leave',
          startDate: '',
          endDate: '',
          reason: '',
        });
        fetchMyLeaves();
      }
    } catch (err) {
      showToast('danger', err.response?.data?.message || 'Failed to submit leave application');
    }
  };

  const employee = user?.employee;

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
          <h2 className="fw-bold text-dark mb-1">Employee Self-Service Portal</h2>
          <p className="text-muted small mb-0">
            Welcome back, {user?.name}. Manage your daily punch logs, leave applications, and view company notices.
          </p>
        </div>
        <button className="btn btn-primary-custom d-flex align-items-center gap-2" onClick={() => setShowApplyModal(true)}>
          <i className="bi bi-file-earmark-plus-fill"></i>
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Navigation Pills */}
      <ul className="nav nav-pills nav-pills-custom mb-4 bg-white p-2 rounded-3 border">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
            <i className="bi bi-calendar2-check"></i> Attendance & Profile
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}>
            <i className="bi bi-file-earmark-medical"></i> My Leave Applications
            {myLeaves.length > 0 && <span className="badge bg-secondary ms-1">{myLeaves.length}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
            <i className="bi bi-megaphone"></i> Company Announcements
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}>
            <i className="bi bi-mortarboard"></i> Enrolled Training ({myTrainings.length})
          </button>
        </li>
      </ul>

      {/* TAB 1: ATTENDANCE & PROFILE */}
      {activeTab === 'attendance' && (
        <div className="row g-4">
          {/* Employee Profile Card */}
          <div className="col-12 col-lg-4">
            <div className="card-custom p-4 mb-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-4"
                  style={{ width: '64px', height: '64px' }}
                >
                  {user?.name ? user.name.charAt(0) : 'E'}
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-0">{user?.name}</h5>
                  <span className="badge bg-primary-subtle text-primary fw-semibold">{employee?.designation || 'Staff Member'}</span>
                </div>
              </div>

              <div className="list-group list-group-flush small">
                <div className="list-group-item px-0 py-2 d-flex justify-content-between">
                  <span className="text-muted">Employee ID:</span>
                  <span className="fw-bold text-primary">{employee?.employeeId || 'EMP-SYNC'}</span>
                </div>
                <div className="list-group-item px-0 py-2 d-flex justify-content-between">
                  <span className="text-muted">Department:</span>
                  <span className="fw-semibold">{employee?.department || 'Engineering'}</span>
                </div>
                <div className="list-group-item px-0 py-2 d-flex justify-content-between">
                  <span className="text-muted">Work Email:</span>
                  <span className="fw-semibold">{user?.email}</span>
                </div>
                <div className="list-group-item px-0 py-2 d-flex justify-content-between">
                  <span className="text-muted">Contact Phone:</span>
                  <span className="fw-semibold">{employee?.phone || 'Not listed'}</span>
                </div>
                <div className="list-group-item px-0 py-2 d-flex justify-content-between">
                  <span className="text-muted">Joining Date:</span>
                  <span className="fw-semibold">
                    {employee?.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="list-group-item px-0 py-2 d-flex justify-content-between">
                  <span className="text-muted">Status:</span>
                  <span className="badge bg-success-subtle text-success">{employee?.status || 'Active'}</span>
                </div>
              </div>
            </div>

            {/* Daily Punch Card */}
            <div className="card-custom p-4 border-start border-4 border-primary">
              <h5 className="fw-bold mb-3"><i className="bi bi-clock-history text-primary me-2"></i>Daily Attendance Punch</h5>
              <div className="mb-3 p-3 bg-light rounded-3 text-center">
                <div className="text-muted small">Today's Date</div>
                <div className="fw-bold fs-5 text-dark">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>

                <div className="d-flex justify-content-around mt-3 pt-3 border-top">
                  <div>
                    <span className="small text-muted d-block">Check In</span>
                    <span className="fw-bold text-success fs-6">
                      {attendanceData.today?.checkIn || '—'}
                    </span>
                  </div>
                  <div className="border-end"></div>
                  <div>
                    <span className="small text-muted d-block">Check Out</span>
                    <span className="fw-bold text-primary fs-6">
                      {attendanceData.today?.checkOut || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {!attendanceData.today?.checkIn ? (
                <div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Attendance Mode</label>
                    <select
                      className="form-select form-select-sm"
                      value={attendanceMode}
                      onChange={(e) => setAttendanceMode(e.target.value)}
                    >
                      <option value="Present">Present (Office)</option>
                      <option value="Work From Home">Work From Home (WFH)</option>
                      <option value="Half-day">Half-day</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Punch Note (Optional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Starting sprint tasks"
                      value={attendanceNotes}
                      onChange={(e) => setAttendanceNotes(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-success w-100 py-2 fw-semibold" onClick={handleCheckIn}>
                    <i className="bi bi-box-arrow-in-right me-1"></i> Punch Check In
                  </button>
                </div>
              ) : !attendanceData.today?.checkOut ? (
                <div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Daily Wrap-up Note</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Completed assigned sprint user stories"
                      value={attendanceNotes}
                      onChange={(e) => setAttendanceNotes(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary w-100 py-2 fw-semibold" onClick={handleCheckOut}>
                    <i className="bi bi-box-arrow-right me-1"></i> Punch Check Out
                  </button>
                </div>
              ) : (
                <div className="alert alert-success text-center mb-0 small py-2 rounded-3">
                  <i className="bi bi-check-circle-fill me-1"></i> Attendance completed for today!
                </div>
              )}
            </div>
          </div>

          {/* Attendance History */}
          <div className="col-12 col-lg-8">
            <div className="card-custom p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-bold mb-0">My Attendance History</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={fetchMyAttendance}>
                  <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAttendance ? (
                      <tr><td colSpan="5" className="text-center py-4 text-muted">Loading attendance...</td></tr>
                    ) : attendanceData.history.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-4 text-muted">No attendance logs yet. Punch in today!</td></tr>
                    ) : (
                      attendanceData.history.map((rec) => (
                        <tr key={rec._id}>
                          <td className="fw-semibold">{rec.date}</td>
                          <td>
                            {rec.checkIn ? (
                              <span className="text-success"><i className="bi bi-box-arrow-in-right me-1"></i>{rec.checkIn}</span>
                            ) : '—'}
                          </td>
                          <td>
                            {rec.checkOut ? (
                              <span className="text-primary"><i className="bi bi-box-arrow-right me-1"></i>{rec.checkOut}</span>
                            ) : '—'}
                          </td>
                          <td>
                            <span className={`badge ${
                              rec.status === 'Present' ? 'bg-success-subtle text-success' :
                              rec.status === 'Work From Home' ? 'bg-info-subtle text-info' :
                              rec.status === 'Half-day' ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="small text-muted">{rec.notes || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY LEAVE APPLICATIONS */}
      {activeTab === 'leaves' && (
        <div className="card-custom p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1">My Leave Applications</h5>
              <p className="text-muted small mb-0">Track real-time status of your submitted time-off requests.</p>
            </div>
            <button className="btn btn-primary-custom btn-sm d-flex align-items-center gap-1" onClick={() => setShowApplyModal(true)}>
              <i className="bi bi-plus-circle-fill"></i>
              <span>Apply New Leave</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reviewer Feedback</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {loadingLeaves ? (
                  <tr><td colSpan="6" className="text-center py-4 text-muted">Loading leaves...</td></tr>
                ) : myLeaves.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4 text-muted">No leave requests found. Click "Apply New Leave" above!</td></tr>
                ) : (
                  myLeaves.map((l) => (
                    <tr key={l._id}>
                      <td className="fw-semibold text-dark">{l.leaveType}</td>
                      <td className="small">
                        {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td className="small" style={{ maxWidth: '240px' }}>{l.reason}</td>
                      <td>
                        <span className={`badge ${
                          l.status === 'Approved' ? 'bg-success-subtle text-success' :
                          l.status === 'Rejected' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="small text-muted">
                        {l.reviewComments ? (
                          <div>
                            <em>"{l.reviewComments}"</em>
                            <div className="text-secondary" style={{ fontSize: '0.75rem' }}>Reviewed by: {l.reviewedBy?.name || 'Manager'}</div>
                          </div>
                        ) : (
                          <span className="text-secondary">Awaiting manager decision</span>
                        )}
                      </td>
                      <td className="small text-muted">{new Date(l.appliedDate || l.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="card-custom p-4">
          <h5 className="fw-bold mb-1">Company Announcements</h5>
          <p className="text-muted small mb-4">Official broadcasts, policies, and company updates.</p>

          <div className="row g-3">
            {loadingAnnouncements ? (
              <div className="col-12 text-center py-4 text-muted">Loading announcements...</div>
            ) : announcements.length === 0 ? (
              <div className="col-12 text-center py-4 text-muted">No announcements posted currently.</div>
            ) : (
              announcements.map((ann) => (
                <div className="col-12" key={ann._id}>
                  <div className="card-custom p-3 border-start border-4 border-primary">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-primary-subtle text-primary">{ann.category}</span>
                      <span className="text-muted small">
                        <i className="bi bi-clock me-1"></i>
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">{ann.title}</h6>
                    <p className="text-secondary small mb-2">{ann.content}</p>
                    <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                      Announced by: <span className="fw-semibold">{ann.postedByName || 'Management'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ENROLLED TRAININGS */}
      {activeTab === 'training' && (
        <div className="card-custom p-4">
          <h5 className="fw-bold mb-1">My Enrolled Training Programs</h5>
          <p className="text-muted small mb-4">Upskilling and continuous career development initiatives.</p>

          <div className="row g-4">
            {loadingTrainings ? (
              <div className="col-12 text-center py-4 text-muted">Loading programs...</div>
            ) : myTrainings.length === 0 ? (
              <div className="col-12 text-center py-4 text-muted">You are not enrolled in any training programs at the moment.</div>
            ) : (
              myTrainings.map((prog) => {
                const myParticipant = prog.participants?.find(
                  (p) => (p.employee?._id || p.employee) === (user?.employee?._id || user?.employee)
                );
                return (
                  <div className="col-12 col-md-6" key={prog._id}>
                    <div className="card-custom p-4 h-100">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className={`badge ${
                          prog.status === 'Ongoing' ? 'bg-primary-subtle text-primary' :
                          prog.status === 'Completed' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'
                        }`}>
                          {prog.status}
                        </span>
                        <span className="small text-muted">
                          {new Date(prog.startDate).toLocaleDateString()} - {new Date(prog.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{prog.title}</h6>
                      <p className="text-secondary small mb-3">{prog.description}</p>
                      <div className="p-2 bg-light rounded-2 small mb-3">
                        <div><strong>Trainer:</strong> {prog.trainer}</div>
                        <div><strong>Status:</strong> {myParticipant?.completionStatus || 'Enrolled'}</div>
                      </div>

                      {myParticipant?.progress !== undefined && (
                        <div>
                          <div className="d-flex justify-content-between small text-muted mb-1">
                            <span>My Completion Progress</span>
                            <span>{myParticipant.progress}%</span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div
                              className="progress-bar bg-success"
                              role="progressbar"
                              style={{ width: `${myParticipant.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: APPLY FOR LEAVE */}
      {showApplyModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Submit Leave Application</h5>
                <button type="button" className="btn-close" onClick={() => setShowApplyModal(false)}></button>
              </div>
              <form onSubmit={handleApplyLeave}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Leave Category *</label>
                    <select
                      className="form-select"
                      value={leaveFormData.leaveType}
                      onChange={(e) => setLeaveFormData({ ...leaveFormData, leaveType: e.target.value })}
                    >
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Paid Leave">Paid Vacation Leave</option>
                      <option value="Emergency Leave">Emergency Leave</option>
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">From Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={leaveFormData.startDate}
                        onChange={(e) => setLeaveFormData({ ...leaveFormData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">To Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={leaveFormData.endDate}
                        onChange={(e) => setLeaveFormData({ ...leaveFormData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Reason for Leave *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      required
                      placeholder="Briefly state reason for your leave request..."
                      value={leaveFormData.reason}
                      onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light" onClick={() => setShowApplyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom">
                    Submit Application
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

export default EmployeeDashboard;
