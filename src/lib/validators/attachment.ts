import { z } from "zod";

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}, z.number().int().positive().optional());

export const attachmentSchema = z.object({
  type: z.enum(["IMAGE", "PDF_SNIP", "TABLE_IMAGE", "OTHER"]),
  url: z.string().url(),
  caption: z.string().optional().nullable(),
  width: optionalNumber,
  height: optionalNumber,
  sortOrder: z.coerce.number().int().min(1),
});

export type AttachmentInput = z.infer<typeof attachmentSchema>;
