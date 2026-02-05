ALTER TABLE "ImportDraft"
ADD COLUMN "progressInt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "stage" TEXT,
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "finishedAt" TIMESTAMP(3),
ADD COLUMN "jobLockedAt" TIMESTAMP(3),
ADD COLUMN "jobLockedBy" TEXT,
ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "questionPdfPath" TEXT,
ADD COLUMN "answerPdfPath" TEXT;

CREATE INDEX "ImportDraft_status_jobLockedAt_idx"
ON "ImportDraft" ("status", "jobLockedAt");
