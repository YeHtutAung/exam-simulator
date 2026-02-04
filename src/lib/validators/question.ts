import { z } from "zod";
import { attachmentSchema } from "./attachment";
import { choiceSchema } from "./choice";

export const questionSchema = z
  .object({
    questionNo: z.coerce.number().int().min(1, "Question number is required."),
    type: z.enum(["MCQ_SINGLE", "NUMERIC", "TEXT"]),
    stem: z.string().min(1, "Question stem is required."),
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
      }
    }
  });

export type QuestionInput = z.infer<typeof questionSchema>;
