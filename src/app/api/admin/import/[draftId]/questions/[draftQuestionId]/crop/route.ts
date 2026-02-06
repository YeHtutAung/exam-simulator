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
  if (width <= 0 || height <= 0) {
    return NextResponse.json({ error: "Crop dimensions must be positive." }, { status: 400 });
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

  const left = Math.round(x);
  const top = Math.round(y);
  const cropWidth = Math.round(width);
  const cropHeight = Math.round(height);

  const withinBounds =
    left >= 0 &&
    top >= 0 &&
    cropWidth > 0 &&
    cropHeight > 0 &&
    left + cropWidth <= imageWidth &&
    top + cropHeight <= imageHeight;

  if (!withinBounds) {
    return NextResponse.json({ error: "Crop bounds are outside the page image." }, { status: 400 });
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

  await prisma.importDraftQuestion.update({
    where: { id: draftQuestion.id },
    data: {
      stemImageUrl: urlPath,
      cropX: left,
      cropY: top,
      cropW: cropWidth,
      cropH: cropHeight,
      cropScale: draftQuestion.cropScale ?? null,
    },
  });

  return NextResponse.json({ stemImageUrl: urlPath });
}
