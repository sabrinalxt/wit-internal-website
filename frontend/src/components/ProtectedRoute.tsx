import { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
};

// TODO(auth-context-routes): redirect to /login when signed out and check roles.
// Placeholder: lets everything through for now.
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}
