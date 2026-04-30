"use client";

import { useState } from "react";
import { ReportDocument, type ReportResponse } from "../components/ReportDocument";

export default function TestPage() {
  const [enrichedDescription, setEnrichedDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReportResponse | null>(null);

  async function handleSubmit() {
    if (!enrichedDescription.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrichedDescription, skipCache: true }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Request failed");
      }

      const data = (await res.json()) as { status: string } & Record<string, unknown>;
      const { status: _status, hash: _hash, ...reportData } = data;
      setResult(reportData as ReportResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать репорт. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
  }

  if (result) {
    return (
      <main className="min-h-screen bg-(--bg-page)">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-(--bg-card) border-b border-(--border)">
          <span className="text-[12px] text-(--text-muted) px-2">test mode · cache bypassed · not saved</span>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-[13px] text-(--text-secondary) hover:bg-(--bg-input) transition-colors duration-150"
          >
            Назад к вводу
          </button>
        </div>
        <ReportDocument data={result} onBack={handleReset} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--bg-page) flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] font-bold text-(--text-primary) tracking-tight">
            Test: прямой репорт
          </h1>
          <p className="text-[13px] text-(--text-secondary) leading-relaxed">
            Вставьте готовый <code className="px-1 py-0.5 rounded bg-(--bg-input) text-[12px]">enrichedDescription</code> (исходное описание + блоки «## Категория …» с парами В/О).
            Кэш байпасится, результат не сохраняется в БД — удобно тестировать фиксы на одних и тех же данных.
          </p>
        </div>

        <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-(--shadow-card) p-6 flex flex-col gap-4">
          <textarea
            className="w-full min-h-[420px] resize-y rounded-xl border border-(--border) bg-(--bg-input) px-4 py-3.5 text-sm text-(--text-primary) placeholder-(--text-muted) leading-relaxed outline-none transition-all duration-150 focus:border-(--border-focus) focus:ring-3 focus:ring-(--accent)/10 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
            placeholder={"Опишите ситуацию...\n\n## Категория A\nВ: ...\nО: ...\n\n## Категория B\nВ: ...\nО: ..."}
            value={enrichedDescription}
            onChange={(e) => setEnrichedDescription(e.target.value)}
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
            disabled={loading || !enrichedDescription.trim()}
            className="w-full py-3 px-5 rounded-xl bg-(--accent) text-white text-[15px] font-semibold transition-colors duration-150 hover:bg-(--accent-hover) disabled:bg-(--text-muted) disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Генерация...
              </>
            ) : (
              "Сгенерировать репорт"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
