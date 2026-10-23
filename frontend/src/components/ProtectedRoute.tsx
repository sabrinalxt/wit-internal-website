import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasAnyRole } from "../auth/access";
import type { RoleName } from "../types";

type ProtectedRouteProps = {
  children: ReactNode;
  roles?: RoleName[] | undefined;
};

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  // Not logged in: go to /login, then come back here after logging in
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Logged in but without a role this page needs
  if (!hasAnyRole(user, roles)) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">No access</h1>
        <p className="text-[#5c5b73] mb-4">You don't have permission to view this page.</p>
        <Link to="/" className="text-[#5a34ea] hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

// For /login and /signup: a signed-in user has no reason to be here, so send them home
export function GuestRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}