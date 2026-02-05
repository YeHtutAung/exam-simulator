import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { parseFeAnswerPdf } from "./feAnswerParser";

describe("parseFeAnswerPdf", () => {
  it("parses all 80 answers from the FE answer PDF", async () => {
    const buffer = await readFile("/mnt/data/2020A_FE_AM_Answer.pdf");
    const mapping = await parseFeAnswerPdf(buffer);

    expect(Object.keys(mapping)).toHaveLength(80);
    expect(mapping[1]).toBe("c");
    expect(mapping[2]).toBe("a");
    expect(mapping[80]).toBe("c");
  });
});
