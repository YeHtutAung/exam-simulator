import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

type Marker = {
  questionNo: number;
  y: number;
};

type CropBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type QuestionCrop = {
  questionNo: number;
  page: number;
  box: CropBox;
  fallback?: boolean;
};

const QUESTION_REGEX = /\bQ\s*(\d+)\./i;

const MARGIN_TOP = 12;
const MARGIN_BOTTOM = 14;
const MARGIN_X = 12;
const FOOTER_MARGIN = 30;
const MIN_CROP_HEIGHT = 80;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function toPixelY(viewportHeight: number, pdfY: number) {
  return viewportHeight - pdfY;
}

function findQuestionMarkers(items: any[], viewportHeight: number): Marker[] {
  const markers: Marker[] = [];
  for (const item of items) {
    if (!("str" in item) || !item.transform) {
      continue;
    }
    const text = String(item.str).trim();
    const match = text.match(QUESTION_REGEX);
    if (!match) {
      continue;
    }
    const questionNo = Number(match[1]);
    const y = toPixelY(viewportHeight, item.transform[5]);
    markers.push({ questionNo, y });
  }

  return markers.sort((a, b) => a.y - b.y);
}

function buildCropBox(
  viewportWidth: number,
  viewportHeight: number,
  top: number,
  bottom: number
): CropBox {
  const clampedTop = clamp(top, 0, viewportHeight);
  const clampedBottom = clamp(bottom, 0, viewportHeight);
  const height = Math.max(1, clampedBottom - clampedTop);
  const x = clamp(MARGIN_X, 0, viewportWidth);
  const width = Math.max(1, viewportWidth - MARGIN_X * 2);

  return {
    x,
    y: clampedTop,
    width: Math.min(width, viewportWidth - x),
    height: Math.min(height, viewportHeight - clampedTop),
  };
}

export async function computeQuestionCrops(
  buffer: Buffer,
  scale: number
): Promise<QuestionCrop[]> {
  const doc = await pdfjs
    .getDocument({ data: new Uint8Array(buffer), disableWorker: true })
    .promise;
  const crops: QuestionCrop[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const textContent = await page.getTextContent();
    const markers = findQuestionMarkers(textContent.items, viewport.height);

    for (let i = 0; i < markers.length; i += 1) {
      const marker = markers[i];
      const nextMarker = markers[i + 1];
      const top = marker.y - MARGIN_TOP;
      const bottom =
        (nextMarker ? nextMarker.y : viewport.height - FOOTER_MARGIN) + MARGIN_BOTTOM;

      let box = buildCropBox(viewport.width, viewport.height, top, bottom);
      let fallback = false;
      if (box.height < MIN_CROP_HEIGHT) {
        const fullTop = clamp(marker.y - MARGIN_TOP, 0, viewport.height);
        const fullBottom = clamp(viewport.height - FOOTER_MARGIN, 0, viewport.height);
        box = buildCropBox(viewport.width, viewport.height, fullTop, fullBottom);
        fallback = true;
      }

      crops.push({
        questionNo: marker.questionNo,
        page: pageNum,
        box,
        fallback,
      });
    }
  }

  return crops;
}

export async function cropQuestionImages({
  pageImagePath,
  outputDir,
  crops,
  publicRoot,
  debug,
}: {
  pageImagePath: string;
  outputDir: string;
  crops: QuestionCrop[];
  publicRoot: string;
  debug?: boolean;
}): Promise<Array<{ questionNo: number; url: string }>> {
  await fs.mkdir(outputDir, { recursive: true });
  const results: Array<{ questionNo: number; url: string }> = [];

  for (const crop of crops) {
    const outputPath = path.join(outputDir, `q-${crop.questionNo}.png`);
    await sharp(pageImagePath)
      .extract({
        left: Math.round(crop.box.x),
        top: Math.round(crop.box.y),
        width: Math.round(crop.box.width),
        height: Math.round(crop.box.height),
      })
      .toFile(outputPath);

    let urlPath = outputPath
      .replace(publicRoot, "")
      .split(path.sep)
      .join("/");
    if (!urlPath.startsWith("/")) {
      urlPath = `/${urlPath}`;
    }

    results.push({ questionNo: crop.questionNo, url: urlPath });

    if (debug) {
      // eslint-disable-next-line no-console
      console.log(
        `[crop] page ${crop.page} Q${crop.questionNo} x=${crop.box.x} y=${crop.box.y} w=${crop.box.width} h=${crop.box.height}`
      );
    }
  }

  return results;
}
