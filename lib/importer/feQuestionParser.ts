import pdfParse from "pdf-parse";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

export type FeQuestionChoiceMap = {
  a: string;
  b: string;
  c: string;
  d: string;
};

export type FeQuestion = {
  questionNo: number;
  stem: string;
  choices: FeQuestionChoiceMap | null;
  sourcePage?: number;
};

const QUESTION_MARKER = /Q(\d+)\./g;
const CHOICE_MARKERS = ["a)", "b)", "c)", "d)"] as const;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function findChoiceIndices(text: string): Record<(typeof CHOICE_MARKERS)[number], number> {
  const lower = text.toLowerCase();
  const indices: Record<(typeof CHOICE_MARKERS)[number], number> = {
    "a)": -1,
    "b)": -1,
    "c)": -1,
    "d)": -1,
  };

  for (const marker of CHOICE_MARKERS) {
    indices[marker] = lower.indexOf(marker);
  }

  return indices;
}

function extractChoices(chunk: string): FeQuestionChoiceMap | null {
  const indices = findChoiceIndices(chunk);
  const hasAll = CHOICE_MARKERS.every((marker) => indices[marker] >= 0);
  if (!hasAll) {
    return null;
  }

  const ordered = CHOICE_MARKERS.map((marker) => ({
    marker,
    index: indices[marker],
  })).sort((a, b) => a.index - b.index);

  const parts: Record<keyof FeQuestionChoiceMap, string> = {
    a: "",
    b: "",
    c: "",
    d: "",
  };

  for (let i = 0; i < ordered.length; i += 1) {
    const current = ordered[i];
    const next = ordered[i + 1];
    const start = current.index + current.marker.length;
    const end = next ? next.index : chunk.length;
    const value = normalizeWhitespace(chunk.slice(start, end));
    const key = current.marker[0] as keyof FeQuestionChoiceMap;
    parts[key] = value;
  }

  const allFilled = Object.values(parts).every((value) => value.length > 0);
  return allFilled ? parts : null;
}

async function mapQuestionPages(
  buffer: Buffer,
  startPage = 1
): Promise<Map<number, number>> {
  const doc = await pdfjs
    .getDocument({ data: new Uint8Array(buffer), disableWorker: true })
    .promise;
  const pageMap = new Map<number, number>();

  for (let pageNum = startPage; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    const normalized = pageText.replace(/\s+/g, " ");

    let match: RegExpExecArray | null;
    while ((match = QUESTION_MARKER.exec(normalized)) !== null) {
      const questionNo = Number(match[1]);
      if (questionNo < 1 || questionNo > 80) {
        continue;
      }
      if (!pageMap.has(questionNo)) {
        pageMap.set(questionNo, pageNum);
      }
    }
  }

  QUESTION_MARKER.lastIndex = 0;
  return pageMap;
}

export async function parseFeQuestionPdf(
  buffer: Buffer,
  startPage = 1
): Promise<FeQuestion[]> {
  const [parsed, pageMap] = await Promise.all([
    pdfParse(buffer),
    mapQuestionPages(buffer, startPage),
  ]);
  const text = parsed.text || "";

  if (!text.trim()) {
    throw new Error("Question PDF parse failed: no text extracted.");
  }

  const matches = Array.from(text.matchAll(QUESTION_MARKER));
  if (matches.length === 0) {
    throw new Error("Question PDF parse failed: no question markers found.");
  }

  const chunks: Array<{ questionNo: number; chunk: string }> = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const questionNo = Number(match[1]);
    const start = (match.index ?? 0) + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? text.length : text.length;
    const chunk = text.slice(start, end);
    chunks.push({ questionNo, chunk });
  }

  const resultsMap = new Map<number, FeQuestion>();

  for (const { questionNo, chunk } of chunks) {
    if (questionNo < 1 || questionNo > 80) {
      continue;
    }

    const normalizedChunk = chunk.replace(/\r/g, " ");
    const isSample = /sample question/i.test(normalizedChunk);
    const choices = extractChoices(normalizedChunk);
    const indices = findChoiceIndices(normalizedChunk);
    const firstChoiceIndex = Math.min(...Object.values(indices).filter((i) => i >= 0));
    const stemRaw =
      firstChoiceIndex >= 0 ? normalizedChunk.slice(0, firstChoiceIndex) : normalizedChunk;
    const stem = normalizeWhitespace(stemRaw);

    const candidate: FeQuestion = {
      questionNo,
      stem,
      choices,
      sourcePage: pageMap.get(questionNo),
    };

    const existing = resultsMap.get(questionNo);
    if (!existing) {
      if (!isSample) {
        resultsMap.set(questionNo, candidate);
      }
      continue;
    }

    if (!existing.choices && choices) {
      resultsMap.set(questionNo, candidate);
      continue;
    }

    if (existing.choices && !choices) {
      continue;
    }

    if (!isSample && existing.stem.length < candidate.stem.length) {
      resultsMap.set(questionNo, candidate);
    }
  }

  const results = Array.from(resultsMap.values());

  const missing: number[] = [];
  for (let i = 1; i <= 80; i += 1) {
    if (!results.find((item) => item.questionNo === i)) {
      missing.push(i);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Question PDF parse failed: missing questions ${missing.join(", ")}.`
    );
  }

  if (results.length !== 80) {
    throw new Error(
      `Question PDF parse failed: expected 80 questions, found ${results.length}.`
    );
  }

  return results.sort((a, b) => a.questionNo - b.questionNo);
}
