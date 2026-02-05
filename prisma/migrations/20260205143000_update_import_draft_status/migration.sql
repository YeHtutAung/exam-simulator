-- Update ImportDraftStatus enum values
ALTER TABLE "ImportDraft"
ALTER COLUMN "status"
DROP DEFAULT;

ALTER TYPE "ImportDraftStatus" RENAME TO "ImportDraftStatus_old";

CREATE TYPE "ImportDraftStatus" AS ENUM (
  'PARSING',
  'READY_TO_PUBLISH',
  'NEEDS_REVIEW',
  'FAILED'
);

ALTER TABLE "ImportDraft"
ALTER COLUMN "status"
TYPE "ImportDraftStatus"
USING (
  CASE "status"::text
    WHEN 'DRAFT' THEN 'PARSING'
    WHEN 'READY' THEN 'READY_TO_PUBLISH'
    WHEN 'PUBLISHED' THEN 'READY_TO_PUBLISH'
    WHEN 'ERROR' THEN 'FAILED'
    ELSE 'PARSING'
  END
)::"ImportDraftStatus";

ALTER TABLE "ImportDraft"
ALTER COLUMN "status"
SET DEFAULT 'PARSING';

DROP TYPE "ImportDraftStatus_old";
