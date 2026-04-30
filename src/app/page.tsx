"use client";

import { useState, useEffect } from "react";
import { ReportDocument, type ReportResponse } from "./components/ReportDocument";
import { ContextForm } from "./components/ContextForm";
import type { SessionState, Category } from "~/app/types/contextSchema";

type Phase = 'input' | 'context' | 'report';

interface ContextState {
  categoryLabel: Category;
  questions: string[];
  sessionState: SessionState;
}

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('input');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState<ContextState | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReportResponse | null>(null);
  const [reportHash, setReportHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [insufficient, setInsufficient] = useState<{ topics: string[]; message: string } | null>(null);
  const [insufficientShown, setInsufficientShown] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDebugMode(params.get('debug') === '1');
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

  async function generateReport(enrichedDescription: string) {
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrichedDescription }),
    });

    if (!res.ok) throw new Error('Request failed');

    const data = (await res.json()) as { status: string; hash?: string } & Record<string, unknown>;
    const { status: _status, hash: newHash, ...reportData } = data;
    if (newHash) {
      setReportHash(newHash);
      window.history.replaceState(null, '', `?hash=${newHash}`);
    }
    setResult(reportData as ReportResponse);
    setPhase('report');
  }

  async function handleSubmit(opts: { skipInsufficientCheck?: boolean } = {}) {
    if (!description.trim()) return;
    setLoading(true);
    setError('');
    setInsufficient(null);

    const skip = opts.skipInsufficientCheck ?? insufficientShown;

    try {
      const res = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, skipInsufficientCheck: skip }),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = (await res.json()) as
        | { status: 'questions'; categoryLabel: Category; questions: string[]; sessionState: SessionState }
        | { status: 'ready'; enrichedDescription: string }
        | { status: 'validation_failed'; classification: string; message: string }
        | { status: 'insufficient'; missingTopics: string[]; message: string };

      if (data.status === 'validation_failed') {
        setError(data.message);
        return;
      }

      if (data.status === 'insufficient') {
        setInsufficient({ topics: data.missingTopics, message: data.message });
        setInsufficientShown(true);
        return;
      }

      if (data.status === 'questions') {
        setContext({ categoryLabel: data.categoryLabel, questions: data.questions, sessionState: data.sessionState });
        setPhase('context');
      } else {
        await generateReport(data.enrichedDescription);
      }
    } catch {
      setError('Не удалось создать репорт. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }

  async function handleContextAnswer(answers: string[]) {
    if (!context) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionState: context.sessionState, answers }),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = (await res.json()) as
        | { status: 'questions'; categoryLabel: Category; questions: string[]; sessionState: SessionState }
        | { status: 'ready'; enrichedDescription: string };

      if (data.status === 'questions') {
        setContext({ categoryLabel: data.categoryLabel, questions: data.questions, sessionState: data.sessionState });
      } else {
        await generateReport(data.enrichedDescription);
      }
    } catch {
      setError('Не удалось создать репорт. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!reportHash || regenerating) return;
    setRegenerating(true);
    setError('');
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateHash: reportHash }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = (await res.json()) as { status: string; hash?: string } & Record<string, unknown>;
      const { status: _status, hash: _hash, ...reportData } = data;
      setResult(reportData as ReportResponse);
    } catch {
      setError('Не удалось перегенерировать репорт.');
    } finally {
      setRegenerating(false);
    }
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
    setContext(null);
    setResult(null);
    setError('');
    setReportHash(null);
    setInsufficient(null);
    setInsufficientShown(false);
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
          <div className="sticky top-0 z-10 flex items-center justify-end gap-2 px-4 py-2 bg-(--bg-card) border-b border-(--border)">
            {debugMode && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-(--text-secondary) hover:bg-(--bg-input) transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Перегенерировать с актуальными промптами (debug)"
              >
                {regenerating ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Перегенерация...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Перегенерировать
                  </>
                )}
              </button>
            )}
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

  if (phase === 'context' && context) {
    return (
      <main className="min-h-screen bg-(--bg-page) flex flex-col items-center justify-center px-4 py-12">
        {error && (
          <div className="w-full max-w-2xl mb-4 flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-[13px] text-(--error)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}
        <ContextForm
          categoryLabel={context.categoryLabel}
          questions={context.questions}
          sessionState={context.sessionState}
          isLoading={loading}
          onSubmit={handleContextAnswer}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--bg-page) flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-3">
          <h1 className="text-[32px] font-bold text-(--text-primary) tracking-tight leading-tight">
            Проверка решения
          </h1>
          <p className="text-[15px] text-(--text-secondary) max-w-lg leading-relaxed">
            Опишите сделку, партнёрство или инвестицию, которую вы рассматриваете. Сервис покажет, как устроена конструкция этого решения — кто что контролирует, какие обязательства возникают и что не зафиксировано.
          </p>
        </div>

        <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-(--shadow-card) p-6 flex flex-col gap-4">
          <textarea
            className="w-full min-h-56 resize-y rounded-xl border border-(--border) bg-(--bg-input) px-4 py-3.5 text-sm text-(--text-primary) placeholder-(--text-muted) leading-relaxed outline-none transition-all duration-150 focus:border-(--border-focus) focus:ring-3 focus:ring-(--accent)/10 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={"Опишите ситуацию: что за сделка, кто участвует, какие условия, что уже договорено...\n\nНапример: «Рассматриваю покупку 25% доли в автомойке за 800 тыс. Второй участник владеет остальные 75% и управляет. Прибыль делим пропорционально долям, но письменно это не закреплено.»"}
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

          {insufficient && !error && (
            <div className="flex flex-col gap-2.5 px-4 py-3.5 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-900">
              <div className="flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex flex-col gap-1.5">
                  <div className="font-semibold">Описание слишком скудное</div>
                  {insufficient.message && <div className="leading-relaxed">{insufficient.message}</div>}
                </div>
              </div>
              {insufficient.topics.length > 0 && (
                <div className="flex flex-col gap-1 pl-6">
                  <div className="text-[12px] font-medium text-amber-800">Не раскрыто:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-900 leading-relaxed">
                    {insufficient.topics.map((topic, i) => (
                      <li key={i}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="pl-6 text-[12px] text-amber-800 leading-relaxed">
                Дополните описание выше для более глубокого анализа или нажмите кнопку, чтобы продолжить с текущим вводом.
              </div>
            </div>
          )}

          <button
            onClick={() => handleSubmit()}
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
