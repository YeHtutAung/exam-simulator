import pdfParse from "pdf-parse";

export type FeAnswer = "a" | "b" | "c" | "d";

const ANSWER_REGEX = /\b(\d{1,3})\s*([abcd])\b/gi;

function normalizeText(input: string): string {
  return input
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export async function parseFeAnswerPdf(
  buffer: Buffer
): Promise<Record<number, FeAnswer>> {
  const parsed = await pdfParse(buffer);
  const text = normalizeText(parsed.text || "");

  if (!text.trim()) {
    throw new Error("Answer PDF parse failed: no text extracted.");
  }

  const mapping = new Map<number, FeAnswer>();
  let match: RegExpExecArray | null = null;

  while ((match = ANSWER_REGEX.exec(text)) !== null) {
    const questionNo = Number(match[1]);
    const answer = match[2].toLowerCase() as FeAnswer;

    if (questionNo < 1) {
      continue;
    }

    if (!["a", "b", "c", "d"].includes(answer)) {
      throw new Error(
        `Answer PDF parse failed: invalid answer "${match[2]}" for Q${questionNo}.`
      );
    }

    if (mapping.has(questionNo)) {
      throw new Error(
        `Answer PDF parse failed: duplicate answer for Q${questionNo}.`
      );
    }

    mapping.set(questionNo, answer);
  }

  if (mapping.size === 0) {
    throw new Error("Answer PDF parse failed: no answers found.");
  }

  // Validate sequential coverage: 1..N with no gaps
  const maxQ = Math.max(...mapping.keys());
  const missing: number[] = [];
  for (let i = 1; i <= maxQ; i += 1) {
    if (!mapping.has(i)) {
      missing.push(i);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Answer PDF parse failed: missing answers for questions ${missing.join(
        ", "
      )}.`
    );
  }

  const result: Record<number, FeAnswer> = {};
  for (const [key, value] of mapping.entries()) {
    result[key] = value;
  }

  return result;
}
