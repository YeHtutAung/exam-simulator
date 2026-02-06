import { NextResponse } from "next/server";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { prisma } from "@/lib/prisma";

function getFormValue(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function getFormFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return null;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const examId = getFormValue(formData, "examId");
  const questionPdf = getFormFile(formData, "questionPdf");
  const answerPdf = getFormFile(formData, "answerPdf");

  if (!examId) {
    return NextResponse.json({ error: "Exam is required." }, { status: 400 });
  }

  if (!questionPdf || !answerPdf) {
    return NextResponse.json(
      { error: "Missing required files: questionPdf and answerPdf." },
      { status: 400 }
    );
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  });

  if (!exam) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  const draft = await prisma.importDraft.create({
    data: {
      title: exam.title,
      session: exam.session,
      paper: exam.paper,
      language: exam.language,
      status: "PARSING",
      stage: "UPLOAD",
      progressInt: 0,
    },
  });

  try {
    const [questionBuffer, answerBuffer] = await Promise.all([
      questionPdf.arrayBuffer(),
      answerPdf.arrayBuffer(),
    ]);
    const baseDir = path.join(os.tmpdir(), "exam-import", draft.id);
    await fs.mkdir(baseDir, { recursive: true });

    const questionPath = path.join(baseDir, "question.pdf");
    const answerPath = path.join(baseDir, "answer.pdf");
    await Promise.all([
      fs.writeFile(questionPath, Buffer.from(questionBuffer)),
      fs.writeFile(answerPath, Buffer.from(answerBuffer)),
    ]);

    await prisma.importDraft.update({
      where: { id: draft.id },
      data: {
        questionPdfPath: questionPath,
        answerPdfPath: answerPath,
      },
    });
  } catch (error) {
    await prisma.importDraft.update({
      where: { id: draft.id },
      data: {
        status: "FAILED",
        errors: [
          error instanceof Error ? error.message : "Unknown import error.",
        ],
        finishedAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: "Failed to save import files." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    draftId: draft.id,
  });
}
