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
  reason?: string;
};

const QUESTION_REGEX = /^Q\s*(\d+)\.$/i;
const OPTION_REGEX = /^([a-d])\)/i;
const FOOTER_REGEX = /^\s*-\s*\d+\s*-\s*$/;

const MARGIN_X = 12;
const BASE_TOP_PADDING = 8;
const BASE_OPTION_PADDING = 20;
const BASE_INTER_PADDING = 16;
const BASE_FOOTER_PADDING = 16;
const BASE_SAFE_MARGIN = 12;
const BASE_MIN_HEIGHT = 120;
const PAGE_TOP_MARGIN = 8;

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

type PositionedText = {
  text: string;
  y: number;
};

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

function computeQuestionCropBox({
  items,
  questionNo,
  viewportWidth,
  viewportHeight,
  scale,
  markers,
  footerY,
}: {
  items: PositionedText[];
  questionNo: number;
  viewportWidth: number;
  viewportHeight: number;
  scale: number;
  markers: Marker[];
  footerY: number | null;
}): { box: CropBox; fallback: boolean; reason: string; topY: number; bottomY: number } {
  const topPadding = BASE_TOP_PADDING * scale;
  const optionPadding = BASE_OPTION_PADDING * scale;
  const interPadding = BASE_INTER_PADDING * scale;
  const footerPadding = BASE_FOOTER_PADDING * scale;
  const safeMargin = BASE_SAFE_MARGIN * scale;
  const minHeight = BASE_MIN_HEIGHT * (scale / 2);

  const markerIndex = markers.findIndex((marker) => marker.questionNo === questionNo);
  const marker = markers[markerIndex];
  const candidateNext = markerIndex >= 0 ? markers[markerIndex + 1] : undefined;
  const nextMarker =
    marker && candidateNext && candidateNext.y > marker.y ? candidateNext : undefined;
  const pageBottom = viewportHeight - safeMargin;

  let topY = marker ? marker.y - topPadding : PAGE_TOP_MARGIN;
  topY = Math.max(topY, PAGE_TOP_MARGIN);

  let bottomY = pageBottom;
  let reason = "page-bottom";

  if (marker) {
    const bandStart = marker.y;
    const bandEnd = nextMarker ? nextMarker.y : viewportHeight;
    const optionItems = items.filter(
      (item) => item.y >= bandStart && item.y <= bandEnd && OPTION_REGEX.test(item.text)
    );
    const optionCount = optionItems.length;
    const lastOptionY =
      optionCount > 0 ? Math.max(...optionItems.map((item) => item.y)) : null;

    if (optionCount >= 2 && lastOptionY !== null) {
      bottomY = lastOptionY + optionPadding;
      reason = "options";
    } else if (nextMarker) {
      bottomY = nextMarker.y - interPadding;
      reason = "next-question";
    } else if (footerY !== null) {
      bottomY = footerY - footerPadding;
      reason = "last-question-footer";
    } else {
      bottomY = pageBottom;
      reason = "last-question-page";
    }

    if (!nextMarker && optionCount >= 2 && lastOptionY !== null) {
      bottomY = lastOptionY + optionPadding;
      reason = "last-question-options";
    }
    if (!nextMarker && optionCount < 2 && footerY !== null) {
      bottomY = footerY - footerPadding;
      reason = "last-question-footer";
    }
  }

  if (footerY !== null) {
    bottomY = Math.min(bottomY, footerY - footerPadding);
    if (reason !== "last-question-footer") {
      reason = `${reason}+footer-guard`;
    }
  }

  const desiredBottom = topY + minHeight;
  if (bottomY < desiredBottom) {
    const maxBottom = footerY !== null ? footerY - footerPadding : pageBottom;
    bottomY = Math.min(desiredBottom, maxBottom);
  }

  let box = buildCropBox(viewportWidth, viewportHeight, topY, bottomY);
  let fallback = false;

  if (box.height < minHeight || box.height <= 1 || !marker) {
    const fallbackTop = PAGE_TOP_MARGIN;
    const fallbackBottom = footerY !== null ? footerY - footerPadding : pageBottom;
    box = buildCropBox(viewportWidth, viewportHeight, fallbackTop, fallbackBottom);
    fallback = true;
    reason = "fallback-full-page";
    topY = fallbackTop;
    bottomY = fallbackBottom;
  }

  return { box, fallback, reason, topY, bottomY };
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
    const items: PositionedText[] = textContent.items
      .filter((item) => "str" in item && item.transform)
      .map((item) => ({
        text: String(item.str).trim(),
        y: toPixelY(viewport.height, item.transform[5]),
      }));
    const markers = findQuestionMarkers(textContent.items, viewport.height);
    const footerItems = items.filter((item) => FOOTER_REGEX.test(item.text));
    const footerY = footerItems.length > 0 ? Math.max(...footerItems.map((item) => item.y)) : null;

    for (let i = 0; i < markers.length; i += 1) {
      const marker = markers[i];
      const crop = computeQuestionCropBox({
        items,
        questionNo: marker.questionNo,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        scale,
        markers,
        footerY,
      });

      crops.push({
        questionNo: marker.questionNo,
        page: pageNum,
        box: crop.box,
        fallback: crop.fallback,
        reason: crop.reason,
      });

      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log(
          `[crop] Q${marker.questionNo} top=${Math.round(crop.topY)} bottom=${Math.round(
            crop.bottomY
          )} reason=${crop.reason}`
        );
      }
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
