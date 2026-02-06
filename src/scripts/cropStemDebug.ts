import fs from "node:fs/promises";
import path from "node:path";
import "dotenv/config";
import { renderPdfPagesToPng } from "../lib/importer/pdfPageRenderer";
import { computeQuestionCrops, cropQuestionImages } from "../lib/importer/pdfQuestionCropper";

async function run() {
  const pdfPath = "/mnt/data/2020A_FE_AM_Question.pdf";
  const buffer = await fs.readFile(pdfPath);
  const debugRoot = path.join(process.cwd(), "tmp", "crop-debug");
  const pagesDir = path.join(debugRoot, "pages");
  const outputDir = path.join(debugRoot, "stems");
  const publicRoot = process.cwd();
  const renderScale = 2.5;

  await renderPdfPagesToPng(buffer, pagesDir, renderScale);
  const crops = await computeQuestionCrops(buffer, renderScale);

  const cropsByPage = new Map<number, typeof crops>();
  for (const crop of crops) {
    const list = cropsByPage.get(crop.page) ?? [];
    list.push(crop);
    cropsByPage.set(crop.page, list);
  }

  const pageWithMany = Array.from(cropsByPage.entries()).find(
    ([, list]) => list.length >= 5
  );
  if (!pageWithMany) {
    throw new Error("No page with at least 5 questions found.");
  }

  const [page, pageCrops] = pageWithMany;
  const outputs = await cropQuestionImages({
    pageImagePath: path.join(pagesDir, `page-${page}.png`),
    outputDir,
    crops: pageCrops,
    publicRoot,
    debug: true,
  });

  if (outputs.length < 5) {
    throw new Error("Expected at least 5 cropped images.");
  }

  // eslint-disable-next-line no-console
  console.log(`Cropped ${outputs.length} question images from page ${page}.`);
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
