import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const authResult = await requireUserApi();
  if (!authResult.ok) return authResult.response;

  const body = await request.json().catch(() => null);
  const payload =
    body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const examIdCandidate =
    typeof payload.examId === "string" && payload.examId.length > 0
      ? payload.examId
      : null;
  const examId =
    examIdCandidate && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(examIdCandidate)
      ? examIdCandidate
      : null;
  const mode =
    payload.mode === "EXAM" || payload.mode === "RANDOM" || payload.mode === "TOPIC"
      ? payload.mode
      : undefined;
  const totalQuestions =
    Number.isInteger(payload.totalQuestions) && payload.totalQuestions > 0
      ? payload.totalQuestions
      : 0;
  const metadata =
    payload.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)
      ? (payload.metadata as Record<string, unknown>)
      : undefined;

  const attempt = await prisma.attempt.create({
    data: {
      userId: authResult.session.user.id,
      examId,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      totalQuestions,
      metadata: metadata
        ? { ...metadata, mode }
        : mode
          ? { mode }
          : undefined,
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
    },
  });

  return NextResponse.json({ attempt });
}
