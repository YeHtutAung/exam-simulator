import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { configurePdfJsWorker } from "@/lib/pdfjs";

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

// Match "Q1.", "Q1", "Q 1.", "Q 1" - dot is optional
const QUESTION_REGEX = /\bQ\s*(\d+)\.?/i;
const OPTION_REGEX = /^([a-d])\)/i;
const FOOTER_REGEX = /^\s*-\s*\d+\s*-\s*$/;

const MARGIN_X = 12;
// Increased from 8 to 20 to prevent question markers from being clipped
const BASE_TOP_PADDING = 20;
// Padding for horizontal options (a/b/c/d on same line)
const BASE_OPTION_PADDING_HORIZONTAL = 50;
// Padding for normal vertical options (one per line)
const BASE_OPTION_PADDING_VERTICAL = 60;
// Extra padding for multi-row graphical options (diagrams, trees, formulas)
// Only used when options have large gaps indicating graphical content
const BASE_OPTION_PADDING_GRAPHICAL = 180;
const BASE_INTER_PADDING = 16;
const BASE_FOOTER_PADDING = 16;
const BASE_SAFE_MARGIN = 12;
const BASE_MIN_HEIGHT = 120;
const BASE_OPTION_MIN_HEIGHT = 220;
const PAGE_TOP_MARGIN = 8;

// Thresholds for option layout detection (in base units, before scaling)
const HORIZONTAL_SPREAD_THRESHOLD = 15; // Options within this Y spread = horizontal
// Gap between options > this = graphical content (e.g., tree diagrams, not just paragraph text)
// Increased from 100 to 200 to avoid false positives with wrapped paragraph options
const GRAPHICAL_GAP_THRESHOLD = 200;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

type Viewport = {
  width: number;
  height: number;
  convertToViewportPoint(x: number, y: number): [number, number];
};

