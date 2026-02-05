import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { parseFeQuestionPdf } from "./feQuestionParser";

describe("parseFeQuestionPdf", () => {
  it("parses 80 questions and MCQ choices", async () => {
    const candidates = [
      process.env.FE_QUESTION_PDF_PATH,
      "/mnt/data/2020A_FE_AM_Question.pdf",
      "C:\\mnt\\data\\2020A_FE_AM_Question.pdf",
      path.resolve("testdata", "2020A_FE_AM_Question.pdf"),
    ].filter((value): value is string => Boolean(value));

    let pdfPath: string | undefined;
    for (const candidate of candidates) {
      try {
        await access(candidate);
        pdfPath = candidate;
        break;
      } catch {
        // try next candidate
      }
    }

    if (!pdfPath) {
      throw new Error(
        `Question PDF not found. Provide FE_QUESTION_PDF_PATH or place the file in ${path.resolve(
          "testdata",
          "2020A_FE_AM_Question.pdf"
        )}.`
      );
    }

    const buffer = await readFile(pdfPath);
    const questions = await parseFeQuestionPdf(buffer);

    expect(questions).toHaveLength(80);
    expect(questions[0].questionNo).toBe(1);
    expect(questions[79].questionNo).toBe(80);
    expect(questions[0].stem.length).toBeGreaterThan(0);
    expect(questions[0].choices).not.toBeNull();

    const choices = questions[0].choices;
    expect(choices?.a.length).toBeGreaterThan(0);
    expect(choices?.b.length).toBeGreaterThan(0);
    expect(choices?.c.length).toBeGreaterThan(0);
    expect(choices?.d.length).toBeGreaterThan(0);
  });
});
