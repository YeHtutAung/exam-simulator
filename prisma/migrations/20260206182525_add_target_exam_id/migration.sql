-- AlterTable
ALTER TABLE "ImportDraft" ADD COLUMN     "targetExamId" UUID;

-- AddForeignKey
ALTER TABLE "ImportDraft" ADD CONSTRAINT "ImportDraft_targetExamId_fkey" FOREIGN KEY ("targetExamId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
