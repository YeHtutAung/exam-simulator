import "dotenv/config";
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { POST } from "./route";

describe("POST /api/admin/import/[draftId]/questions/[draftQuestionId]/crop", () => {
  let draftId = "";
  let questionId = "";
  let fixtureUrl = "";
  let fixturePath = "";

  beforeAll(async () => {
    const draft = await prisma.importDraft.create({
      data: {
        title: "Crop Test Draft",
        session: "2020 Autumn",
        paper: "AM",
        language: "JA",
        status: "NEEDS_REVIEW",
      },
    });
    draftId = draft.id;

    fixtureUrl = `/uploads/tests/crop-fixture-${draftId}.png`;
    fixturePath = path.join(process.cwd(), "public", fixtureUrl.replace(/^\/+/, ""));
    await fs.mkdir(path.dirname(fixturePath), { recursive: true });
    await sharp({
      create: {
        width: 600,
        height: 400,
        channels: 3,
        background: { r: 240, g: 240, b: 240 },
      },
    })
      .png()
      .toFile(fixturePath);

    const question = await prisma.importDraftQuestion.create({
      data: {
        draftId,
        questionNo: 1,
        type: "MCQ_SINGLE",
        stem: "Test stem",
        sourcePage: 1,
        pageImageUrl: fixtureUrl,
      },
    });
    questionId = question.id;
  });

  afterAll(async () => {
    const outputPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "imports",
      draftId,
      "questions",
      "q-1.png"
    );
    if (questionId) {
      await prisma.importDraftQuestion.delete({ where: { id: questionId } });
    }
    if (draftId) {
      await prisma.importDraft.delete({ where: { id: draftId } });
    }
    await fs.rm(outputPath, { force: true });
    if (fixturePath) {
      await fs.rm(fixturePath, { force: true });
    }
  });

  it("accepts a valid crop and updates stemImageUrl", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/import/crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x: 50, y: 60, width: 200, height: 120 }),
      }),
      { params: { draftId, draftQuestionId: questionId } }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.stemImageUrl).toMatch(/\/uploads\/imports\/.+\/questions\/q-1\.png/);
    expect(payload.cropW).toBe(200);
    expect(payload.cropH).toBe(120);
  });

  it("rejects an out-of-bounds crop", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/import/crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x: 10000, y: 10000, width: 200, height: 120 }),
      }),
      { params: { draftId, draftQuestionId: questionId } }
    );

    expect(response.status).toBe(400);
  });
});
