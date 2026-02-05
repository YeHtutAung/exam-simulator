import path from "node:path";
import fs from "node:fs/promises";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

type Marker = {
  kind: "question" | "choice";
  questionNo?: number;
  label?: "a" | "b" | "c" | "d";
  y: number;
};

type CropBox = {
  top: number;
  bottom: number;
};

export type QuestionCrop = {
  questionNo: number;
  page: number;
  stem: CropBox;
  choices: Record<"a" | "b" | "c" | "d", CropBox>;
};

const QUESTION_REGEX = /^Q\s*(\d+)\.$/i;
const CHOICE_REGEX = /^([abcd])\)$/i;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function toPixelY(viewportHeight: number, pdfY: number) {
  return viewportHeight - pdfY;
}

function buildMarkers(
  items: any[],
  viewportHeight: number
): Marker[] {
  const markers: Marker[] = [];
  for (const item of items) {
    if (!("str" in item) || !item.transform) {
      continue;
    }
    const text = String(item.str).trim();
    const y = toPixelY(viewportHeight, item.transform[5]);

    const questionMatch = text.match(QUESTION_REGEX);
    if (questionMatch) {
      const questionNo = Number(questionMatch[1]);
      markers.push({ kind: "question", questionNo, y });
      continue;
    }

    const choiceMatch = text.match(CHOICE_REGEX);
    if (choiceMatch) {
      const label = choiceMatch[1].toLowerCase() as "a" | "b" | "c" | "d";
      markers.push({ kind: "choice", label, y });
    }
  }
  return markers;
}

export async function extractQuestionCrops(
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
    const markers = buildMarkers(textContent.items, viewport.height).sort(
      (a, b) => a.y - b.y
    );

    for (let i = 0; i < markers.length; i += 1) {
      const marker = markers[i];
      if (marker.kind !== "question" || !marker.questionNo) {
        continue;
      }

      const nextQuestion = markers.slice(i + 1).find((m) => m.kind === "question");
      const questionEnd = nextQuestion ? nextQuestion.y : viewport.height;
      const choiceMarkers = markers
        .slice(i + 1)
        .filter((m) => m.kind === "choice" && m.y < questionEnd) as Marker[];

      const firstChoice = choiceMarkers[0];
      if (!firstChoice) {
        continue;
      }

      const stemTop = clamp(marker.y - 6, 0, viewport.height);
      const stemBottom = clamp(firstChoice.y - 4, 0, viewport.height);

      const choices: Record<"a" | "b" | "c" | "d", CropBox> = {
        a: { top: 0, bottom: 0 },
        b: { top: 0, bottom: 0 },
        c: { top: 0, bottom: 0 },
        d: { top: 0, bottom: 0 },
      };

      for (let j = 0; j < choiceMarkers.length; j += 1) {
        const current = choiceMarkers[j];
        if (!current.label) {
          continue;
        }
        const next = choiceMarkers[j + 1];
        const top = clamp(current.y - 4, 0, viewport.height);
        const bottom = clamp(
          next ? next.y - 4 : questionEnd - 4,
          0,
          viewport.height
        );
        choices[current.label] = { top, bottom };
      }

      crops.push({
        questionNo: marker.questionNo,
        page: pageNum,
        stem: { top: stemTop, bottom: stemBottom },
        choices,
      });
    }
  }

  return crops;
}

export async function cropQuestionImagesFromPage(
  pageImagePath: string,
  outputDir: string,
  crop: QuestionCrop
): Promise<
  {
    role: "STEM" | "CHOICE_A" | "CHOICE_B" | "CHOICE_C" | "CHOICE_D";
    filePath: string;
    width: number;
    height: number;
  }[]
> {
  await fs.mkdir(outputDir, { recursive: true });
  const image = await loadImage(pageImagePath);
  const width = image.width;

  const entries: Array<{
    role: "STEM" | "CHOICE_A" | "CHOICE_B" | "CHOICE_C" | "CHOICE_D";
    box: CropBox;
    fileName: string;
  }> = [
    { role: "STEM", box: crop.stem, fileName: "stem.png" },
    { role: "CHOICE_A", box: crop.choices.a, fileName: "choice-a.png" },
    { role: "CHOICE_B", box: crop.choices.b, fileName: "choice-b.png" },
    { role: "CHOICE_C", box: crop.choices.c, fileName: "choice-c.png" },
    { role: "CHOICE_D", box: crop.choices.d, fileName: "choice-d.png" },
  ];

  const outputs = [];
  for (const entry of entries) {
    const height = Math.max(1, entry.box.bottom - entry.box.top);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      0,
      entry.box.top,
      width,
      height,
      0,
      0,
      width,
      height
    );
    const filePath = path.join(outputDir, entry.fileName);
    await fs.writeFile(filePath, canvas.toBuffer("image/png"));
    outputs.push({ role: entry.role, filePath, width, height });
  }

  return outputs;
}
