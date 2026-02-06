import path from "node:path";
import { pathToFileURL } from "node:url";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

let configured = false;

export function configurePdfJsWorker() {
  if (configured) {
    return;
  }
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs"
  );
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).toString();
  configured = true;
}
