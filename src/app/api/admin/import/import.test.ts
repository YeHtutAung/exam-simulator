import "dotenv/config";
import { readFile } from "node:fs/promises";
import { FormData, File } from "undici";
import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { GET } from "./[draftId]/route";
import { POST } from "./route";
import { processNextImportDraftOnce } from "@/scripts/importWorker";

describe("POST /api/admin/import", () => {
  let draftId: string | null = null;

  afterAll(async () => {
    if (draftId) {
      await prisma.importDraft.delete({
        where: { id: draftId },
      });
    }
  });

  it(
    "creates a draft and stores 80 questions",
    async () => {
      const [questionPdf, answerPdf] = await Promise.all([
        readFile("/mnt/data/2020A_FE_AM_Question.pdf"),
        readFile("/mnt/data/2020A_FE_AM_Answer.pdf"),
      ]);

      const formData = new FormData();
      formData.set("title", "FE 2020A AM");
      formData.set("session", "2020 Autumn");
      formData.set("paper", "AM");
      formData.set("language", "JA");
      formData.set(
        "questionPdf",
        new File([questionPdf], "2020A_FE_AM_Question.pdf", {
          type: "application/pdf",
        })
      );
      formData.set(
        "answerPdf",
        new File([answerPdf], "2020A_FE_AM_Answer.pdf", {
          type: "application/pdf",
        })
      );

      const response = await POST(
        new Request("http://localhost/api/admin/import", {
          method: "POST",
          body: formData,
        })
      );

      expect(response.status).toBe(200);
      const payload = await response.json();

      expect(payload.draftId).toBeTruthy();
      draftId = payload.draftId as string;

      let draft: any = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await processNextImportDraftOnce();
        const fetchResponse = await GET(
          new Request(
            `http://localhost/api/admin/import/${encodeURIComponent(draftId)}`
          ),
          { params: { draftId } }
        );

        expect(fetchResponse.status).toBe(200);
        draft = await fetchResponse.json();
        if (draft.status !== "PARSING") {
          break;
        }
      }

      expect(draft?.questions).toHaveLength(80);
      const withAttachments = draft.questions.filter(
        (question: { attachments?: unknown[] }) =>
          Array.isArray(question.attachments) && question.attachments.length > 0
      );
      expect(withAttachments.length).toBeGreaterThan(0);
    },
    30000
  );
});
