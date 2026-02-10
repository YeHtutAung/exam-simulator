import fs from "node:fs/promises";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { computeQuestionCrops } from "../src/lib/importer/pdfQuestionCropper";

type Marker = { questionNo: number; y: number };

const draftId = "a4982e73-b3a1-4fc4-82d0-35d7584f6eb0";
const questionId = "b32e8d92-f12e-4dbb-b29f-d13883db576d";
const questionNo = 1;
const pageNum = 3;
const renderScale = 2.5;

async function run() {
  const pdfPath = path.join(
    process.env.LOCALAPPDATA ?? "",
    "Temp",
    "exam-import",
    draftId,
    "question.pdf"
  );
  const pageImagePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "imports",
    draftId,
    "pages",
    `page-${pageNum}.png`
  );

  const buffer = await fs.readFile(pdfPath);
  const crops = await computeQuestionCrops(buffer, renderScale, pageNum);
  const crop = crops.find((entry) => entry.questionNo === questionNo);
  if (!crop) {
    throw new Error("Crop not found.");
  }

  const doc = await pdfjs
    .getDocument({ data: new Uint8Array(buffer), disableWorker: true })
    .promise;
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale: renderScale });
  const text = await page.getTextContent();
  const markers: Marker[] = [];
  for (const item of text.items) {
    if (!("str" in item) || !item.transform) continue;
    const value = String(item.str).trim();
    const match = value.match(/^Q\s*(\d+)\.$/i);
    if (!match) continue;
    const y = viewport.height - item.transform[5];
    markers.push({ questionNo: Number(match[1]), y });
  }

  const image = await loadImage(pageImagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  ctx.strokeStyle = "rgba(16, 185, 129, 0.9)";
  ctx.lineWidth = 3;
  ctx.strokeRect(crop.box.x, crop.box.y, crop.box.width, crop.box.height);

  ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
  ctx.font = "24px sans-serif";
  ctx.fillText(
    `Q${questionNo} crop (${Math.round(crop.box.x)}, ${Math.round(
      crop.box.y
    )}) ${Math.round(crop.box.width)}x${Math.round(crop.box.height)}`,
    Math.max(12, crop.box.x + 8),
    Math.max(28, crop.box.y + 28)
  );

  ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
  ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
  ctx.lineWidth = 2;
  for (const marker of markers) {
    ctx.beginPath();
    ctx.moveTo(0, marker.y);
    ctx.lineTo(canvas.width, marker.y);
    ctx.stroke();
    ctx.fillText(`Q${marker.questionNo}`, 12, marker.y - 6);
  }

  const outDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "imports",
    draftId,
    "debug"
  );
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `q-${questionNo}-overlay.png`);
  await fs.writeFile(outPath, canvas.toBuffer("image/png"));

  // eslint-disable-next-line no-console
  console.log(outPath);
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
