import fs from "node:fs/promises";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

type RenderedPage = {
  page: number;
  url: string;
  width: number;
  height: number;
};

function toPublicUrl(publicRoot: string, filePath: string): string {
  const relative = path.relative(publicRoot, filePath);
  return `/${relative.split(path.sep).join("/")}`;
}

export async function renderPdfPagesToPng(
  buffer: Buffer,
  outDir: string,
  scale = 2.5
): Promise<RenderedPage[]> {
  const publicRoot = path.join(process.cwd(), "public");
  await fs.mkdir(outDir, { recursive: true });

  const doc = await pdfjs
    .getDocument({ data: new Uint8Array(buffer), disableWorker: true })
    .promise;
  const pages: RenderedPage[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    await page.render({ canvasContext: context as unknown as CanvasRenderingContext2D, viewport })
      .promise;

    const filePath = path.join(outDir, `page-${pageNum}.png`);
    const bufferOut = canvas.toBuffer("image/png");
    await fs.writeFile(filePath, bufferOut);

    pages.push({
      page: pageNum,
      url: toPublicUrl(publicRoot, filePath),
      width: viewport.width,
      height: viewport.height,
    });
  }

  return pages;
}
