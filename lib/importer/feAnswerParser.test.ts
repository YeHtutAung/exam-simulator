import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { parseFeAnswerPdf } from "./feAnswerParser";

describe("parseFeAnswerPdf", () => {
  it("parses all 80 answers from the FE answer PDF", async () => {
    const candidates = [
      process.env.FE_ANSWER_PDF_PATH,
      "/mnt/data/2020A_FE_AM_Answer.pdf",
      "C:\\mnt\\data\\2020A_FE_AM_Answer.pdf",
      path.resolve("testdata", "2020A_FE_AM_Answer.pdf"),
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
        `Answer PDF not found. Provide FE_ANSWER_PDF_PATH or place the file in ${path.resolve(
          "testdata",
          "2020A_FE_AM_Answer.pdf"
        )}.`
      );
    }

    const buffer = await readFile(pdfPath);
    const mapping = await parseFeAnswerPdf(buffer);

    expect(Object.keys(mapping)).toHaveLength(80);
    expect(mapping[1]).toBe("c");
    expect(mapping[2]).toBe("a");
    expect(mapping[80]).toBe("c");
  });
});
