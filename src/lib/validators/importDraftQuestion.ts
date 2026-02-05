import { z } from "zod";

export const importDraftQuestionSchema = z.object({
  stem: z.string().min(1, "Stem is required."),
  correctAnswer: z.enum(["a", "b", "c", "d"]),
  choices: z.object({
    a: z.string().min(1, "Choice A is required."),
    b: z.string().min(1, "Choice B is required."),
    c: z.string().min(1, "Choice C is required."),
    d: z.string().min(1, "Choice D is required."),
  }),
});

export type ImportDraftQuestionInput = z.infer<typeof importDraftQuestionSchema>;
