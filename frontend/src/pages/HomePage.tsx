import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homePathFor } from "../auth/access";

// "/" has no page of its own: it sends each user to their main page (see homePathFor)
export default function HomePage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homePathFor(user)} replace />;
}