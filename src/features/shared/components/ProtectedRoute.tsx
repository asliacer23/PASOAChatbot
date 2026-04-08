import { Navigate, useLocation } from "react-router-dom";
import { useAuth, SuspendedPage } from "@/features/auth";
import { PasoaLoadingScreen } from "./PasoaLoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, isSuspended, profile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PasoaLoadingScreen message="Loading your account..." />;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Show suspended page if user is suspended
  if (isSuspended) {
    return <SuspendedPage reason={profile?.suspension_reason} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

