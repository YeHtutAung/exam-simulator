import path from "node:path";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    draftId: string;
    draftQuestionId: string;
  }>;
};

const MIN_WIDTH = 150;
const MIN_HEIGHT = 80;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toFilePath(publicRoot: string, url: string) {
  const normalized = url.replace(/^\/+/, "");
  return path.join(publicRoot, normalized);
}

export async function POST(request: Request, { params }: Params) {
  const resolvedParams = await params;
  const payload = await request.json().catch(() => null);
  const x = Number(payload?.x);
  const y = Number(payload?.y);
  const width = Number(payload?.width);
  const height = Number(payload?.height);

  if (![x, y, width, height].every((value) => Number.isFinite(value))) {
    return NextResponse.json({ error: "Invalid crop payload." }, { status: 400 });
  }
  if (![x, y, width, height].every((value) => Number.isInteger(value))) {
    return NextResponse.json({ error: "Crop values must be integers." }, { status: 400 });
  }
  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    return NextResponse.json(
      {
        error: `Crop must be at least ${MIN_WIDTH}x${MIN_HEIGHT} pixels.`,
      },
      { status: 400 }
    );
  }

  const draftQuestion = await prisma.importDraftQuestion.findFirst({
    where: {
      id: resolvedParams.draftQuestionId,
      draftId: resolvedParams.draftId,
    },
    include: {
      draft: true,
    },
  });

  if (!draftQuestion) {
    return NextResponse.json({ error: "Draft question not found." }, { status: 404 });
  }

  if (!draftQuestion.sourcePage) {
    return NextResponse.json({ error: "Source page missing." }, { status: 400 });
  }

  const publicRoot = path.join(process.cwd(), "public");
  const fallbackUrl = `/uploads/imports/${resolvedParams.draftId}/pages/page-${draftQuestion.sourcePage}.png`;
  const pageImageUrl = draftQuestion.pageImageUrl ?? fallbackUrl;
  const pageImagePath = toFilePath(publicRoot, pageImageUrl);

  try {
    await fs.access(pageImagePath);
  } catch {
    return NextResponse.json({ error: "Rendered page image missing." }, { status: 404 });
  }

  const metadata = await sharp(pageImagePath).metadata();
  const imageWidth = metadata.width ?? 0;
  const imageHeight = metadata.height ?? 0;
  if (!imageWidth || !imageHeight) {
    return NextResponse.json({ error: "Page image metadata missing." }, { status: 500 });
  }

  const left = clamp(x, 0, Math.max(0, imageWidth - 1));
  const top = clamp(y, 0, Math.max(0, imageHeight - 1));
  const right = clamp(x + width, left + 1, imageWidth);
  const bottom = clamp(y + height, top + 1, imageHeight);
  const cropWidth = right - left;
  const cropHeight = bottom - top;

  if (cropWidth < MIN_WIDTH || cropHeight < MIN_HEIGHT) {
    return NextResponse.json(
      { error: "Crop area is too small or outside the page image." },
      { status: 400 }
    );
  }

  const outputDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "imports",
    resolvedParams.draftId,
    "questions"
  );
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `q-${draftQuestion.questionNo}.png`);

  await sharp(pageImagePath)
    .extract({
      left,
      top,
      width: cropWidth,
      height: cropHeight,
    })
    .toFile(outputPath);

  let urlPath = outputPath.replace(publicRoot, "").split(path.sep).join("/");
  if (!urlPath.startsWith("/")) {
    urlPath = `/${urlPath}`;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const existingWarnings = Array.isArray(draftQuestion.warnings)
      ? draftQuestion.warnings.filter((entry) => entry !== "CROP_FALLBACK_FULL_PAGE")
      : [];

    const updatedQuestion = await tx.importDraftQuestion.update({
      where: { id: draftQuestion.id },
      data: {
        stemImageUrl: urlPath,
        cropX: left,
        cropY: top,
        cropW: cropWidth,
        cropH: cropHeight,
        cropScale: draftQuestion.cropScale ?? null,
        warnings: existingWarnings.length > 0 ? existingWarnings : null,
      },
      select: {
        id: true,
        stemImageUrl: true,
        cropX: true,
        cropY: true,
        cropW: true,
        cropH: true,
        warnings: true,
      },
    });

    const draft = await tx.importDraft.findUnique({
      where: { id: draftQuestion.draftId },
      include: { questions: { select: { questionNo: true, warnings: true } } },
    });

    if (draft && draft.status !== "PUBLISHED") {
      const warningEntries: string[] = [];
      for (const question of draft.questions) {
        if (Array.isArray(question.warnings)) {
          for (const warning of question.warnings) {
            warningEntries.push(`Q${question.questionNo}: ${warning}`);
          }
        }
      }

      await tx.importDraft.update({
        where: { id: draft.id },
        data: {
          status: warningEntries.length > 0 ? "NEEDS_REVIEW" : "READY_TO_PUBLISH",
          warnings: warningEntries.length > 0 ? warningEntries : null,
        },
      });
    }

    return updatedQuestion;
  });

  return NextResponse.json(updated);
}
