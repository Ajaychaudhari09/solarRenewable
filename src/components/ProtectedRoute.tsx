import React from 'react';
import { useAuth } from '../context/AuthContext';
import AccessDenied from '../pages/AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'operator' | 'viewer')[];
  onNavigate?: (tab: string) => void;
  onRequireLogin?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  onNavigate,
  onRequireLogin,
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs text-slate-500">Authenticating GridPulse session...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (onRequireLogin) {
      onRequireLogin();
    }
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <AccessDenied requiredRole={allowedRoles.join(' or ')} onNavigate={onNavigate} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
