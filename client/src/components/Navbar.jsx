import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'hr') return '/hr';
    if (user.role === 'manager') return '/manager';
    return '/employee';
  };

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'hr') {
      return <span className="badge-role-hr"><i className="bi bi-shield-check me-1"></i>HR Administrator</span>;
    }
    if (user.role === 'manager') {
      return <span className="badge-role-manager"><i className="bi bi-briefcase me-1"></i>Team Manager</span>;
    }
    return <span className="badge-role-employee"><i className="bi bi-person me-1"></i>Employee</span>;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-2 px-3 shadow-sm">
      <div className="container-fluid max-w-7xl">
        <Link className="navbar-brand d-flex align-items-center gap-2 text-decoration-none fw-bold" to={getDashboardPath()}>
          <div className="brand-icon">
            <i className="bi bi-people-fill"></i>
          </div>
          <div>
            <span className="fs-5 text-dark fw-bold">Staff<span className="text-primary">Sync</span></span>
            <span className="d-block text-muted" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>HR MANAGEMENT SYSTEM</span>
          </div>
        </Link>

        {isAuthenticated && user && (
          <div className="d-flex align-items-center gap-3 ms-auto">
            <div className="d-none d-md-flex flex-column text-end">
              <span className="fw-semibold text-dark small">{user.name}</span>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                {user.employee?.department || user.email}
              </span>
            </div>

            <div className="d-none d-sm-block">
              {getRoleBadge()}
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 px-3 py-1.5"
              style={{ borderRadius: '8px', fontWeight: 500 }}
              title="Sign Out"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
