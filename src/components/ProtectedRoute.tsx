import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: React.ReactNode;
  allowedRoles?: ("student" | "teacher" | "admin")[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, role, loading } = useAuth();

  // Show spinner while auth + role are being resolved
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not logged in → back to landing
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Role still resolving — keep spinner
  if (role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Teacher/admin trying to access a student-only route → send to teacher panel
  if ((role === "teacher" || role === "admin") && !allowedRoles?.includes("teacher")) {
    return <Navigate to="/teacher" replace />;
  }

  // Student trying to access a teacher-only route → send to dashboard
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
