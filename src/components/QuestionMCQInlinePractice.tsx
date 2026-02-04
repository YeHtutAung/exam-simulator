"use client";

import { useState } from "react";
import { QuestionMCQInline } from "@/components/QuestionMCQInline";

type Choice = {
  label: "a" | "b" | "c" | "d";
  text: string;
};

type QuestionMCQInlinePracticeProps = {
  questionId: string;
  stem: string;
  choices: Choice[];
  disabled?: boolean;
};

export function QuestionMCQInlinePractice({
  questionId,
  stem,
  choices,
  disabled,
}: QuestionMCQInlinePracticeProps) {
  const [selected, setSelected] = useState<string | undefined>();

  return (
    <QuestionMCQInline
      questionId={questionId}
      stem={stem}
      choices={choices}
      selected={selected}
      onChange={setSelected}
      disabled={disabled}
    />
  );
}
