import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerApi } from "@/lib/rbac";
import { getTopicForQuestion } from "@/lib/topicMapping";

type Params = {
  params: Promise<{
    draftId: string;
  }>;
};

export async function POST(_request: Request, { params }: Params) {
  const authResult = await requireOwnerApi();
  if (!authResult.ok) return authResult.response;
  const { draftId } = await params;

  const draft = await prisma.importDraft.findUnique({
    where: { id: draftId },
    select: { status: true },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  if (draft.status === "PUBLISHED") {
    return NextResponse.json(
      { error: "Cannot modify a published draft." },
      { status: 400 },
    );
  }

  const questions = await prisma.importDraftQuestion.findMany({
    where: { draftId },
    select: { id: true, questionNo: true },
  });

  const totalQuestions = questions.length;

  const updates = questions
    .map((q) => ({
      id: q.id,
      topic: getTopicForQuestion(q.questionNo, totalQuestions),
    }))
    .filter((u) => u.topic !== null);

  await prisma.$transaction(
    updates.map((u) =>
      prisma.importDraftQuestion.update({
        where: { id: u.id },
        data: { topic: u.topic },
      }),
    ),
  );

  return NextResponse.json({ ok: true, count: updates.length });
}
