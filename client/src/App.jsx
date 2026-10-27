import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HRDashboard from './pages/HRDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import NotFoundPage from './pages/NotFoundPage';

// Component to handle default root / redirect
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'hr') return <Navigate to="/hr" replace />;
  if (user.role === 'manager') return <Navigate to="/manager" replace />;
  return <Navigate to="/employee" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-vh-100 d-flex flex-column bg-light">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected HR Dashboard */}
              <Route
                path="/hr/*"
                element={
                  <ProtectedRoute allowedRoles={['hr']}>
                    <HRDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Manager Dashboard */}
              <Route
                path="/manager/*"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Employee Dashboard */}
              <Route
                path="/employee/*"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect based on auth */}
              <Route path="/" element={<RootRedirect />} />

              {/* Catch all 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
