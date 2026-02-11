"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExamRunnerQuestion } from "@/components/ExamRunnerQuestion";

type Choice = {
  label: "a" | "b" | "c" | "d";
  text: string;
};

type Question = {
  id: string;
  questionNo: number;
  stem: string;
  stemImageUrl?: string | null;
  correctAnswer: "a" | "b" | "c" | "d";
  choices: Choice[];
};

type ResumeData = {
  attemptId: string;
  startedAt: string;
  answers: Record<string, string>;
};

type ExamRunnerProps = {
  examId: string;
  title: string;
  questions: Question[];
  durationSeconds: number;
  persistAttempts?: boolean;
  enableTimer?: boolean;
  randomIds?: string[];
  summaryRedirectHref?: string;
  resumeData?: ResumeData | null;
};

type StoredRun = {
  startedAt: string;
  durationSeconds: number;
  answers: Record<string, "a" | "b" | "c" | "d" | null>;
  attemptId?: string | null;
  submittedAt?: string;
  timeUp?: boolean;
};

const formatTime = (totalSeconds: number) => {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}`;
};

export function ExamRunner({
  examId,
  title,
  questions,
  durationSeconds,
  persistAttempts = true,
  enableTimer = true,
  randomIds,
  summaryRedirectHref = "/",
  resumeData,
}: ExamRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, "a" | "b" | "c" | "d" | null>>(
    {},
  );
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const leaveGuardRef = useRef(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRef = useRef<
    Map<string, { questionId: string; chosenOption: string; timeSpentSec?: number }>
  >(new Map());
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const attemptIdRef = useRef<string | null>(null);

  const total = questions.length;
  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);
  const currentNumber = currentIndex + 1;
  const storageKey = `examRunner:${examId}`;

  useEffect(() => {
    if (examId !== "random" || !randomIds || randomIds.length === 0) return;
    const currentIds = searchParams.get("ids");
    if (currentIds) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("mode", "random");
    next.set("ids", randomIds.join(","));
    router.replace(`/exam-runner?${next.toString()}`);
  }, [examId, randomIds, router, searchParams]);

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value as "a" | "b" | "c" | "d",
    }));
    pendingRef.current.set(currentQuestion.id, {
      questionId: currentQuestion.id,
      chosenOption: value,
    });
    scheduleFlush();
  };

  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < total - 1;
  const showSubmit = total > 0 && currentIndex === total - 1;

  const unansweredQuestions = useMemo(
    () => questions.filter((question) => !answers[question.id]),
    [answers, questions],
  );

  const summary = useMemo(() => {
    const answered = questions.filter((question) => answers[question.id]).length;
    const unanswered = questions.length - answered;
    const correct = questions.filter((question) => {
      const answer = answers[question.id];
      return answer && answer === question.correctAnswer;
    }).length;
    return { answered, unanswered, correct };
  }, [answers, questions]);

  const persistRun = (data: StoredRun) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const flushPending = async (overrideAttemptId?: string | null) => {
    const id = overrideAttemptId ?? attemptIdRef.current;
    if (!id || pendingRef.current.size === 0) return;
    const batch = Array.from(pendingRef.current.values());
    try {
      setSaveStatus("saving");
      const response = await fetch(`/api/attempts/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: batch }),
      });
      if (!response.ok) {
        setSaveStatus("error");
        return;
      }
      for (const answer of batch) {
        pendingRef.current.delete(answer.questionId);
      }
      setSaveStatus("saved");
      setLastSavedAt(new Date().toISOString());
    } catch {
      // keep pending for retry
      setSaveStatus("error");
    }
  };

  const scheduleFlush = () => {
    if (examId === "demo") return;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
    }
    flushTimerRef.current = setTimeout(() => {
      flushPending();
    }, 900);
  };

  const finalizeSubmit = async (reason: "manual" | "timeUp") => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const submittedAt = new Date().toISOString();
    if (shouldPersist && attemptIdRef.current) {
      await flushPending(attemptIdRef.current);
      const durationSec =
        startedAt ? Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)) : undefined;
      await fetch(`/api/attempts/${attemptIdRef.current}/submit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finishedAt: submittedAt, durationSec }),
      }).catch(() => null);
    }
    const payload: StoredRun = {
      startedAt: startedAt ?? submittedAt,
      durationSeconds,
      answers,
      attemptId: attemptIdRef.current,
      submittedAt,
      timeUp: reason === "timeUp",
    };
    persistRun(payload);
    if (shouldPersist) {
      leaveGuardRef.current = false;
      router.push("/dashboard");
      return;
    }
    setIsSummaryOpen(true);
  };

  const handleSubmitClick = () => {
    if (unansweredQuestions.length === 0) {
      finalizeSubmit("manual");
      return;
    }
    setIsModalOpen(true);
  };

  const handleReviewUnanswered = () => {
    if (unansweredQuestions.length === 0) {
      setIsModalOpen(false);
      return;
    }
    const firstUnanswered = unansweredQuestions[0];
    const targetIndex = questions.findIndex((question) => question.id === firstUnanswered.id);
    setCurrentIndex(targetIndex >= 0 ? targetIndex : 0);
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    // If resumeData is provided (server-side resume), use it instead of localStorage
    if (resumeData) {
      setAttemptId(resumeData.attemptId);
      attemptIdRef.current = resumeData.attemptId;
      setStartedAt(resumeData.startedAt);
      setAnswers(
        Object.fromEntries(
          Object.entries(resumeData.answers).map(([k, v]) => [k, v as "a" | "b" | "c" | "d"])
        ),
      );
      const elapsedSec = Math.floor(
        (Date.now() - new Date(resumeData.startedAt).getTime()) / 1000,
      );
      setRemainingSeconds(Math.max(0, durationSeconds - elapsedSec));
      setIsHydrated(true);
      return;
    }
    const storedRaw = window.localStorage.getItem(storageKey);
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw) as StoredRun;
        if (parsed.submittedAt) {
          window.localStorage.removeItem(storageKey);
        } else {
          setAnswers(parsed.answers ?? {});
          setStartedAt(parsed.startedAt ?? new Date().toISOString());
          setRemainingSeconds(parsed.durationSeconds ?? durationSeconds);
          setAttemptId(parsed.attemptId ?? null);
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setIsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationSeconds, storageKey]);

  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  const shouldPersist = persistAttempts && examId !== "demo";
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    examId
  );

  useEffect(() => {
    if (!isHydrated || !shouldPersist || !isUuid) return;
    if (attemptId) return;
    const createAttempt = async () => {
      setAttemptError(null);
      try {
        const response = await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examId,
            mode: "EXAM",
            totalQuestions: questions.length,
            metadata: { title },
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to create attempt");
        }
        const payload = (await response.json()) as { attempt?: { id: string } };
        const createdId = payload.attempt?.id ?? null;
        setAttemptId(createdId);
        attemptIdRef.current = createdId;
        if (createdId) {
          flushPending(createdId);
        }
      } catch {
        setAttemptError("Unable to start attempt. Please refresh.");
      }
    };
    createAttempt();
  }, [attemptId, examId, isHydrated, isUuid, questions.length, shouldPersist, title]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!startedAt) {
      const now = new Date().toISOString();
      setStartedAt(now);
      persistRun({
        startedAt: now,
        durationSeconds,
        answers,
        attemptId,
      });
      return;
    }
    persistRun({
      startedAt,
      durationSeconds,
      answers,
      attemptId,
    });
  }, [answers, durationSeconds, isHydrated, startedAt, attemptId]);

  useEffect(() => {
    if (!isHydrated || !startedAt || !enableTimer) return;
    const startMs = new Date(startedAt).getTime();
    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - startMs) / 1000);
      const nextRemaining = Math.max(durationSeconds - elapsedSeconds, 0);
      setRemainingSeconds(nextRemaining);
      if (nextRemaining === 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTimeUp(true);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [durationSeconds, enableTimer, isHydrated, startedAt]);

  useEffect(() => {
    if (!timeUp || !enableTimer) return;
    finalizeSubmit("timeUp");
  }, [enableTimer, timeUp]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isModalOpen]);

  useEffect(() => {
    if (!isSummaryOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseSummary();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isSummaryOpen]);

  // --- Navigation guards ---
  const isGuardActive = isHydrated && !isSubmitting && !isSummaryOpen;

  // beforeunload — warns when closing/refreshing tab
  useEffect(() => {
    if (!isGuardActive) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isGuardActive]);

  // popstate — intercepts browser back/forward
  useEffect(() => {
    if (!isGuardActive) return;
    // Push a sentinel entry so pressing back fires popstate instead of leaving
    history.pushState({ examGuard: true }, "");
    const handler = () => {
      if (!leaveGuardRef.current) return;
      // Re-push sentinel to keep the user on the page
      history.pushState({ examGuard: true }, "");
      setIsLeaveModalOpen(true);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [isGuardActive]);

  const handleLeaveConfirm = () => {
    setIsLeaveModalOpen(false);
    leaveGuardRef.current = false;
    history.go(-1);
  };

  const activePillRef = useCallback((node: HTMLButtonElement | null) => {
    node?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [currentIndex]);

  const handleCloseSummary = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
    setIsSummaryOpen(false);
    router.replace(summaryRedirectHref);
  };

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col">
      {attemptError && (
        <div className="mb-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {attemptError}
        </div>
      )}
      <header className="shrink-0 flex items-center gap-4 border-b border-sand-300 pb-2 text-sm">
        <h1 className="font-semibold">{title}</h1>
        <span className="text-slate-500">
          Question {currentNumber} of {total}
        </span>
        {shouldPersist && (
          <span className="text-xs text-slate-400">
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "error"
                ? "Save failed"
                : saveStatus === "saved"
                  ? `Saved${lastSavedAt ? ` ${new Date(lastSavedAt).toLocaleTimeString()}` : ""}`
                  : "Ready"}
          </span>
        )}
        {enableTimer && (
          <span
            className={`ml-auto font-semibold ${
              !timeUp && remainingSeconds <= 20 * 60 ? "text-rose-600" : "text-slate-700"
            }`}
          >
            {timeUp ? "Time is up" : formatTime(remainingSeconds)}
          </span>
        )}
      </header>

      {/* Scrollable question number strip */}
      <div className="shrink-0 overflow-x-auto py-3">
        <div className="flex gap-1.5">
          {questions.map((q, i) => {
            const isActive = i === currentIndex;
            const isAnswered = Boolean(answers[q.id]);
            return (
              <button
                key={q.id}
                ref={isActive ? activePillRef : undefined}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`shrink-0 h-8 w-8 rounded-full text-xs font-semibold transition ${
                  isActive
                    ? "bg-accent text-white"
                    : isAnswered
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-sand-200 text-slate-600 hover:bg-sand-300"
                }`}
              >
                {q.questionNo}
              </button>
            );
          })}
        </div>
      </div>

      <section className="min-h-0 flex-1 py-4">
        {currentQuestion ? (
          <ExamRunnerQuestion
            key={currentQuestion.id}
            questionId={currentQuestion.id}
            stem={currentQuestion.stem}
            stemImageUrl={currentQuestion.stemImageUrl ?? null}
            choices={currentQuestion.choices}
            selected={answers[currentQuestion.id]}
            onChange={handleSelect}
          />
        ) : (
          <p className="text-sm text-slate-600">No questions available.</p>
        )}
      </section>

      <nav className="shrink-0 border-t border-sand-300 bg-sand py-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={!canGoBack}
            className="rounded-full border border-sand-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          {showSubmit ? (
            <button
              type="button"
              onClick={handleSubmitClick}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
            >
              Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(total - 1, prev + 1))}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
            >
              Next
            </button>
          )}
        </div>
      </nav>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Unanswered questions"
            className="w-full max-w-lg rounded-2xl border border-sand-300 bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">Unanswered questions</h2>
            <p className="mt-2 text-sm text-slate-600">
              You have {unansweredQuestions.length} unanswered question
              {unansweredQuestions.length === 1 ? "" : "s"}.
            </p>
            <p className="mt-3 text-sm text-slate-700">
              {unansweredQuestions.map((question) => question.questionNo).join(", ")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReviewUnanswered}
                className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Review unanswered
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  finalizeSubmit("manual");
                }}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
              >
                Submit anyway
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isSummaryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={handleCloseSummary}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Practice summary"
            className="w-full max-w-lg rounded-2xl border border-sand-300 bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">Practice summary</h2>
            <p className="mt-2 text-sm text-slate-600">
              Random practice results (not saved).
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-700">
              <span>Total: {questions.length}</span>
              <span>Answered: {summary.answered}</span>
              <span>Unanswered: {summary.unanswered}</span>
              <span>
                Score: {summary.correct} / {questions.length}
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCloseSummary}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isLeaveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => setIsLeaveModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Leave exam"
            className="w-full max-w-lg rounded-2xl border border-sand-300 bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">Leave exam?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your progress is saved, but the timer keeps running. Are you sure you want to leave?
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={handleLeaveConfirm}
                className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
