import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/rbac";

export default async function OwnerQuestionsPage() {
  await requireOwner();
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-slate-500">Owner Portal</p>
        <h1 className="text-2xl font-semibold">Questions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Select an exam to manage its questions.
        </p>
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
            <Link
              href={`/owner/exams/${exam.id}/questions`}
              className="text-xs font-semibold text-accent"
            >
              Manage questions
            </Link>
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
