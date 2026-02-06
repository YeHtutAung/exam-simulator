import { z } from "zod";

export const importDraftSchema = z.object({
  examId: z.string().min(1, "Exam is required."),
});

export type ImportDraftInput = z.infer<typeof importDraftSchema>;
