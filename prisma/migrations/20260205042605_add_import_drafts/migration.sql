-- CreateEnum
CREATE TYPE "ImportDraftStatus" AS ENUM ('DRAFT', 'READY', 'PUBLISHED', 'ERROR');

-- AlterTable
ALTER TABLE "Attachment" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Choice" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Exam" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ImportDraft" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "paper" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" "ImportDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "errors" JSONB,
    "warnings" JSONB,
    "publishedExamId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportDraftQuestion" (
    "id" UUID NOT NULL,
    "draftId" UUID NOT NULL,
    "questionNo" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MCQ_SINGLE',
    "stem" TEXT NOT NULL,
    "correctAnswer" TEXT,
    "sourcePage" TEXT,
    "warnings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportDraftQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportDraftChoice" (
    "id" UUID NOT NULL,
    "draftQuestionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ImportDraftChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportDraftAttachment" (
    "id" UUID NOT NULL,
    "draftQuestionId" UUID NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportDraftAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportDraftQuestion_draftId_questionNo_idx" ON "ImportDraftQuestion"("draftId", "questionNo");

-- CreateIndex
CREATE UNIQUE INDEX "ImportDraftQuestion_draftId_questionNo_key" ON "ImportDraftQuestion"("draftId", "questionNo");

-- CreateIndex
CREATE INDEX "ImportDraftChoice_draftQuestionId_idx" ON "ImportDraftChoice"("draftQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportDraftChoice_draftQuestionId_label_key" ON "ImportDraftChoice"("draftQuestionId", "label");

-- CreateIndex
CREATE INDEX "ImportDraftAttachment_draftQuestionId_idx" ON "ImportDraftAttachment"("draftQuestionId");

-- AddForeignKey
ALTER TABLE "ImportDraft" ADD CONSTRAINT "ImportDraft_publishedExamId_fkey" FOREIGN KEY ("publishedExamId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportDraftQuestion" ADD CONSTRAINT "ImportDraftQuestion_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ImportDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportDraftChoice" ADD CONSTRAINT "ImportDraftChoice_draftQuestionId_fkey" FOREIGN KEY ("draftQuestionId") REFERENCES "ImportDraftQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportDraftAttachment" ADD CONSTRAINT "ImportDraftAttachment_draftQuestionId_fkey" FOREIGN KEY ("draftQuestionId") REFERENCES "ImportDraftQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
