"use client";

import { useState, useEffect } from "react";
import type { ClarificationQuestion } from "~/app/types/clarificationSchema";

const PRIORITY_LABELS: Record<ClarificationQuestion['priority'], string> = {
  critical: 'Критично',
  important: 'Важно',
  structural: 'Дополнительно',
};

const PRIORITY_COLORS: Record<ClarificationQuestion['priority'], string> = {
  critical: 'bg-red-50 border-red-200 text-(--error)',
  important: 'bg-amber-50 border-amber-200 text-(--warning)',
  structural: 'bg-indigo-50 border-indigo-200 text-(--accent)',
};

interface Props {
  questions: ClarificationQuestion[];
  message: string;
  isLoading: boolean;
  onSubmit: (answers: { question: string; answer: string }[]) => void;
}

export function ClarificationForm({ questions, message, isLoading, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>(
    () => Object.fromEntries(questions.map((_, i) => [i, ''])),
  );

  useEffect(() => {
    setAnswers(Object.fromEntries(questions.map((_, i) => [i, ''])));
  }, [questions]);

  function handleChange(index: number, value: string) {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  }

  function handleSubmit() {
    if (isLoading) return;
    onSubmit(
      questions
        .map((q, i) => ({ question: q.question, answer: answers[i] ?? '' }))
        .filter((a) => a.answer.trim()),
    );
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-2">
        <h1 className="text-[32px] font-bold text-(--text-primary) tracking-tight leading-tight">
          Уточняющие вопросы
        </h1>
        <p className="text-[16px] text-(--text-secondary)">
          Ответьте на вопросы ниже, чтобы система смогла сформировать точный репорт
        </p>
      </div>

      <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-(--shadow-card) p-6 flex flex-col gap-5">
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 mt-0.5 text-(--accent)"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[13px] text-(--text-secondary) leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col gap-5">
          {questions.map((q, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5">
                <span
                  className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-md border ${PRIORITY_COLORS[q.priority]}`}
                >
                  {PRIORITY_LABELS[q.priority]}
                </span>
                <label
                  htmlFor={`q-${i}`}
                  className="text-[14px] font-medium text-(--text-primary) leading-snug"
                >
                  {q.question}
                </label>
              </div>
              <textarea
                id={`q-${i}`}
                rows={3}
                className="w-full resize-y rounded-xl border border-(--border) bg-(--bg-input) px-4 py-3 text-sm text-(--text-primary) placeholder-(--text-muted) leading-relaxed outline-none transition-all duration-150 focus:border-(--border-focus) focus:ring-3 focus:ring-(--accent)/10 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={q.priority === 'structural' ? 'Ваш ответ... (можно пропустить)' : 'Ваш ответ...'}
                value={answers[i] ?? ''}
                onChange={(e) => handleChange(i, e.target.value)}
                disabled={isLoading}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-3 px-5 rounded-xl bg-(--accent) text-white text-[15px] font-semibold transition-colors duration-150 hover:bg-(--accent-hover) disabled:bg-(--text-muted) disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-spin"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Анализ...
            </>
          ) : (
            'Отправить ответы'
          )}
        </button>
      </div>
    </div>
  );
}
