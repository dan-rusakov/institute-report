"use client";

import { useState } from "react";
import { JsonViewer } from "./components/JsonViewer";

export default function HomePage() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function handleSubmit() {
    if (!description.trim()) return;

    setLoading(true);
    setError("");
    setDuplicate(false);
    setResult(null);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (res.status === 409) {
        setDuplicate(true);
        return;
      }
      if (!res.ok) throw new Error("Request failed");

      const data = (await res.json()) as Record<string, unknown>;
      setResult(data);
      setDescription("");
    } catch {
      setError("Не удалось создать репорт. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={`min-h-screen bg-(--bg-page) flex flex-col items-center px-4 transition-all duration-300 ${result ? "justify-start py-12" : "justify-center py-6"
        }`}
    >
      <div
        className={`w-full transition-all duration-300 ${result ? "max-w-3xl" : "max-w-lg"
          }`}
      >
        <div className="mb-9 flex flex-col items-center text-center gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-(--text-primary) tracking-tight leading-tight">
              Генерация репорта
            </h1>
            <p className="mt-1.5 text-[15px] text-(--text-secondary)">
              Опишите запрос, и система автоматически сформирует отчёт
            </p>
          </div>
        </div>

        <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-(--shadow-card) p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-(--text-secondary) tracking-wide">
              Описание запроса
            </label>
            <textarea
              className="w-full min-h-36 resize-y rounded-xl border border-(--border) bg-(--bg-input) px-3.5 py-3 text-sm text-(--text-primary) placeholder-(--text-muted) leading-relaxed outline-none transition-all duration-150 focus:border-(--border-focus) focus:ring-3 focus:ring-(--accent)/10 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Введите запрос для генерации репорта..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {duplicate && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-(--warning)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Репорт по этому запросу уже существует
            </div>
          )}

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
            className="w-full py-2.5 px-5 rounded-xl bg-(--accent) text-white text-sm font-semibold transition-colors duration-150 hover:bg-(--accent-hover) disabled:bg-(--text-muted) disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Генерация...
              </>
            ) : (
              "Сгенерировать репорт"
            )}
          </button>
        </div>

        {result && (
          <div className="mt-4 bg-(--bg-card) rounded-2xl border border-(--border) shadow-(--shadow-card) overflow-hidden">
            <div className="px-5 py-4 border-b border-(--border) flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-(--text-primary)">Результат</span>
              </div>
              <button
                onClick={() => setResult(null)}
                className="text-[13px] text-(--text-muted) hover:text-(--text-secondary) hover:bg-(--bg-input) px-2 py-1 rounded-md transition-colors duration-150"
              >
                Закрыть
              </button>
            </div>
            <div className="p-5 max-h-[600px] overflow-y-auto">
              <JsonViewer data={result} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
