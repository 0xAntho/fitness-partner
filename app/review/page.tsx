"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

type Suggestion = {
  category: "exercise" | "recovery" | "nutrition" | "intensity";
  suggestion: string;
  rationale: string;
};

type Review = {
  id: string;
  week_start: string;
  summary_md: string;
  suggestions_json: Suggestion[];
  generated_at: string;
};

const categoryColors: Record<string, string> = {
  exercise: "text-blue-400 bg-blue-950 border-blue-800",
  recovery: "text-purple-400 bg-purple-950 border-purple-800",
  nutrition: "text-amber-400 bg-amber-950 border-amber-800",
  intensity: "text-red-400 bg-red-950 border-red-800",
};

export default function ReviewPage() {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/coach/review/latest")
      .then((r) => r.json())
      .then((data) => { if (data && !data.error) setReview(data); })
      .finally(() => setLoading(false));
  }, []);

  async function generate() {
    setGenerating(true);
    setError("");
    const r = await fetch("/api/coach/review", { method: "POST" });
    const data = await r.json();
    if (r.ok) {
      setReview(data);
    } else {
      setError(data.error ?? "Failed to generate review");
    }
    setGenerating(false);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20 text-zinc-500">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Weekly Review</h1>
        <button
          onClick={generate}
          disabled={generating}
          className="rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold transition-colors"
        >
          {generating ? "Generating…" : review ? "Regenerate" : "Generate"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {generating && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center">
          <p className="text-zinc-400 animate-pulse">Claude is reviewing your week…</p>
        </div>
      )}

      {!review && !generating && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center">
          <p className="text-zinc-400">No review yet. Log some sessions and generate your first review.</p>
        </div>
      )}

      {review && !generating && (
        <>
          <p className="text-zinc-500 text-sm mb-5">
            Week of {new Date(review.week_start + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </p>

          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 mb-5">
            <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{review.summary_md}</p>
          </div>

          {review.suggestions_json?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Suggestions</p>
              <div className="space-y-3">
                {review.suggestions_json.map((s, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${categoryColors[s.category] ?? "text-zinc-400 bg-zinc-900 border-zinc-800"}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{s.category}</span>
                    </div>
                    <p className="font-medium text-zinc-100 text-sm">{s.suggestion}</p>
                    <p className="text-zinc-400 text-xs mt-1">{s.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
