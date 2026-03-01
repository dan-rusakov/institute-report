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
      className={`flex min-h-screen flex-col items-center bg-linear-to-b from-[#2e026d] to-[#15162c] ${
        result ? "justify-start py-12" : "justify-center"
      }`}
    >
      <div
        className={`w-full px-4 transition-all duration-300 ${
          result ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        <h1 className="mb-8 text-center text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Генерация репорта
        </h1>

        <div className="flex flex-col gap-4 rounded-2xl bg-white/10 p-6 backdrop-blur">
          <label className="text-sm font-medium text-white/70">
            Описание запроса
          </label>
          <textarea
            className="min-h-40 w-full resize-y rounded-xl bg-white/10 p-4 text-white placeholder-white/30 outline-none ring-1 ring-white/20 transition focus:ring-2 focus:ring-[hsl(280,100%,70%)]"
            placeholder="Введите запрос для генерации репорта..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
          {duplicate && (
            <p className="text-sm text-yellow-400">
              Репорт по этому запросу уже существует.
            </p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading || !description.trim()}
            className="rounded-xl bg-[hsl(280,100%,70%)] px-6 py-3 font-semibold text-white transition hover:bg-[hsl(280,100%,60%)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Генерация..." : "Сгенерировать репорт"}
          </button>
        </div>

        {result && (
          <div className="mt-6 rounded-2xl bg-white/10 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Результат</h2>
              <button
                onClick={() => setResult(null)}
                className="text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Закрыть
              </button>
            </div>
            <div className="max-h-[600px] overflow-y-auto pr-1">
              <JsonViewer data={result} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
