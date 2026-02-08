-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "durationSec" INTEGER,
ADD COLUMN     "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "AttemptAnswer" ADD COLUMN     "answeredAt" TIMESTAMP(3);
