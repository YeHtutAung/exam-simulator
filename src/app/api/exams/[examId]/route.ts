import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { examSchema } from "@/lib/validators/exam";

type RouteContext = {
  params: { examId: string };
};

export async function GET(_: Request, context: RouteContext) {
  const exam = await prisma.exam.findUnique({
    where: { id: context.params.examId },
  });

  if (!exam) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  return NextResponse.json(exam);
}

export async function PUT(request: Request, context: RouteContext) {
  const body = await request.json();
  const parsed = examSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid exam payload." }, { status: 400 });
  }

  try {
    const exam = await prisma.exam.update({
      where: { id: context.params.examId },
      data: {
        ...parsed.data,
        code: parsed.data.code?.trim() || null,
      },
    });
    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update exam." }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    await prisma.exam.delete({ where: { id: context.params.examId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete exam." }, { status: 400 });
  }
}
