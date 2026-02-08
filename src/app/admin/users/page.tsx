import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { listUsers } from "@/lib/services/users";
import { requireOwner } from "@/lib/rbac";

type PageProps = {
  searchParams?: Promise<{ page?: string; q?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireOwner();
  const resolved = (await searchParams) ?? {};
  const page = Number(resolved.page ?? "1");
  const query = resolved.q?.trim() ?? "";

  const { users, meta } = await listUsers({
    page: Number.isNaN(page) ? 1 : page,
    pageSize: 20,
    query: query || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage user access, roles, and status.
          </p>
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-3" action="/admin/users" method="get">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name or email"
          className="w-full max-w-sm rounded-full border border-sand-300 bg-white px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-sand-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-sand-200">
                <td className="px-4 py-3">
                  <div className="font-semibold">{user.name ?? "Unnamed"}</div>
                  <div className="text-xs text-slate-500">{user.email ?? "-"}</div>
                </td>
                <td className="px-4 py-3 text-xs font-semibold">{user.role}</td>
                <td className="px-4 py-3 text-xs font-semibold">{user.status}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {user.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-xs font-semibold text-accent"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={meta.page}
        totalPages={meta.totalPages}
        makeHref={(pageNumber) => `/admin/users?page=${pageNumber}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
      />
    </div>
  );
}
