import { z } from "zod";

export const importDraftSchema = z.object({
  examId: z.string().min(1, "Exam is required."),
  startPage: z.coerce.number().int().min(1).optional().nullable(),
});

export type ImportDraftInput = z.infer<typeof importDraftSchema>;
