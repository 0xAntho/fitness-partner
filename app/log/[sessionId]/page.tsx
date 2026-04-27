"use client";
export const dynamic = "force-dynamic";

import { use, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";

type SetEntry = { reps: string; weight_kg: string; done: boolean };
type ExerciseLog = { name: string; sets: SetEntry[] };

type PlanDay = {
  day: string;
  focus: string;
  exercises: { name: string; sets: number; reps: number | string; rest_seconds: number; notes?: string }[];
};

export default function SessionLogPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<{ plan_id: string | null; date: string; day_index: number | null } | null>(null);
  const [planDay, setPlanDay] = useState<PlanDay | null>(null);
  const [log, setLog] = useState<ExerciseLog[]>([]);
  const [effort, setEffort] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load session + plan
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(async (sessions: { id: string; plan_id: string | null; date: string; day_index: number | null; performed_exercises_json: unknown[] }[]) => {
        const s = sessions.find((x) => x.id === sessionId);
        if (!s) return;
        setSession(s);

        if (s.plan_id != null) {
          const pr = await fetch(`/api/plan/latest`).then((r) => r.json());
          if (pr?.plan_json?.days && s.day_index != null) {
            const day: PlanDay = pr.plan_json.days[s.day_index];
            setPlanDay(day);
            // Initialize log from plan
            setLog(
              day.exercises.map((ex) => ({
                name: ex.name,
                sets: Array.from({ length: ex.sets }, () => ({ reps: String(ex.reps), weight_kg: "", done: false })),
              }))
            );
          }
        }

        // If there's already performed data, load it
        if (s.performed_exercises_json?.length) {
          setLog(s.performed_exercises_json as ExerciseLog[]);
        }
      });
  }, [sessionId]);

  function updateSet(exIdx: number, setIdx: number, field: "reps" | "weight_kg", value: string) {
    setLog((prev) => {
      const next = prev.map((e, i) =>
        i === exIdx
          ? { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)) }
          : e
      );
      return next;
    });
  }

  function toggleSet(exIdx: number, setIdx: number) {
    setLog((prev) =>
      prev.map((e, i) =>
        i === exIdx
          ? { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, done: !s.done } : s)) }
          : e
      )
    );
  }

  async function save(completed: boolean) {
    setSaving(true);
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sessionId,
        performed_exercises_json: log,
        perceived_effort: effort,
        completed,
      }),
    });
    setSaving(false);
    if (completed) router.push("/");
  }

  if (!session) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20 text-zinc-500">Loading session…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{planDay?.focus ?? "Session"}</h1>
        <p className="text-zinc-400 text-sm mt-0.5">{session.date}</p>
      </div>

      <div className="space-y-6 mb-8">
        {log.map((ex, exIdx) => (
          <div key={exIdx} className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="font-semibold">{ex.name}</p>
            </div>
            <div className="p-3 space-y-2">
              {ex.sets.map((s, setIdx) => (
                <div key={setIdx} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSet(exIdx, setIdx)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      s.done ? "bg-green-600 border-green-600 text-white" : "border-zinc-600"
                    }`}
                  >
                    {s.done && <span className="text-xs">✓</span>}
                  </button>
                  <span className="text-zinc-500 text-sm w-12">Set {setIdx + 1}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="kg"
                    value={s.weight_kg}
                    onChange={(e) => updateSet(exIdx, setIdx, "weight_kg", e.target.value)}
                    className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-zinc-100 placeholder-zinc-600 text-center text-base focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-zinc-500 text-sm">×</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="reps"
                    value={s.reps}
                    onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                    className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-zinc-100 placeholder-zinc-600 text-center text-base focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Effort */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Perceived effort: <span className="text-green-400 font-bold">{effort}/10</span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={effort}
          onChange={(e) => setEffort(Number(e.target.value))}
          className="w-full accent-green-500"
        />
        <div className="flex justify-between text-xs text-zinc-600 mt-1">
          <span>Easy</span>
          <span>Max effort</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="flex-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 px-4 py-3 text-zinc-200 font-semibold text-base transition-colors"
        >
          Save & continue
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving}
          className="flex-1 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-3 text-white font-semibold text-base transition-colors"
        >
          {saving ? "Saving…" : "Complete"}
        </button>
      </div>
    </AppShell>
  );
}
