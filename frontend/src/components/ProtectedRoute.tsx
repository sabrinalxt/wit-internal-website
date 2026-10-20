import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { RoleName } from "../types";

type ProtectedRouteProps = { 
  children: ReactNode; 
  roles?: RoleName[] 
};

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  // Not logged in: go to /login and direct to desired page after login
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Logged but invalid role
  if (roles && !roles.some((role) => user.roles.includes(role))) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">No access</h1>
        <p className="text-[#5c5b73]">You don't have permission to view this page.</p>
      </div>
    );
  }
  // Valid role
  return <>{children}</>;
}