import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-sand-300 bg-white px-6 py-8 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Japanese FE exam practice
            </p>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              Study smarter with fast search, clean layouts, and focused question review.
            </h1>
            <p className="text-sm text-slate-600">
              Browse the latest exams or jump straight into a keyword search. Built for
              read-heavy practice sessions.
            </p>
          </div>
          <form
            action="/search"
            method="get"
            className="space-y-3 rounded-2xl border border-sand-300 bg-sand px-4 py-5"
          >
            <label className="text-sm font-medium">Keyword</label>
            <input
              name="query"
              placeholder="例: TCP/IP, データベース..."
              className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
            />
            <label className="text-sm font-medium">Exam (optional)</label>
            <select
              name="examId"
              className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All exams</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.session} {exam.paper} - {exam.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
            >
              Search questions
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Latest exams</h2>
          <Link href="/search" className="text-sm font-semibold text-accent">
            Browse all questions
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              href={`/exams/${exam.id}`}
              className="rounded-2xl border border-sand-300 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase text-slate-500">
                {exam.session} {exam.paper}
              </p>
              <p className="mt-2 text-lg font-semibold">{exam.title}</p>
              <p className="mt-1 text-sm text-slate-600">{exam.language}</p>
            </Link>
          ))}
          {exams.length === 0 && (
            <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-6 text-sm text-slate-500">
              No exams yet. Add one in the admin dashboard.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
