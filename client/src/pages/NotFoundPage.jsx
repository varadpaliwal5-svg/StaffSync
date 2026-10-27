import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="d-flex align-items-center justify-content-center text-center py-5" style={{ minHeight: '60vh' }}>
      <div>
        <h1 className="display-1 fw-bold text-primary">404</h1>
        <h3 className="fw-bold text-dark mb-2">Page Not Found</h3>
        <p className="text-muted mb-4">The page or dashboard you are looking for does not exist.</p>
        <Link to="/" className="btn btn-primary-custom px-4 py-2">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
