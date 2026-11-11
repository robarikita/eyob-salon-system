import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'CUSTOMER' | 'EMPLOYEE' | 'BRANCH_ADMIN' | 'OWNER'>;
  requiredPermission?: string;
  requiredPermissions?: string[];
  redirectUnauthenticatedTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  requiredPermissions,
  redirectUnauthenticatedTo,
}) => {
  const { user, isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0B09] flex items-center justify-center text-[#D4AF37]">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    let fallback = redirectUnauthenticatedTo;
    if (!fallback) {
      if (allowedRoles && allowedRoles.length === 1 && allowedRoles[0] === 'EMPLOYEE') {
        fallback = '/staff/login';
      } else {
        fallback = '/login';
      }
    }
    return <Navigate to={fallback} state={{ from: location }} replace />;
  }

  // Permission and role authorization logic
  const hasRoleAccess = !allowedRoles || allowedRoles.includes(user.role);
  const hasPermAccess = !requiredPermission || hasPermission(requiredPermission);
  const hasPermsAccess = !requiredPermissions || requiredPermissions.some((p) => hasPermission(p));

  const isAuthorized = user.role === 'OWNER' || (hasRoleAccess && hasPermAccess && hasPermsAccess);

  if (!isAuthorized) {
    // Redirect to the appropriate portal for the user's role
    if (user.role === 'EMPLOYEE') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    if (user.role === 'BRANCH_ADMIN' || user.role === 'OWNER') {
      return <Navigate to="/admin/appointments" replace />;
    }
    return <Navigate to="/my-bookings" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

