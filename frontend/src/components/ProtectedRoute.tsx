import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { HeartPulse } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { token, user, isLoading, loadUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (token && !user && !isLoading) {
      loadUser();
    }
  }, [token, user, isLoading, loadUser]);

  if (isLoading && !user && token) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex flex-col items-center justify-center font-sans">
        <div className="p-4 bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center">
          <HeartPulse className="w-12 h-12 text-[#2585D8] animate-pulse mb-3" />
          <p className="text-sm font-bold text-gray-700">Chargement de votre session médicale...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      // Redirect to their respective authorized portal
      if (user.role === 'PATIENT') return <Navigate to="/patient" replace />;
      if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
      if (user.role === 'PHARMACY') return <Navigate to="/pharmacy" replace />;
      if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
      if (user.role === 'EMPLOYEE') return <Navigate to="/employee" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
