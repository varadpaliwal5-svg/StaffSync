import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      const role = result.user.role;
      if (role === 'hr') navigate('/hr');
      else if (role === 'manager') navigate('/manager');
      else navigate('/employee');
    } else {
      setError(result.message || 'Login failed. Invalid credentials.');
    }
  };

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center py-5 px-3"
      style={{
        minHeight: 'calc(100vh - 65px)',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
      }}
    >
      <div className="card-custom bg-white p-4 p-md-5 shadow-lg" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="text-center mb-4">
          <div className="brand-icon mx-auto mb-3" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
            <i className="bi bi-people-fill"></i>
          </div>
          <h3 className="fw-bold text-dark mb-1">StaffSync</h3>
          <p className="text-muted small">Human Resource Management Solution</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Work Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control border-start-0"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type="password"
                className="form-control border-start-0"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary-custom w-100 py-2 d-flex align-items-center justify-content-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <i className="bi bi-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-top">
          <p className="text-muted small text-center mb-2 fw-semibold">
            <i className="bi bi-lightning-charge-fill text-warning me-1"></i>
            One-Click Demo Credentials
          </p>
          <div className="d-grid gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex justify-content-between align-items-center px-3 py-1.5"
              style={{ borderRadius: '8px' }}
              onClick={() => fillDemoAccount('hr@staffsync.com', 'Password123!')}
            >
              <span><i className="bi bi-shield-lock me-1"></i> HR Administrator</span>
              <span className="badge bg-primary-subtle text-primary">hr@staffsync.com</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-info d-flex justify-content-between align-items-center px-3 py-1.5"
              style={{ borderRadius: '8px' }}
              onClick={() => fillDemoAccount('manager@staffsync.com', 'Password123!')}
            >
              <span><i className="bi bi-briefcase me-1"></i> Team Manager</span>
              <span className="badge bg-info-subtle text-dark">manager@staffsync.com</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex justify-content-between align-items-center px-3 py-1.5"
              style={{ borderRadius: '8px' }}
              onClick={() => fillDemoAccount('employee@staffsync.com', 'Password123!')}
            >
              <span><i className="bi bi-person me-1"></i> Employee</span>
              <span className="badge bg-secondary-subtle text-dark">employee@staffsync.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