function getTextItemY(item: any, viewport: Viewport): number {
  // Use viewport's built-in conversion which handles coordinate system properly
  const [, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
  return y;
}

function findQuestionMarkers(items: any[], viewport: Viewport): Marker[] {
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
    const y = getTextItemY(item, viewport);
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

type OptionLayout = "horizontal" | "vertical" | "graphical";

function detectOptionLayout(
  optionItems: PositionedText[],
  scale: number
): { layout: OptionLayout; lastOptionY: number | null; firstOptionY: number | null } {
  if (optionItems.length < 2) {
    return { layout: "vertical", lastOptionY: null, firstOptionY: null };
  }

  const sortedByY = [...optionItems].sort((a, b) => a.y - b.y);
  const firstOptionY = sortedByY[0].y;
  const lastOptionY = sortedByY[sortedByY.length - 1].y;
  const optionSpread = lastOptionY - firstOptionY;

  // Horizontal layout: all options on nearly the same line (e.g., "a) X  b) Y  c) Z  d) W")
  if (optionSpread < HORIZONTAL_SPREAD_THRESHOLD * scale) {
    return { layout: "horizontal", lastOptionY, firstOptionY };
  }

  // Check for graphical content by looking at gaps between consecutive options
  // Graphical content (like tree diagrams) has large gaps between option pairs
  const gaps: number[] = [];
  for (let i = 1; i < sortedByY.length; i++) {
    gaps.push(sortedByY[i].y - sortedByY[i - 1].y);
  }

  // If any gap is very large, it's likely graphical content
  const maxGap = Math.max(...gaps);
  if (maxGap > GRAPHICAL_GAP_THRESHOLD * scale) {
    return { layout: "graphical", lastOptionY, firstOptionY };
  }

  // Normal vertical layout: options listed one per line
  return { layout: "vertical", lastOptionY, firstOptionY };
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
  const optionPaddingHorizontal = BASE_OPTION_PADDING_HORIZONTAL * scale;
  const optionPaddingVertical = BASE_OPTION_PADDING_VERTICAL * scale;
  const optionPaddingGraphical = BASE_OPTION_PADDING_GRAPHICAL * scale;
  const interPadding = BASE_INTER_PADDING * scale;
  const footerPadding = BASE_FOOTER_PADDING * scale;
  const safeMargin = BASE_SAFE_MARGIN * scale;
  const minHeight = BASE_MIN_HEIGHT * (scale / 2);
  const optionMinHeight = BASE_OPTION_MIN_HEIGHT * (scale / 2);

  const markerIndex = markers.findIndex((marker) => marker.questionNo === questionNo);
  const marker = markers[markerIndex];
  const prevMarker = markerIndex > 0 ? markers[markerIndex - 1] : undefined;
  const candidateNext = markerIndex >= 0 ? markers[markerIndex + 1] : undefined;
  const nextMarker =
    marker && candidateNext && candidateNext.y > marker.y ? candidateNext : undefined;
  const pageBottom = viewportHeight - safeMargin;

  // CRITICAL: Define the hard boundary - never go past next question
  const hardBoundary = nextMarker
    ? nextMarker.y - interPadding
    : footerY !== null
      ? footerY - footerPadding
      : pageBottom;

  let topY = marker ? marker.y - topPadding : PAGE_TOP_MARGIN;
  topY = Math.max(topY, PAGE_TOP_MARGIN);

  let bottomY = hardBoundary;
  let reason = nextMarker ? "next-question" : footerY !== null ? "footer" : "page-bottom";

  if (marker) {
    const bandStart = marker.y;
    const bandEnd = hardBoundary; // Only look for options within our boundary
    const optionItems = items.filter(
      (item) => item.y >= bandStart && item.y <= bandEnd && OPTION_REGEX.test(item.text)
    );
    const optionCount = optionItems.length;

    if (optionCount >= 2) {
      const { layout, lastOptionY } = detectOptionLayout(optionItems, scale);

      // Select padding based on layout type
      let effectivePadding: number;
      switch (layout) {
        case "horizontal":
          effectivePadding = optionPaddingHorizontal;
          break;
        case "graphical":
          effectivePadding = optionPaddingGraphical;
          break;
        case "vertical":
        default:
          effectivePadding = optionPaddingVertical;
          break;
      }

      if (lastOptionY !== null) {
        const computedBottom = lastOptionY + effectivePadding;
        // ALWAYS respect the hard boundary
        bottomY = Math.min(computedBottom, hardBoundary);
        reason = `options-${layout}`;
      }
    }
    // If no options found or < 2 options, bottomY stays at hardBoundary
  }

  // Note: We intentionally do NOT expand the top into previous question's territory.
  // If a question has minimal content (like horizontal options), that's fine.
  // Expanding upward would show content from the previous question, which is worse
  // than having some whitespace at the bottom.

  // Ensure absolute minimum height
  const desiredBottom = topY + minHeight;
  if (bottomY < desiredBottom) {
    bottomY = Math.min(desiredBottom, hardBoundary);
  }

  let box = buildCropBox(viewportWidth, viewportHeight, topY, bottomY);
  let fallback = false;

  if (box.height < minHeight || box.height <= 1 || !marker) {
    const fallbackTop = PAGE_TOP_MARGIN;
    const fallbackBottom = hardBoundary;
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
  scale: number,
  startPage = 1
): Promise<QuestionCrop[]> {
  configurePdfJsWorker();
  const doc = await pdfjs
    .getDocument({ data: new Uint8Array(buffer), disableWorker: true })
    .promise;
  const crops: QuestionCrop[] = [];

  for (let pageNum = startPage; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const textContent = await page.getTextContent();
    const items: PositionedText[] = textContent.items
      .filter((item) => "str" in item && item.transform)
      .map((item) => ({
        text: String(item.str).trim(),
        y: getTextItemY(item, viewport),
      }));
    const markers = findQuestionMarkers(textContent.items, viewport);
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
