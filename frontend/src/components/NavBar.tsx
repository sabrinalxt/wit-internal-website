import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasAnyRole, PAGE_ROLES } from "../auth/access";

type NavItem = { to: string; label: string };

const links: NavItem[] = [
  { to: "/proposals", label: "My proposals" },
  { to: "/review", label: "Review queue" },
  { to: "/calendar", label: "Calendar" },
  { to: "/templates", label: "Templates" },
  { to: "/admin/members", label: "Members" },
  { to: "/admin/roles", label: "Roles" },
];

export default function NavBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Signed out: no links. Signed in: only the pages the user's roles allow.
  // There is no "Home" link: the logo in the header goes to "/", which redirects by role.
  const visibleLinks = links.filter((link) => hasAnyRole(user, PAGE_ROLES[link.to]));

  function onLogout() {
    signOut();
    navigate("/login", { replace: true });
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "font-semibold text-[#1a1340] underline" : "text-[#4b4763] hover:underline";

  return (
    <nav
      aria-label="Main"
      className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 py-3"
    >
      {visibleLinks.map((link) => (
        <NavLink key={link.to} to={link.to} className={linkClass}>
          {link.label}
        </NavLink>
      ))}

      {user ? (
        <>
          <span className="text-sm text-[#5c5b73]">Hi, {user.first_name}</span>
          <button
            type="button"
            onClick={onLogout}
            className="text-[#4b4763] hover:underline cursor-pointer"
          >
            Logout
          </button>
        </>
      ) : (
        <NavLink to="/login" className={linkClass}>
          Login
        </NavLink>
      )}
    </nav>
  );
}