-- AlterTable
ALTER TABLE "ImportDraftQuestion" ADD COLUMN     "topic" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "topic" TEXT;

-- CreateIndex
CREATE INDEX "Question_topic_idx" ON "Question"("topic");
