import { z } from "zod";

export const examSchema = z.object({
  code: z.string().trim().optional().nullable(),
  title: z.string().min(1, "Title is required."),
  session: z.string().min(1, "Session is required."),
  paper: z.string().min(1, "Paper is required."),
  language: z.string().min(1, "Language is required."),
});

export type ExamInput = z.infer<typeof examSchema>;
