import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function AdminExamsPage() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">Admin</p>
          <h1 className="text-2xl font-semibold">Exams</h1>
        </div>
        <Link
          href="/admin/exams/new"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
        >
          New exam
        </Link>
      </div>

      <div className="space-y-3">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sand-300 bg-white p-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                {exam.session} {exam.paper}
              </p>
              <p className="text-sm font-semibold">{exam.title}</p>
              <p className="text-xs text-slate-500">{exam.language}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Link href={`/admin/exams/${exam.id}/questions`} className="font-semibold text-accent">
                Questions
              </Link>
              <Link href={`/admin/exams/${exam.id}/edit`} className="font-semibold text-slate-600">
                Edit
              </Link>
              <DeleteButton url={`/api/exams/${exam.id}`} />
            </div>
          </div>
        ))}
        {exams.length === 0 && (
          <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-6 text-sm text-slate-500">
            No exams yet.
          </div>
        )}
      </div>
    </div>
  );
}
