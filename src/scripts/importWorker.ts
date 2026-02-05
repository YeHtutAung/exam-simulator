import "dotenv/config";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { prisma } from "../lib/prisma";
import { parseFeAnswerPdf } from "../../lib/importer/feAnswerParser";
import { parseFeQuestionPdf } from "../../lib/importer/feQuestionParser";
import { renderPdfPagesToPng } from "../lib/importer/pdfPageRenderer";
import { computeQuestionCrops, cropQuestionImages } from "../lib/importer/pdfQuestionCropper";

const LOCK_TIMEOUT_MINUTES = 10;
const POLL_INTERVAL_MS = 2000;

type DraftStatus =
  | "PARSING"
  | "READY_TO_PUBLISH"
  | "NEEDS_REVIEW"
  | "FAILED"
  | "PUBLISHED";

function lockExpiredDate() {
  return new Date(Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000);
}

function lockIdentity() {
  return `${os.hostname()}-${process.pid}`;
}

async function lockNextDraft() {
  const candidate = await prisma.importDraft.findFirst({
    where: {
      status: "PARSING",
      OR: [{ jobLockedAt: null }, { jobLockedAt: { lt: lockExpiredDate() } }],
    },
    orderBy: { createdAt: "asc" },
  });

  if (!candidate) {
    return null;
  }

  const updateResult = await prisma.importDraft.updateMany({
    where: {
      id: candidate.id,
      OR: [{ jobLockedAt: null }, { jobLockedAt: { lt: lockExpiredDate() } }],
    },
    data: {
      jobLockedAt: new Date(),
      jobLockedBy: lockIdentity(),
      startedAt: candidate.startedAt ?? new Date(),
      attempts: { increment: 1 },
      stage: "UPLOAD",
      progressInt: 0,
    },
  });

  if (updateResult.count === 0) {
    return null;
  }

  return candidate.id;
}

async function updateProgress(
  draftId: string,
  stage: string,
  progressInt: number
) {
  await prisma.importDraft.update({
    where: { id: draftId },
    data: {
      stage,
      progressInt,
    },
  });
}

async function finalizeDraft(
  draftId: string,
  status: DraftStatus,
  errors: string[] = [],
  warnings: string[] = []
) {
  await prisma.importDraft.update({
    where: { id: draftId },
    data: {
      status,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      finishedAt: new Date(),
      stage: "DONE",
      progressInt: 100,
      jobLockedAt: null,
      jobLockedBy: null,
    },
  });
}

async function releaseLock(draftId: string) {
  await prisma.importDraft.update({
    where: { id: draftId },
    data: {
      jobLockedAt: null,
      jobLockedBy: null,
    },
  });
}

