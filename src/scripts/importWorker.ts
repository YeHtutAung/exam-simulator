import "dotenv/config";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { prisma } from "../lib/prisma";
import { parseFeAnswerPdf } from "../../lib/importer/feAnswerParser";
import { parseFeQuestionPdf } from "../../lib/importer/feQuestionParser";
import { renderPdfPagesToPng } from "../lib/importer/pdfPageRenderer";
import {
  extractQuestionCrops,
  cropQuestionImagesFromPage,
} from "../lib/importer/pdfQuestionImageExtractor";

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
    const crops = await extractQuestionCrops(questionPdf, 2);
    const cropMap = new Map(crops.map((crop) => [crop.questionNo, crop]));
    const publicRoot = path.join(process.cwd(), "public");

    await updateProgress(draftId, "SAVE_DRAFT", 90);

    const warnings: string[] = [];
    const preparedQuestions: Array<{
      questionNo: number;
      stem: string;
      correctAnswer: string | null;
      sourcePage: string | null;
      warnings: string[] | undefined;
      choices: Array<{ label: string; text: string; sortOrder: number }>;
      attachments: Array<{
        type: "IMAGE";
        url: string;
        caption: string;
        width: number;
        height: number;
        sortOrder: number;
      }>;
    }> = [];

    for (const question of questions) {
      const questionWarnings: string[] = [];
      if (!question.stem) {
        questionWarnings.push("Missing stem.");
      }
      if (!question.choices) {
        questionWarnings.push("Missing choices.");
      }
      if (!answers[question.questionNo]) {
        questionWarnings.push("Missing answer.");
      }

      if (questionWarnings.length > 0) {
        warnings.push(`Q${question.questionNo}: ${questionWarnings.join(" ")}`);
      }

      const choices = question.choices
        ? [
            { label: "a", text: question.choices.a, sortOrder: 1 },
            { label: "b", text: question.choices.b, sortOrder: 2 },
            { label: "c", text: question.choices.c, sortOrder: 3 },
            { label: "d", text: question.choices.d, sortOrder: 4 },
          ]
        : [];

      const attachments: Array<{
        type: "IMAGE";
        url: string;
        caption: string;
        width: number;
        height: number;
        sortOrder: number;
      }> = [];

      const crop = cropMap.get(question.questionNo);
      if (crop) {
        const pageInfo = pageMap.get(crop.page);
        if (pageInfo) {
          const outputDir = path.join(
            process.cwd(),
            "public",
            "uploads",
            "imports",
            draftId,
            "questions",
            `q-${question.questionNo}`
          );
          const outputs = await cropQuestionImagesFromPage(
            path.join(pagesDir, `page-${crop.page}.png`),
            outputDir,
            crop
          );
          for (const output of outputs) {
            let urlPath = output.filePath
              .replace(publicRoot, "")
              .split(path.sep)
              .join("/");
            if (!urlPath.startsWith("/")) {
              urlPath = `/${urlPath}`;
            }
            attachments.push({
              type: "IMAGE",
              url: urlPath,
              caption: output.role,
              width: output.width,
              height: output.height,
              sortOrder:
                output.role === "STEM"
                  ? 1
                  : output.role === "CHOICE_A"
                    ? 2
                    : output.role === "CHOICE_B"
                      ? 3
                      : output.role === "CHOICE_C"
                        ? 4
                        : 5,
            });
          }
        }
      }

      preparedQuestions.push({
        questionNo: question.questionNo,
        stem: question.stem,
        correctAnswer: answers[question.questionNo] ?? null,
        sourcePage: question.sourcePage ? String(question.sourcePage) : null,
        warnings: questionWarnings.length > 0 ? questionWarnings : undefined,
        choices,
        attachments,
      });
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.importDraftQuestion.deleteMany({
          where: { draftId },
        });

        for (const entry of preparedQuestions) {
          const created = await tx.importDraftQuestion.create({
            data: {
              draftId,
              questionNo: entry.questionNo,
              type: "MCQ_SINGLE",
              stem: entry.stem,
              correctAnswer: entry.correctAnswer,
              sourcePage: entry.sourcePage,
              warnings: entry.warnings,
            },
          });

          if (entry.choices.length > 0) {
            await tx.importDraftChoice.createMany({
              data: entry.choices.map((choice) => ({
                draftQuestionId: created.id,
                label: choice.label,
                text: choice.text,
                sortOrder: choice.sortOrder,
              })),
            });
          }

          if (entry.attachments.length > 0) {
            await tx.importDraftAttachment.createMany({
              data: entry.attachments.map((attachment) => ({
                draftQuestionId: created.id,
                type: attachment.type,
                url: attachment.url,
                caption: attachment.caption,
                width: attachment.width,
                height: attachment.height,
                sortOrder: attachment.sortOrder,
              })),
            });
          }
        }
      },
      { timeout: 20000 }
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
