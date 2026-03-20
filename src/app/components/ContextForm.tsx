"use client";

import { useState, useEffect } from "react";
import { CATEGORIES, type Category, type SessionState } from "~/app/types/contextSchema";

interface Props {
  categoryLabel: Category;
  questions: string[];
  sessionState: SessionState;
  isLoading: boolean;
  onSubmit: (answers: string[]) => void;
}

export function ContextForm({ categoryLabel, questions, isLoading, onSubmit }: Props) {
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));

  useEffect(() => {
    setAnswers(questions.map(() => ''));
  }, [questions]);

  function handleChange(index: number, value: string) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
  }

  function handleSubmit() {
    if (isLoading) return;
    onSubmit(answers);
  }

  const currentIndex = CATEGORIES.indexOf(categoryLabel);

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-2">
        <h1 className="text-[32px] font-bold text-(--text-primary) tracking-tight leading-tight">
          Уточняющие вопросы
        </h1>
        <p className="text-[16px] text-(--text-secondary)">
          Ответьте на вопросы ниже, чтобы система могла сформировать точный репорт
        </p>
      </div>

      <div className="flex items-center justify-center gap-0">
        {CATEGORIES.map((cat, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={cat} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold border transition-colors ${
                    isDone
                      ? 'bg-(--accent) border-(--accent) text-white'
                      : isCurrent
                        ? 'bg-(--accent) border-(--accent) text-white'
                        : 'bg-(--bg-input) border-(--border) text-(--text-muted)'
                  }`}
                >
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    cat
                  )}
                </div>
              </div>
              {i < CATEGORIES.length - 1 && (
                <div className={`w-12 h-px mx-1 ${i < currentIndex ? 'bg-(--accent)' : 'bg-(--border)'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-(--shadow-card) p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-5">
          {questions.map((q, i) => (
            <div key={i} className="flex flex-col gap-2">
              <label
                htmlFor={`q-${i}`}
                className="text-[14px] font-medium text-(--text-primary) leading-snug"
              >
                {q}
              </label>
              <textarea
                id={`q-${i}`}
                rows={3}
                className="w-full resize-y rounded-xl border border-(--border) bg-(--bg-input) px-4 py-3 text-sm text-(--text-primary) placeholder-(--text-muted) leading-relaxed outline-none transition-all duration-150 focus:border-(--border-focus) focus:ring-3 focus:ring-(--accent)/10 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Ваш ответ..."
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
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
