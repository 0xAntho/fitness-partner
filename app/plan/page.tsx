"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

type Exercise = {
  name: string;
  sets: number;
  reps: number | string;
  rest_seconds: number;
  notes?: string;
};

type WorkoutDay = {
  day: string;
  focus: string;
  exercises: Exercise[];
};

type Plan = {
  id: string;
  week_start: string;
  plan_json: {
    week_label: string;
    days: WorkoutDay[];
    weekly_notes: string;
  };
};

export default function PlanPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plan/latest")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setPlan(data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function generate() {
    setGenerating(true);
    setError("");
    const r = await fetch("/api/plan/generate", { method: "POST" });
    const data = await r.json();
    if (r.ok) {
      setPlan(data);
    } else {
      setError(data.error ?? "Failed to generate plan");
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

  const days = plan?.plan_json?.days ?? [];

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Workout Plan</h1>
        <button
          onClick={generate}
          disabled={generating}
          className="rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold transition-colors"
        >
          {generating ? "Generating…" : plan ? "Regenerate" : "Generate"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {!plan && !generating && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center">
          <p className="text-zinc-400 mb-4">No plan yet. Fill in your profile and generate one.</p>
        </div>
      )}

      {generating && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 text-center">
          <p className="text-zinc-400 animate-pulse">Claude is building your plan…</p>
        </div>
      )}

      {plan && !generating && (
        <>
          <p className="text-zinc-500 text-sm mb-4">
            Week of {new Date(plan.week_start + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </p>

          <div className="space-y-3">
            {days.map((day) => (
              <div key={day.day} className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => setExpanded(expanded === day.day ? null : day.day)}
                >
                  <div>
                    <span className="font-semibold">{day.day}</span>
                    <span className="text-zinc-400 text-sm ml-2">{day.focus}</span>
                  </div>
                  <span className="text-zinc-500 text-sm">{expanded === day.day ? "▲" : "▼"}</span>
                </button>

                {expanded === day.day && (
                  <div className="border-t border-zinc-800 px-4 py-3 space-y-4">
                    {day.exercises.map((ex, i) => (
                      <div key={i}>
                        <p className="font-medium">{ex.name}</p>
                        <p className="text-zinc-400 text-sm">
                          {ex.sets} × {ex.reps} · {ex.rest_seconds}s rest
                        </p>
                        {ex.notes && <p className="text-zinc-500 text-xs mt-0.5">{ex.notes}</p>}
                      </div>
                    ))}
                    {plan.plan_json.weekly_notes && days[days.length - 1] === day && (
                      <div className="pt-2 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500">{plan.plan_json.weekly_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
