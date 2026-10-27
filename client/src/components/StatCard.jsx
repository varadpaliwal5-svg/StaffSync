import React from 'react';

const StatCard = ({ title, value, subtitle, icon, iconBg = '#ede9fe', iconColor = '#4f46e5' }) => {
  return (
    <div className="card-custom p-3 h-100">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="text-muted fw-semibold small text-uppercase" style={{ letterSpacing: '0.04em' }}>
          {title}
        </span>
        <div className="stat-icon-wrapper" style={{ backgroundColor: iconBg, color: iconColor }}>
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
      <div className="fs-3 fw-bold text-dark">{value}</div>
      {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
    </div>
  );
};

export default StatCard;
