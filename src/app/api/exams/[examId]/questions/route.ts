import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validators/question";

type RouteContext = {
  params: Promise<{ examId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const resolvedParams = await context.params;
  const questions = await prisma.question.findMany({
    where: { examId: resolvedParams.examId },
    include: { choices: true, attachments: true },
    orderBy: { questionNo: "asc" },
  });

  return NextResponse.json(questions);
}

export async function POST(request: Request, context: RouteContext) {
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

  const question = await prisma.question.create({
    data: {
      examId: resolvedParams.examId,
      ...questionData,
      choices: choices && choices.length > 0 ? { create: choices } : undefined,
      attachments:
        attachments && attachments.length > 0 ? { create: attachments } : undefined,
    },
  });

  return NextResponse.json(question, { status: 201 });
}
