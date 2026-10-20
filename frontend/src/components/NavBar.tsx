import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { RoleName } from "../types";

// If `roles` is set, only users with at least one of those roles see the link
type NavItem = { to: string; label: string; roles?: RoleName[] };

const links: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/proposals", label: "My proposals" },
  { to: "/review", label: "Review queue" },
  { to: "/calendar", label: "Calendar" },
  { to: "/templates", label: "Templates" },
  { to: "/admin/members", label: "Members", roles: ["Admin"] },
  { to: "/admin/roles", label: "Roles", roles: ["Admin"] },
];

export default function NavBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Show link if it has no role requirement, or the user has a matching role.
  const visibleLinks = links.filter(
    (link) => !link.roles || link.roles.some((role) => user?.roles.includes(role)),
  );

  function onLogout() {
    signOut(); // clear token
    navigate("/login");
  }

  // Link matches current url
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "font-semibold text-[#1a1340] underline" : "text-[#4b4763] hover:underline";

  return (
    <nav aria-label="Main" className="flex flex-wrap justify-center gap-x-5 gap-y-2 px-6 py-3">
      {visibleLinks.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.to === "/"} className={linkClass}>
          {link.label}
        </NavLink>
      ))}
      {/* Logged in: Logout. Logged out: Login. */}
      {user ? (
        <button
          type="button"
          onClick={onLogout}
          className="text-[#4b4763] hover:underline cursor-pointer"
        >
          Logout
        </button>
      ) : (
        <NavLink to="/login" className={linkClass}>
          Login
        </NavLink>
      )}
    </nav>
  );
}
