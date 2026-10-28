import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login?reason=not-staff" replace />;
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
