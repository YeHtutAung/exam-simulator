import { z } from "zod";

export const examSchema = z.object({
  code: z.string().trim().optional().nullable(),
  title: z.string().min(1, "Title is required."),
  session: z.string().min(1, "Session is required."),
  paper: z.string().min(1, "Paper is required."),
  language: z.string().min(1, "Language is required."),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Duration is required.")
    .max(600, "Duration must be 600 minutes or less."),
});

export type ExamInput = z.infer<typeof examSchema>;