export async function processNextImportDraftOnce() {
  const draftId = await lockNextDraft();
  if (!draftId) {
    return null;
  }

  try {
    const draft = await prisma.importDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft?.questionPdfPath || !draft.answerPdfPath) {
      throw new Error("Draft files are missing.");
    }

    const [questionPdf, answerPdf] = await Promise.all([
      fs.readFile(draft.questionPdfPath),
      fs.readFile(draft.answerPdfPath),
    ]);

    await updateProgress(draftId, "PARSE_ANSWERS", 10);
    const answers = await parseFeAnswerPdf(answerPdf);

    await updateProgress(draftId, "PARSE_QUESTIONS", 40);
    const questions = await parseFeQuestionPdf(questionPdf);

    await updateProgress(draftId, "RENDER_PAGES", 70);
    const pagesDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "imports",
      draftId,
      "pages"
    );
    const renderedPages = await renderPdfPagesToPng(questionPdf, pagesDir);
    const pageMap = new Map(renderedPages.map((entry) => [entry.page, entry]));
    const publicRoot = path.join(process.cwd(), "public");
    const questionCrops = await computeQuestionCrops(questionPdf, 2);
    const cropsByPage = new Map<number, typeof questionCrops>();
    for (const crop of questionCrops) {
      const list = cropsByPage.get(crop.page) ?? [];
      list.push(crop);
      cropsByPage.set(crop.page, list);
    }

    const stemImageMap = new Map<number, string>();
    const stemFallbackMap = new Map<number, boolean>();
    for (const [page, crops] of cropsByPage) {
      const pagePath = path.join(pagesDir, `page-${page}.png`);
      const outputDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "imports",
        draftId,
        "questions"
      );
      const outputs = await cropQuestionImages({
        pageImagePath: pagePath,
        outputDir,
        crops,
        publicRoot,
        debug: process.env.NODE_ENV === "development",
      });
      for (const output of outputs) {
        stemImageMap.set(output.questionNo, output.url);
        const fallback = crops.find((crop) => crop.questionNo === output.questionNo)
          ?.fallback;
        if (fallback) {
          stemFallbackMap.set(output.questionNo, true);
        }
      }
    }

    await updateProgress(draftId, "SAVE_DRAFT", 90);

    const warnings: string[] = [];

    await prisma.$transaction(
      async (tx) => {
        await tx.importDraftQuestion.deleteMany({
          where: { draftId },
        });

        for (const question of questions) {
          const questionWarnings: string[] = [];
          const hasStemImage = stemImageMap.has(question.questionNo);
          if (!question.stem && !hasStemImage) {
            questionWarnings.push("Missing stem.");
          }
          if (!question.choices && !hasStemImage) {
            questionWarnings.push("Missing choices.");
          }
          if (stemFallbackMap.get(question.questionNo)) {
            questionWarnings.push("CROP_FALLBACK_FULL_PAGE");
          }
          if (!answers[question.questionNo]) {
            questionWarnings.push("Missing answer.");
          }

          if (questionWarnings.length > 0) {
            warnings.push(`Q${question.questionNo}: ${questionWarnings.join(" ")}`);
          }

          const created = await tx.importDraftQuestion.create({
            data: {
              draftId,
              questionNo: question.questionNo,
              type: "MCQ_SINGLE",
              stem: question.stem,
              correctAnswer: answers[question.questionNo] ?? null,
              sourcePage: question.sourcePage ? String(question.sourcePage) : null,
              stemImageUrl: stemImageMap.get(question.questionNo) ?? null,
              warnings: questionWarnings.length > 0 ? questionWarnings : undefined,
            },
          });

          const choiceEntries = question.choices
            ? [
                { label: "a", text: question.choices.a, sortOrder: 1 },
                { label: "b", text: question.choices.b, sortOrder: 2 },
                { label: "c", text: question.choices.c, sortOrder: 3 },
                { label: "d", text: question.choices.d, sortOrder: 4 },
              ]
            : hasStemImage
              ? [
                  { label: "a", text: "", sortOrder: 1 },
                  { label: "b", text: "", sortOrder: 2 },
                  { label: "c", text: "", sortOrder: 3 },
                  { label: "d", text: "", sortOrder: 4 },
                ]
              : [];

          if (choiceEntries.length > 0) {
            await tx.importDraftChoice.createMany({
              data: choiceEntries.map((choice) => ({
                draftQuestionId: created.id,
                label: choice.label,
                text: choice.text,
                sortOrder: choice.sortOrder,
              })),
            });
          }

          if (question.sourcePage) {
            const pageInfo = pageMap.get(question.sourcePage);
            if (pageInfo) {
              await tx.importDraftAttachment.create({
                data: {
                  draftQuestionId: created.id,
                  type: "IMAGE",
                  url: pageInfo.url,
                  caption: `Source page ${pageInfo.page}`,
                  width: pageInfo.width,
                  height: pageInfo.height,
                  sortOrder: 1,
                },
              });
            }
          }
        }
      },
      {
        timeout: 60000,
      }
    );

    const status: DraftStatus =
      warnings.length > 0 ? "NEEDS_REVIEW" : "READY_TO_PUBLISH";
    await finalizeDraft(draftId, status, [], warnings);
    return draftId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown import error.";
    await finalizeDraft(draftId, "FAILED", [message]);
    return draftId;
  } finally {
    await releaseLock(draftId);
  }
}

async function runWorkerLoop() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await processNextImportDraftOnce();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

const isMain = (() => {
  if (!process.argv[1]) {
    return false;
  }
  return import.meta.url === pathToFileURL(process.argv[1]).href;
})();

if (isMain) {
  runWorkerLoop().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
