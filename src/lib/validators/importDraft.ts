import { z } from "zod";

export const importDraftSchema = z.object({
  title: z.string().min(1, "Title is required."),
  session: z.string().min(1, "Session is required."),
  paper: z.string().min(1, "Paper is required."),
  language: z.string().min(1, "Language is required."),
});

export type ImportDraftInput = z.infer<typeof importDraftSchema>;
