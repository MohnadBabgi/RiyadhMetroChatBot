import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function ProtectedRoute({ children }) {
  const { isAuthenticated, verifyToken } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    const verify = async () => {
      await verifyToken();
      setIsVerifying(false);
    };
    verify();
  }, []);
  
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  return children;
}

export default ProtectedRoute;
