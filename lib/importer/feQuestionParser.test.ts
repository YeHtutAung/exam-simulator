import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { parseFeQuestionPdf } from "./feQuestionParser";

describe("parseFeQuestionPdf", () => {
  it("parses 80 questions and MCQ choices", async () => {
    const buffer = await readFile("/mnt/data/2020A_FE_AM_Question.pdf");
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
