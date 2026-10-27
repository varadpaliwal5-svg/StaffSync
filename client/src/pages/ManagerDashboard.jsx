import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Leaves
  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('All');
  const [reviewModalLeave, setReviewModalLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approved');
  const [reviewComments, setReviewComments] = useState('');

  // Training Programs
  const [trainings, setTrainings] = useState([]);
  const [loadingTrainings, setLoadingTrainings] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingFormData, setTrainingFormData] = useState({
    title: '',
    description: '',
    trainer: '',
    department: 'Engineering',
    startDate: '',
    endDate: '',
    status: 'Upcoming',
  });

  // Employees list for enrollment
  const [employees, setEmployees] = useState([]);
  const [enrollModalTraining, setEnrollModalTraining] = useState(null);
  const [selectedEmpToEnroll, setSelectedEmpToEnroll] = useState('');

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementFormData, setAnnouncementFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    targetAudience: 'All',
  });

  // Feedback toast
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  // Fetch Dashboard Stats
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

  // Fetch Leaves
  const fetchLeaves = async () => {
    try {
      setLoadingLeaves(true);
      const res = await api.get('/leaves', {
        params: { status: leaveStatusFilter },
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

  // Fetch Training Programs
  const fetchTrainings = async () => {
    try {
      setLoadingTrainings(true);
      const res = await api.get('/training');
      if (res.data.success) {
        setTrainings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load training programs:', err);
    } finally {
      setLoadingTrainings(false);
    }
  };

  // Fetch Employees for training enrollment
  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
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
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (activeTab === 'leaves') fetchLeaves();
    if (activeTab === 'training') fetchTrainings();
    if (activeTab === 'announcements') fetchAnnouncements();
  }, [activeTab, leaveStatusFilter]);

  // Leave Review Action
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

  // Create Training Program
  const handleCreateTraining = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/training', trainingFormData);
      if (res.data.success) {
        showToast('success', 'Training program created successfully');
        setShowTrainingModal(false);
        setTrainingFormData({
          title: '',
          description: '',
          trainer: '',
          department: user?.employee?.department || 'Engineering',
          startDate: '',
          endDate: '',
          status: 'Upcoming',
        });
        fetchTrainings();
        fetchStats();
      }
    } catch (err) {
      showToast('danger', err.response?.data?.message || 'Error creating training program');
    }
  };

  // Enroll Employee into Training
  const handleEnrollEmployee = async () => {
    if (!enrollModalTraining || !selectedEmpToEnroll) return;
    try {
      const res = await api.post(`/training/${enrollModalTraining._id}/enroll`, {
        employeeId: selectedEmpToEnroll,
      });
      if (res.data.success) {
        showToast('success', 'Employee enrolled in training program');
        setEnrollModalTraining(null);
        setSelectedEmpToEnroll('');
        fetchTrainings();
      }
    } catch (err) {
      showToast('danger', err.response?.data?.message || 'Error enrolling employee');
    }
  };

  // Update Training Status
  const handleUpdateTrainingStatus = async (programId, newStatus) => {
    try {
      const res = await api.put(`/training/${programId}`, { status: newStatus });
      if (res.data.success) {
        showToast('success', `Program marked as ${newStatus}`);
        fetchTrainings();
        fetchStats();
      }
    } catch (err) {
      showToast('danger', err.response?.data?.message || 'Error updating status');
    }
  };

  // Create Announcement
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/announcements', announcementFormData);
      if (res.data.success) {
        showToast('success', 'Announcement published');
        setShowAnnouncementModal(false);
        setAnnouncementFormData({
          title: '',
          content: '',
          category: 'General',
          targetAudience: 'All',
        });
        fetchAnnouncements();
      }
    } catch (err) {
      showToast('danger', err.response?.data?.message || 'Error publishing announcement');
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
          <h2 className="fw-bold text-dark mb-1">Manager Workspace</h2>
          <p className="text-muted small mb-0">
            Welcome back, {user?.name}. Team leave approvals, skill development programs, and department announcements.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary-custom d-flex align-items-center gap-2" onClick={() => setShowTrainingModal(true)}>
            <i className="bi bi-journal-plus"></i>
            <span>Create Training Program</span>
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
          <button className={`nav-link ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}>
            <i className="bi bi-calendar-check"></i> Team Leave Approvals
            {stats?.pendingLeaves > 0 && <span className="badge bg-danger ms-1">{stats.pendingLeaves}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}>
            <i className="bi bi-mortarboard"></i> Training & Development
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
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Pending Leaves"
                value={loadingStats ? '...' : stats?.pendingLeaves || 0}
                subtitle="Awaiting manager sign-off"
                icon="bi-hourglass-split"
                iconBg="#ffedd5"
                iconColor="#ea580c"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Active Trainings"
                value={loadingStats ? '...' : stats?.activeTrainings || 0}
                subtitle="Programs in progress / scheduled"
                icon="bi-mortarboard-fill"
                iconBg="#e0e7ff"
                iconColor="#4f46e5"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Present Today"
                value={loadingStats ? '...' : stats?.attendanceToday?.present || 0}
                subtitle={`${stats?.attendanceToday?.wfh || 0} working remotely`}
                icon="bi-check-circle-fill"
                iconBg="#dcfce7"
                iconColor="#16a34a"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Total Staff"
                value={loadingStats ? '...' : stats?.totalEmployees || 0}
                subtitle="Organization members"
                icon="bi-people-fill"
                iconBg="#f3e8ff"
                iconColor="#9333ea"
              />
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-lg-6">
              <div className="card-custom p-4 h-100">
                <h5 className="fw-bold mb-3"><i className="bi bi-check2-square text-primary me-2"></i>Manager Responsibilities</h5>
                <ul className="list-group list-group-flush small">
                  <li className="list-group-item px-0 py-2 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Review and approve or reject employee leave requests with transparent feedback.</span>
                  </li>
                  <li className="list-group-item px-0 py-2 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Plan, launch, and monitor employee training and development initiatives.</span>
                  </li>
                  <li className="list-group-item px-0 py-2 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Broadcast operational and department announcements to team members.</span>
                  </li>
                  <li className="list-group-item px-0 py-2 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Monitor workforce daily attendance patterns to ensure smooth project delivery.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="card-custom p-4 h-100">
                <h5 className="fw-bold mb-3"><i className="bi bi-lightning-charge-fill text-warning me-2"></i>Quick Actions</h5>
                <div className="d-grid gap-2">
                  <button className="btn btn-outline-primary text-start p-3 rounded-3" onClick={() => setActiveTab('leaves')}>
                    <div className="fw-bold"><i className="bi bi-file-earmark-check me-2"></i>Review Team Leave Requests</div>
                    <div className="small text-muted">{stats?.pendingLeaves || 0} pending applications</div>
                  </button>
                  <button className="btn btn-outline-info text-start p-3 rounded-3 text-dark" onClick={() => setActiveTab('training')}>
                    <div className="fw-bold"><i className="bi bi-mortarboard me-2"></i>Manage Training Programs</div>
                    <div className="small text-muted">Enroll employees, assign mentors, and track completion</div>
                  </button>
                  <button className="btn btn-outline-success text-start p-3 rounded-3" onClick={() => { setActiveTab('announcements'); setShowAnnouncementModal(true); }}>
                    <div className="fw-bold"><i className="bi bi-megaphone me-2"></i>Post Team Notice</div>
                    <div className="small text-muted">Send updates directly to company notice board</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEAVE APPROVALS */}
      {activeTab === 'leaves' && (
        <div className="card-custom p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1">Team Leave Approvals</h5>
              <p className="text-muted small mb-0">Evaluate team member time-off requests with approval notes.</p>
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
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reviewer Comments</th>
                  <th className="text-end">Decision</th>
                </tr>
              </thead>
              <tbody>
                {loadingLeaves ? (
                  <tr><td colSpan="7" className="text-center py-4 text-muted">Loading leave requests...</td></tr>
                ) : leaves.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-4 text-muted">No leave requests found.</td></tr>
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
                        {leave.reviewComments ? `"${leave.reviewComments}"` : 'Pending review'}
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

      {/* TAB 3: TRAINING & DEVELOPMENT */}
      {activeTab === 'training' && (
        <div className="card-custom p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1">Training & Professional Development</h5>
              <p className="text-muted small mb-0">Organize skill workshops, enroll team members, and track progress.</p>
            </div>
            <button className="btn btn-primary-custom btn-sm d-flex align-items-center gap-1" onClick={() => setShowTrainingModal(true)}>
              <i className="bi bi-plus-circle-fill"></i>
              <span>Create Program</span>
            </button>
          </div>

          <div className="row g-4">
            {loadingTrainings ? (
              <div className="col-12 text-center py-4 text-muted">Loading training programs...</div>
            ) : trainings.length === 0 ? (
              <div className="col-12 text-center py-4 text-muted">No training programs scheduled. Create one above!</div>
            ) : (
              trainings.map((prog) => (
                <div className="col-12 col-lg-6" key={prog._id}>
                  <div className="card-custom p-4 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className={`badge ${
                          prog.status === 'Ongoing' ? 'bg-primary-subtle text-primary' :
                          prog.status === 'Completed' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'
                        }`}>
                          {prog.status}
                        </span>
                        <span className="small text-muted">
                          <i className="bi bi-calendar-range me-1"></i>
                          {new Date(prog.startDate).toLocaleDateString()} - {new Date(prog.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{prog.title}</h6>
                      <p className="text-secondary small mb-3">{prog.description}</p>
                      <div className="p-2 bg-light rounded-2 small mb-3">
                        <div><strong>Trainer:</strong> {prog.trainer}</div>
                        <div><strong>Department:</strong> {prog.department}</div>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="small fw-semibold text-dark">Enrolled Participants ({prog.participants?.length || 0})</span>
                          <button
                            className="btn btn-link btn-sm p-0 text-decoration-none"
                            onClick={() => { setEnrollModalTraining(prog); setSelectedEmpToEnroll(''); }}
                          >
                            + Enroll Employee
                          </button>
                        </div>
                        {prog.participants?.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {prog.participants.map((part, idx) => (
                              <span key={idx} className="badge bg-white text-dark border py-1 px-2">
                                {part.employee?.firstName} {part.employee?.lastName} ({part.completionStatus})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted small">No participants enrolled yet.</div>
                        )}
                      </div>
                    </div>

                    <div className="d-flex gap-2 pt-3 border-top">
                      {prog.status !== 'Ongoing' && (
                        <button
                          className="btn btn-sm btn-outline-primary flex-grow-1"
                          onClick={() => handleUpdateTrainingStatus(prog._id, 'Ongoing')}
                        >
                          Mark Ongoing
                        </button>
                      )}
                      {prog.status !== 'Completed' && (
                        <button
                          className="btn btn-sm btn-outline-success flex-grow-1"
                          onClick={() => handleUpdateTrainingStatus(prog._id, 'Completed')}
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="card-custom p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <div>
              <h5 className="fw-bold mb-1">Announcements & Notices</h5>
              <p className="text-muted small mb-0">Publish internal team communications and read organizational news.</p>
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
                  <div className="card-custom p-3 border-start border-4 border-info">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-info-subtle text-info">{ann.category}</span>
                        <span className="badge bg-light text-muted border">Audience: {ann.targetAudience}</span>
                        <span className="text-muted small">{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
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

      {/* MODAL: REVIEW LEAVE */}
      {reviewModalLeave && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Review Team Leave Request</h5>
                <button type="button" className="btn-close" onClick={() => setReviewModalLeave(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="p-3 bg-light rounded-3 mb-3 small">
                  <div><strong>Employee:</strong> {reviewModalLeave.employee?.firstName} {reviewModalLeave.employee?.lastName}</div>
                  <div><strong>Leave Type:</strong> {reviewModalLeave.leaveType}</div>
                  <div>
                    <strong>Dates:</strong> {new Date(reviewModalLeave.startDate).toLocaleDateString()} to {new Date(reviewModalLeave.endDate).toLocaleDateString()}
                  </div>
                  <div className="mt-2"><strong>Reason:</strong> {reviewModalLeave.reason}</div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Decision</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="mgrApprove"
                        value="Approved"
                        checked={reviewAction === 'Approved'}
                        onChange={(e) => setReviewAction(e.target.value)}
                      />
                      <label className="form-check-label fw-semibold text-success" htmlFor="mgrApprove">
                        Approve Leave
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="mgrReject"
                        value="Rejected"
                        checked={reviewAction === 'Rejected'}
                        onChange={(e) => setReviewAction(e.target.value)}
                      />
                      <label className="form-check-label fw-semibold text-danger" htmlFor="mgrReject">
                        Reject Leave
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Manager Feedback / Handover Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter approval comments or rejection reason..."
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

      {/* MODAL: CREATE TRAINING PROGRAM */}
      {showTrainingModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Create Training & Skill Program</h5>
                <button type="button" className="btn-close" onClick={() => setShowTrainingModal(false)}></button>
              </div>
              <form onSubmit={handleCreateTraining}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Program Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Advanced System Design & API Security"
                      value={trainingFormData.title}
                      onChange={(e) => setTrainingFormData({ ...trainingFormData, title: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Trainer / Instructor Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Dr. Robert Vance"
                      value={trainingFormData.trainer}
                      onChange={(e) => setTrainingFormData({ ...trainingFormData, trainer: e.target.value })}
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Target Department</label>
                      <input
                        type="text"
                        className="form-control"
                        value={trainingFormData.department}
                        onChange={(e) => setTrainingFormData({ ...trainingFormData, department: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Initial Status</label>
                      <select
                        className="form-select"
                        value={trainingFormData.status}
                        onChange={(e) => setTrainingFormData({ ...trainingFormData, status: e.target.value })}
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={trainingFormData.startDate}
                        onChange={(e) => setTrainingFormData({ ...trainingFormData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">End Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={trainingFormData.endDate}
                        onChange={(e) => setTrainingFormData({ ...trainingFormData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Program Description *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      required
                      placeholder="Overview of the curriculum, objectives, and prerequisites..."
                      value={trainingFormData.description}
                      onChange={(e) => setTrainingFormData({ ...trainingFormData, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light" onClick={() => setShowTrainingModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom">
                    Launch Program
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENROLL EMPLOYEE */}
      {enrollModalTraining && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Enroll Participant</h5>
                <button type="button" className="btn-close" onClick={() => setEnrollModalTraining(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <span className="small text-muted">Program:</span>
                  <div className="fw-bold">{enrollModalTraining.title}</div>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Select Employee to Enroll</label>
                  <select
                    className="form-select"
                    value={selectedEmpToEnroll}
                    onChange={(e) => setSelectedEmpToEnroll(e.target.value)}
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId} - {emp.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-light" onClick={() => setEnrollModalTraining(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary-custom"
                  disabled={!selectedEmpToEnroll}
                  onClick={handleEnrollEmployee}
                >
                  Enroll Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ANNOUNCEMENT */}
      {showAnnouncementModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Publish Announcement</h5>
                <button type="button" className="btn-close" onClick={() => setShowAnnouncementModal(false)}></button>
              </div>
              <form onSubmit={handleCreateAnnouncement}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Sprint Goals Alignment"
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
                        <option value="Policy Update">Policy Update</option>
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
                        <option value="Employee">Team Employees</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Message *</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      required
                      placeholder="Write message details..."
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
                    Post Notice
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

export default ManagerDashboard;
