import Link from "next/link";
import { requireOwner } from "@/lib/rbac";

export default async function OwnerDashboardPage() {
  await requireOwner();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">Owner Portal</p>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage exams, questions, users, and imports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/owner/exams"
          className="rounded-2xl border border-sand-300 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm font-semibold">Manage Exams</p>
          <p className="mt-2 text-xs text-slate-500">Create, edit, and remove exams.</p>
        </Link>
        <Link
          href="/owner/questions"
          className="rounded-2xl border border-sand-300 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm font-semibold">Manage Questions</p>
          <p className="mt-2 text-xs text-slate-500">Browse and update questions.</p>
        </Link>
        <Link
          href="/owner/users"
          className="rounded-2xl border border-sand-300 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm font-semibold">Manage Users</p>
          <p className="mt-2 text-xs text-slate-500">Roles, status, and access.</p>
        </Link>
      </div>

      <div className="rounded-2xl border border-sand-300 bg-white p-5">
        <p className="text-sm font-semibold">Quick links</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/owner/exams" className="font-semibold text-accent">
            Exams
          </Link>
          <Link href="/owner/users" className="font-semibold text-accent">
            Users
          </Link>
          <Link href="/owner/import" className="font-semibold text-accent">
            Import drafts
          </Link>
        </div>
      </div>
    </div>
  );
}
