import { NavLink } from "react-router-dom";

type NavItem = { to: string; label: string };

// TODO(auth-context-routes): show only the links the signed-in user's roles allow
// (Requestor, PillarLead, Approver, Admin, Viewer). For now every link is listed.
const links: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/proposals", label: "My proposals" },
  { to: "/review", label: "Review queue" },
  { to: "/calendar", label: "Calendar" },
  { to: "/templates", label: "Templates" },
  { to: "/admin/members", label: "Members" },
  { to: "/admin/roles", label: "Roles" },
  { to: "/login", label: "Login" },
];

export default function NavBar() {
  return (
    <nav aria-label="Main" className="flex flex-wrap justify-center gap-x-5 gap-y-2 px-6 py-3">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/"}
          className={({ isActive }) =>
            isActive ? "font-semibold text-[#1a1340] underline" : "text-[#4b4763] hover:underline"
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
