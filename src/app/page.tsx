"use client";

import { useState, useEffect } from "react";
import { ReportDocument, type ReportResponse } from "./components/ReportDocument";
import { ClarificationForm } from "./components/ClarificationForm";
import type { ClarificationQuestion } from "~/app/types/clarificationSchema";

type Phase = 'input' | 'clarifying' | 'report';

interface ClarificationState {
  questions: ClarificationQuestion[];
  message: string;
}

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('input');
  const [description, setDescription] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');
  const [previousAnswers, setPreviousAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [clarification, setClarification] = useState<ClarificationState | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReportResponse | null>(null);
  const [reportHash, setReportHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = params.get('hash');
    if (!hash) return;

    setInitializing(true);

    fetch(`/api/report?hash=${hash}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json() as Promise<{ status: string; hash?: string } & Record<string, unknown>>;
      })
      .then((data) => {
        const { status: _status, hash: h, ...reportData } = data;
        setResult(reportData as ReportResponse);
        setReportHash(h ?? hash);
        setPhase('report');
      })
      .catch(() => {
        window.history.replaceState(null, '', window.location.pathname);
      })
      .finally(() => setInitializing(false));
  }, []);

  async function callApi(desc: string, answers: { question: string; answer: string }[]) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, previousAnswers: answers }),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = (await res.json()) as { status: string; hash?: string } & Record<string, unknown>;

      if (data.status === 'clarification_needed') {
        setClarification({
          questions: data.questions as ClarificationQuestion[],
          message: data.message_to_user as string,
        });
        setPhase('clarifying');
      } else {
        const { status: _status, hash: newHash, ...reportData } = data;
        if (newHash) {
          setReportHash(newHash);
          window.history.replaceState(null, '', `?hash=${newHash}`);
        }
        setResult(reportData as ReportResponse);
        setPhase('report');
      }
    } catch {
      setError('Не удалось создать репорт. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!description.trim()) return;
    setOriginalDescription(description);
    setPreviousAnswers([]);
    await callApi(description, []);
  }

  async function handleClarificationSubmit(answers: { question: string; answer: string }[]) {
    const merged = [...previousAnswers, ...answers];
    setPreviousAnswers(merged);
    await callApi(originalDescription, merged);
  }

  async function handleCopyLink() {
    if (!reportHash) return;
    const url = `${window.location.origin}?hash=${reportHash}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setPhase('input');
    setDescription('');
    setOriginalDescription('');
    setPreviousAnswers([]);
    setClarification(null);
    setResult(null);
    setError('');
    setReportHash(null);
    window.history.replaceState(null, '', window.location.pathname);
  }

  if (initializing) {
    return (
      <main className="min-h-screen bg-(--bg-page) flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-(--text-muted)">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </main>
    );
  }

  if (phase === 'report' && result) {
    return (
      <main className="min-h-screen bg-(--bg-page)">
        {reportHash && (
          <div className="sticky top-0 z-10 flex items-center justify-end px-4 py-2 bg-(--bg-card) border-b border-(--border)">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-(--text-secondary) hover:bg-(--bg-input) transition-colors duration-150"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-(--accent)">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Скопировано
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  Поделиться репортом
                </>
              )}
            </button>
          </div>
        )}
        <ReportDocument data={result} onBack={handleReset} />
      </main>
    );
  }

  if (phase === 'clarifying' && clarification) {
    return (
      <main className="min-h-screen bg-(--bg-page) flex flex-col items-center justify-center px-4 py-12">
        <ClarificationForm
          questions={clarification.questions}
          message={clarification.message}
          isLoading={loading}
          onSubmit={handleClarificationSubmit}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--bg-page) flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-2">
          <h1 className="text-[32px] font-bold text-(--text-primary) tracking-tight leading-tight">
            Генерация репорта
          </h1>
          <p className="text-[16px] text-(--text-secondary)">
            Опишите запрос, и система автоматически сформирует структурный отчёт
          </p>
        </div>

        <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-(--shadow-card) p-6 flex flex-col gap-4">
          <textarea
            className="w-full min-h-56 resize-y rounded-xl border border-(--border) bg-(--bg-input) px-4 py-3.5 text-sm text-(--text-primary) placeholder-(--text-muted) leading-relaxed outline-none transition-all duration-150 focus:border-(--border-focus) focus:ring-3 focus:ring-(--accent)/10 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Введите описание кейса для генерации структурного репорта..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />

          {error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-[13px] text-(--error)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !description.trim()}
            className="w-full py-3 px-5 rounded-xl bg-(--accent) text-white text-[15px] font-semibold transition-colors duration-150 hover:bg-(--accent-hover) disabled:bg-(--text-muted) disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Анализ...
              </>
            ) : (
              'Сгенерировать репорт'
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
