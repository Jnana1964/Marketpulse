import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-sm text-[var(--color-text-muted)]">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
