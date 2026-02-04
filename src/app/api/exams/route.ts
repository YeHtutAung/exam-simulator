import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { examSchema } from "@/lib/validators/exam";

export async function GET() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = examSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid exam payload." }, { status: 400 });
  }

  const exam = await prisma.exam.create({
    data: {
      ...parsed.data,
      code: parsed.data.code?.trim() || null,
    },
  });

  return NextResponse.json(exam, { status: 201 });
}
