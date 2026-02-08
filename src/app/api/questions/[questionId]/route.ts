import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validators/question";
import { requireOwnerApi } from "@/lib/rbac";

type RouteContext = {
  params: Promise<{ questionId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const authResult = await requireOwnerApi();
  if (!authResult.ok) return authResult.response;
  const resolvedParams = await context.params;
  const question = await prisma.question.findUnique({
    where: { id: resolvedParams.questionId },
    include: { choices: true, attachments: true, exam: true },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  return NextResponse.json(question);
}

export async function PUT(request: Request, context: RouteContext) {
  const authResult = await requireOwnerApi();
  if (!authResult.ok) return authResult.response;
  const resolvedParams = await context.params;
  const body = await request.json();
  const parsed = questionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid question payload." }, { status: 400 });
  }

  const { choices, attachments, ...questionData } = parsed.data;

  if (questionData.type === "MCQ_SINGLE") {
    const labels = new Set((choices ?? []).map((choice) => choice.label));
    const required = ["a", "b", "c", "d"];
    if (required.some((label) => !labels.has(label))) {
      return NextResponse.json({ error: "MCQ choices must include a-d." }, { status: 400 });
    }
    if (!required.includes(questionData.correctAnswer)) {
      return NextResponse.json(
        { error: "Correct answer must match one of the choices (a-d)." },
        { status: 400 }
      );
    }
  }

  try {
    const question = await prisma.question.update({
      where: { id: resolvedParams.questionId },
      data: {
        ...questionData,
        choices: {
          deleteMany: {},
          create: choices && choices.length > 0 ? choices : [],
        },
        attachments: {
          deleteMany: {},
          create: attachments && attachments.length > 0 ? attachments : [],
        },
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update question." }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const authResult = await requireOwnerApi();
  if (!authResult.ok) return authResult.response;
  const resolvedParams = await context.params;
  try {
    await prisma.question.delete({ where: { id: resolvedParams.questionId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete question." }, { status: 400 });
  }
}
