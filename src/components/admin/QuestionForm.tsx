"use client";

import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionSchema, QuestionInput } from "@/lib/validators/question";
import { useRouter } from "next/navigation";

type QuestionFormProps = {
  examId?: string;
  action: string;
  method: "POST" | "PUT";
  submitLabel: string;
  initialData?: Partial<QuestionInput> & { choices?: QuestionInput["choices"] };
};

const defaultChoices = [
  { label: "a", text: "", sortOrder: 1 },
  { label: "b", text: "", sortOrder: 2 },
  { label: "c", text: "", sortOrder: 3 },
  { label: "d", text: "", sortOrder: 4 },
];

export function QuestionForm({
  examId,
  action,
  method,
  submitLabel,
  initialData,
}: QuestionFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const choicesDefaults = useMemo(() => {
    if (initialData?.choices && initialData.choices.length > 0) {
      return initialData.choices;
    }
    return defaultChoices;
  }, [initialData?.choices]);

  const form = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema),
    shouldUnregister: true,
    defaultValues: {
      questionNo: initialData?.questionNo ?? 1,
      type: initialData?.type ?? "MCQ_SINGLE",
      stem: initialData?.stem ?? "",
      stemImageUrl: initialData?.stemImageUrl ?? "",
      correctAnswer: initialData?.correctAnswer ?? "",
      explanation: initialData?.explanation ?? "",
      sourcePage: initialData?.sourcePage ?? "",
      choices: choicesDefaults,
      attachments: initialData?.attachments ?? [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    control,
  } = form;

  const { fields: attachmentFields, append, remove } = useFieldArray({
    control,
    name: "attachments",
  });

  const type = watch("type");
  const stemImageUrl = watch("stemImageUrl");
  const hasStemImage = Boolean(stemImageUrl);

  const onSubmit = async (values: QuestionInput) => {
    setError(null);
    const payload = {
      ...values,
      examId,
      choices: values.type === "MCQ_SINGLE" ? values.choices : [],
    };
    const response = await fetch(action, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Failed to save question.");
      return;
    }

    if (examId) {
      router.push(`/admin/exams/${examId}/questions`);
    } else {
      router.back();
    }
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <input type="hidden" {...register("stemImageUrl")} />
        <label className="space-y-1 text-sm">
          <span className="font-medium">Question No</span>
          <input
            type="number"
            {...register("questionNo", { valueAsNumber: true })}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
          />
          {errors.questionNo && (
            <span className="text-xs text-red-600">{errors.questionNo.message}</span>
          )}
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Type</span>
          <select
            {...register("type")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
          >
            <option value="MCQ_SINGLE">MCQ_SINGLE</option>
            <option value="NUMERIC">NUMERIC</option>
            <option value="TEXT">TEXT</option>
          </select>
        </label>
        {hasStemImage ? (
          <input type="hidden" {...register("stem")} />
        ) : (
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Stem</span>
            <textarea
              {...register("stem")}
              rows={5}
              className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            />
            {errors.stem && (
              <span className="text-xs text-red-600">{errors.stem.message}</span>
            )}
          </label>
        )}
        <label className="space-y-1 text-sm">
          <span className="font-medium">Correct Answer</span>
          <input
            {...register("correctAnswer")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="b / 42 / text"
          />
          {errors.correctAnswer && (
            <span className="text-xs text-red-600">{errors.correctAnswer.message}</span>
          )}
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Source Page</span>
          <input
            {...register("sourcePage")}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
            placeholder="Optional"
          />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium">Explanation</span>
          <textarea
            {...register("explanation")}
            rows={3}
            className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2"
          />
        </label>
      </div>

      {type === "MCQ_SINGLE" && !hasStemImage && (
        <section className="space-y-3 rounded-2xl border border-sand-300 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Choices</h3>
          {choicesDefaults.map((choice, index) => (
            <label key={choice.label} className="block text-sm">
              <span className="mb-1 block font-medium uppercase text-slate-600">
                {choice.label}
              </span>
              <input
                {...register(`choices.${index}.text`)}
                className="w-full rounded-lg border border-sand-300 px-3 py-2"
                placeholder={`Choice ${choice.label}`}
              />
              <input type="hidden" {...register(`choices.${index}.label`)} value={choice.label} />
              <input
                type="hidden"
                {...register(`choices.${index}.sortOrder`)}
                value={choice.sortOrder}
              />
              {errors.choices?.[index]?.text && (
                <span className="text-xs text-red-600">
                  {errors.choices[index]?.text?.message}
                </span>
              )}
            </label>
          ))}
        </section>
      )}
      {type === "MCQ_SINGLE" && hasStemImage && (
        <div className="hidden">
          {choicesDefaults.map((choice, index) => (
            <div key={choice.label}>
              <input type="hidden" {...register(`choices.${index}.text`)} />
              <input
                type="hidden"
                {...register(`choices.${index}.label`)}
                value={choice.label}
              />
              <input
                type="hidden"
                {...register(`choices.${index}.sortOrder`)}
                value={choice.sortOrder}
              />
            </div>
          ))}
        </div>
      )}

      <section className="space-y-3 rounded-2xl border border-sand-300 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Attachments</h3>
          <button
            type="button"
            onClick={() =>
              append({
                type: "IMAGE",
                url: "",
                caption: "",
                width: undefined,
                height: undefined,
                sortOrder: attachmentFields.length + 1,
              })
            }
            className="text-xs font-semibold text-accent hover:text-slate-900"
          >
            Add attachment
          </button>
        </div>
        {attachmentFields.length === 0 && (
          <p className="text-xs text-slate-500">No attachments added yet.</p>
        )}
        {attachmentFields.map((field, index) => (
          <div key={field.id} className="grid gap-3 rounded-xl border border-sand-300 p-3 md:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span className="font-medium">Type</span>
              <select
                {...register(`attachments.${index}.type`)}
                className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
              >
                <option value="IMAGE">IMAGE</option>
                <option value="PDF_SNIP">PDF_SNIP</option>
                <option value="TABLE_IMAGE">TABLE_IMAGE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>
            <label className="space-y-1 text-xs md:col-span-2">
              <span className="font-medium">URL</span>
              <input
                {...register(`attachments.${index}.url`)}
                className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs md:col-span-2">
              <span className="font-medium">Caption</span>
              <input
                {...register(`attachments.${index}.caption`)}
                className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Width</span>
              <input
                type="number"
                {...register(`attachments.${index}.width`)}
                className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Height</span>
              <input
                type="number"
                {...register(`attachments.${index}.height`)}
                className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium">Sort Order</span>
              <input
                type="number"
                {...register(`attachments.${index}.sortOrder`)}
                className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs font-semibold text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  );
}
