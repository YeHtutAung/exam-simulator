import path from "node:path";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { computeQuestionCrops, cropQuestionImages, type QuestionCrop } from "@/lib/importer/pdfQuestionCropper";

type Params = {
  params: Promise<{
    draftId: string;
    draftQuestionId: string;
  }>;
};

export async function POST(_request: Request, { params }: Params) {
  const resolvedParams = await params;
  const draftQuestion = await prisma.importDraftQuestion.findFirst({
    where: {
      id: resolvedParams.draftQuestionId,
      draftId: resolvedParams.draftId,
    },
    include: {
      draft: true,
    },
  });

  if (!draftQuestion?.draft.questionPdfPath) {
    return NextResponse.json({ error: "Draft PDF not found." }, { status: 404 });
  }

  const questionNo = draftQuestion.questionNo;
  const sourcePage = draftQuestion.sourcePage ? Number(draftQuestion.sourcePage) : null;
  if (!sourcePage) {
    return NextResponse.json({ error: "Source page missing." }, { status: 400 });
  }

  const buffer = await fs.readFile(draftQuestion.draft.questionPdfPath);
  const crops = await computeQuestionCrops(buffer, 2);
  let crop = crops.find((entry) => entry.questionNo === questionNo);
  let usedFallback = false;

  const pagesDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "imports",
    resolvedParams.draftId,
    "pages"
  );
  const pageImagePath = path.join(pagesDir, `page-${sourcePage}.png`);

  try {
    await fs.access(pageImagePath);
  } catch {
    return NextResponse.json({ error: "Rendered page image missing." }, { status: 404 });
  }

  if (!crop) {
    const metadata = await sharp(pageImagePath).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (!width || !height) {
      return NextResponse.json({ error: "Page image metadata missing." }, { status: 500 });
    }

    crop = {
      questionNo,
      page: sourcePage,
      box: {
        x: 0,
        y: 0,
        width,
        height,
      },
      fallback: true,
    } satisfies QuestionCrop;
    usedFallback = true;
  }

  const outputDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "imports",
    resolvedParams.draftId,
    "questions"
  );
  const publicRoot = path.join(process.cwd(), "public");
  const outputs = await cropQuestionImages({
    pageImagePath,
    outputDir,
    crops: [crop],
    publicRoot,
    debug: process.env.NODE_ENV === "development",
  });

  const output = outputs[0];
  if (!output) {
    return NextResponse.json({ error: "Crop failed." }, { status: 500 });
  }

  const existingWarnings = Array.isArray(draftQuestion.warnings)
    ? draftQuestion.warnings
    : [];
  const nextWarnings = usedFallback
    ? Array.from(new Set([...existingWarnings, "CROP_FALLBACK_FULL_PAGE"]))
    : existingWarnings;

  await prisma.importDraftQuestion.update({
    where: { id: draftQuestion.id },
    data: {
      stemImageUrl: output.url,
      warnings: nextWarnings.length > 0 ? nextWarnings : undefined,
    },
  });

  return NextResponse.json({ stemImageUrl: output.url });
}
