import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, createApprovedUser, deleteUser, getUsers } from "../api/client";
import type { AdminUser, RoleName } from "../types";

const ALL_ROLES: RoleName[] = ["Requestor", "PillarLead", "Approver", "Admin", "Viewer"];

export default function AdminMembersPage() {
  // Table
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<RoleName[]>(["Viewer"]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Fetch all members 
  async function loadUsers() {
    try {
      setUsers(await getUsers());
      setLoadError(null);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setLoadError("You need to be logged in as an admin to see this page.");
      } else if (err instanceof TypeError) {
        setLoadError("Can't reach the server. Please try again later.");
      } else {
        setLoadError(err instanceof Error ? err.message : "Could not load users.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // Role Checkboxes
  function toggleRole(role: RoleName) {
    setRoles((current) =>
      current.includes(role) ? current.filter((r) => r !== role) : [...current, role],
    );
  }

  // Submit member to approved list
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (roles.length === 0) {
      setFormError("Pick at least one role.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createApprovedUser({
        first_name: firstName,
        last_name: lastName,
        email,
        roles,
      });
      setFormSuccess(`${created.email} can now sign up.`);
      setFirstName("");
      setLastName("");
      setEmail("");
      setRoles(["Viewer"]);
      await loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not add user.");
    } finally {
      setSubmitting(false);
    }
  }

  // Delete function only shows for pending users
  async function onDelete(user: AdminUser) {
    if (!window.confirm(`Remove ${user.email} from the approved list?`)) return;
    try {
      await deleteUser(user.user_id);
      await loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete user.");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[#d7cff7] bg-[#faf8ff] px-3 py-2 outline-none focus:border-[#5a34ea]";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="accent-purple text-2xl font-bold mb-6">Members</h1>

      {/* Add approved user */}
      <section className="bg-white rounded-xl shadow-soft border border-slate-100 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-1">Add approved user</h2>
        <p className="text-sm text-[#5c5b73] mb-4">
          They can then create their account at /signup using this email.
        </p>

        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="first" className="text-[13px] text-[#4b4763]">
              First name
            </label>
            <input
              id="first"
              className={inputClass}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="last" className="text-[13px] text-[#4b4763]">
              Last name
            </label>
            <input
              id="last"
              className={inputClass}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="email" className="text-[13px] text-[#4b4763]">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <fieldset className="sm:col-span-2">
            <legend className="text-[13px] text-[#4b4763] mb-1">Roles</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {ALL_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={roles.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  {role}
                </label>
              ))}
            </div>
          </fieldset>

          {formError && (
            <p
              role="alert"
              className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {formError}
            </p>
          )}
          {formSuccess && (
            <p
              role="status"
              className="sm:col-span-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
            >
              {formSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 rounded-lg bg-purple-accent text-white font-semibold py-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding…" : "Add to approved list"}
          </button>
        </form>
      </section>

      {/* Users table */}
      <section className="bg-white rounded-xl shadow-soft border border-slate-100 p-6">
        <h2 className="text-lg font-semibold mb-4">All members</h2>

        {loading && <p className="text-[#5c5b73]">Loading…</p>}

        {loadError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}{" "}
            <Link to="/login" className="underline">
              Log in
            </Link>
          </p>
        )}

        {!loading && !loadError && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#4b4763] border-b border-slate-200">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Roles</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="py-2 pr-4">{user.email}</td>
                    <td className="py-2 pr-4">{user.roles.join(", ")}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      {user.status === "pending" && (
                        <button
                          onClick={() => onDelete(user)}
                          className="text-red-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
