import type { AuthUser, RoleName } from "../types";

// Which roles may open each page (from the tech doc and the requirements deck).
// One list, used by both the route table (main.tsx) and the nav bar,
// so the two can never disagree. `undefined` means any signed-in user.
export const PAGE_ROLES: Record<string, RoleName[] | undefined> = {
  "/proposals": ["Requestor"],
  "/review": ["PillarLead", "Approver"],
  "/calendar": undefined,
  "/templates": undefined,
  "/admin/members": ["Admin"],
  "/admin/roles": ["Admin"],
};

// True if the user holds at least one of the roles (or no roles are required)
export function hasAnyRole(user: AuthUser | null, roles?: RoleName[]): boolean {
  if (!user) return false;
  if (!roles) return true;
  return roles.some((role) => user.roles.includes(role));
}

// Where "/" sends each user. Tech doc: reviewers go to the Review queue,
// requestors to My proposals. Admins and viewers have neither, so they get
// their own main page instead.
export function homePathFor(user: AuthUser): string {
  if (hasAnyRole(user, ["PillarLead", "Approver"])) return "/review";
  if (hasAnyRole(user, ["Requestor"])) return "/proposals";
  if (hasAnyRole(user, ["Admin"])) return "/admin/members";
  return "/calendar";
}