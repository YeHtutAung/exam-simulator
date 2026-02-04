import { z } from "zod";

export const choiceSchema = z.object({
  label: z.enum(["a", "b", "c", "d"]),
  text: z.string().min(1, "Choice text is required."),
  sortOrder: z.coerce.number().int().min(1),
});

export type ChoiceInput = z.infer<typeof choiceSchema>;
