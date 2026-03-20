import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: React.ReactNode;
  allowedRoles?: ("student" | "teacher" | "admin")[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If teacher/admin tries to access a student-only page, redirect to teacher panel
  if ((role === "teacher" || role === "admin") && !allowedRoles?.includes("teacher")) {
    return <Navigate to="/teacher" replace />;
  }

  // If user doesn't have the required role for this route
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

