import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";

interface RequireStudentNumberProps {
  children: React.ReactNode;
}

export function RequireStudentNumber({ children }: RequireStudentNumberProps) {
  const { profile, isAdmin } = useAuth();
  const location = useLocation();

  const hasStudentNumber = Boolean(profile?.student_id?.trim() && /^20\d{6}-[A-Z]$/.test(profile.student_id.trim().toUpperCase()));

  if (!isAdmin && !hasStudentNumber) {
    return <Navigate to="/profile" state={{ from: location, reason: "student_number_required" }} replace />;
  }

  return <>{children}</>;
}


