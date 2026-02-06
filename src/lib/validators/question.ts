import { z } from "zod";
import { attachmentSchema } from "./attachment";
import { choiceSchema } from "./choice";

export const questionSchema = z
  .object({
    questionNo: z.coerce.number().int().min(1, "Question number is required."),
    type: z.enum(["MCQ_SINGLE", "NUMERIC", "TEXT"]),
    stem: z.string().min(1, "Question stem is required."),
    stemImageUrl: z.string().optional().nullable(),
    correctAnswer: z.string().min(1, "Correct answer is required."),
    explanation: z.string().optional().nullable(),
    sourcePage: z.string().optional().nullable(),
    choices: z.array(choiceSchema).optional(),
    attachments: z.array(attachmentSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "MCQ_SINGLE") {
      if (!data.choices || data.choices.length !== 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "MCQ questions require four choices (a-d).",
          path: ["choices"],
        });
        return;
      }

      const labels = new Set(data.choices.map((choice) => choice.label));
      if (!["a", "b", "c", "d"].every((label) => labels.has(label))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "MCQ choices must include a-d.",
          path: ["choices"],
        });
      }

      const hasStemImage = Boolean(data.stemImageUrl);
      if (!hasStemImage) {
        for (const [index, choice] of data.choices.entries()) {
          if (!choice.text.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Choice text is required.",
              path: ["choices", index, "text"],
            });
          }
        }
      }
    }
  });

export type QuestionInput = z.infer<typeof questionSchema>;
