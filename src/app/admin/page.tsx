import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/exams"
          className="rounded-2xl border border-sand-300 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm font-semibold">Manage Exams</p>
          <p className="mt-2 text-xs text-slate-500">Create, edit, and remove exams.</p>
        </Link>
        <Link
          href="/admin/import"
          className="rounded-2xl border border-sand-300 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm font-semibold">Import Drafts</p>
          <p className="mt-2 text-xs text-slate-500">
            Upload question and answer PDFs to build a draft.
          </p>
        </Link>
      </div>
    </div>
  );
}
