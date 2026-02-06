import fs from "node:fs/promises";
import "dotenv/config";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { configurePdfJsWorker } from "../lib/pdfjs";

const QUESTION_REGEX = /\bQ\s*(\d+)\./i;

async function run() {
  const pdfPath = process.argv[2] || "/mnt/data/2020A_FE_AM_Question.pdf";
  const scale = 2.5;

  console.log(`Reading PDF: ${pdfPath}`);
  const buffer = await fs.readFile(pdfPath);

  configurePdfJsWorker();
  const doc = await pdfjs
    .getDocument({ data: new Uint8Array(buffer), disableWorker: true })
    .promise;

  console.log(`PDF has ${doc.numPages} pages`);

  // Only check first 2 pages
  for (let pageNum = 1; pageNum <= Math.min(2, doc.numPages); pageNum++) {
    const page = await doc.getPage(pageNum);

    // Get viewport at scale 1 and at the render scale
    const viewport1 = page.getViewport({ scale: 1 });
    const viewportScaled = page.getViewport({ scale });

    console.log(`\n=== Page ${pageNum} ===`);
    console.log(`Viewport at scale 1: ${viewport1.width} x ${viewport1.height}`);
    console.log(`Viewport at scale ${scale}: ${viewportScaled.width} x ${viewportScaled.height}`);

    const textContent = await page.getTextContent();

    console.log(`\nText items with question markers:`);

    for (const item of textContent.items) {
      if (!("str" in item) || !item.transform) {
        continue;
      }
      const text = String(item.str).trim();
      const match = text.match(QUESTION_REGEX);
      if (!match) {
        continue;
      }

      const questionNo = Number(match[1]);
      const transform = item.transform;
      const rawX = transform[4];
      const rawY = transform[5];

      // The CORRECT approach: use viewport.convertToViewportPoint()
      const [viewportX, viewportY] = viewportScaled.convertToViewportPoint(rawX, rawY);

      // Old approaches for comparison
      const oldApproach = viewportScaled.height - rawY;
      const scaledApproach = viewportScaled.height - (rawY * scale);

      console.log(`\nQ${questionNo}: "${text.substring(0, 50)}..."`);
      console.log(`  Raw transform: [${rawX.toFixed(1)}, ${rawY.toFixed(1)}]`);
      console.log(`  CORRECT (convertToViewportPoint): y = ${viewportY.toFixed(1)}`);
      console.log(`  Old buggy (no scale):             y = ${oldApproach.toFixed(1)}`);
      console.log(`  Previous fix (scale Y):           y = ${scaledApproach.toFixed(1)}`);
      console.log(`  Valid range: 0 to ${viewportScaled.height}`);

      const isCorrectValid = viewportY >= 0 && viewportY <= viewportScaled.height;
      const isOldValid = oldApproach >= 0 && oldApproach <= viewportScaled.height;
      const isScaledValid = scaledApproach >= 0 && scaledApproach <= viewportScaled.height;

      console.log(`  Validity: correct=${isCorrectValid}, old=${isOldValid}, scaled=${isScaledValid}`);
    }

    // Also check first few text items to understand the coordinate system
    console.log(`\n\nFirst 5 text items on page ${pageNum}:`);
    let count = 0;
    for (const item of textContent.items) {
      if (!("str" in item) || !item.transform) {
        continue;
      }
      const text = String(item.str).trim();
      if (!text) continue;

      const [vx, vy] = viewportScaled.convertToViewportPoint(item.transform[4], item.transform[5]);
      console.log(`  "${text.substring(0, 30)}" -> viewport y=${vy.toFixed(1)}`);
      count++;
      if (count >= 5) break;
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
