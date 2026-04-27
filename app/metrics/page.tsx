"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Metric = {
  id: string;
  date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  water_pct: number | null;
  source: string;
};

type Form = {
  date: string;
  weight_kg: string;
  body_fat_pct: string;
  muscle_mass_kg: string;
  water_pct: string;
};

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [form, setForm] = useState<Form>({ date: today(), weight_kg: "", body_fat_pct: "", muscle_mass_kg: "", water_pct: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const r = await fetch("/api/metrics?limit=90");
    const data = await r.json();
    if (Array.isArray(data)) setMetrics(data.reverse());
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, unknown> = { date: form.date, source: "manual" };
    if (form.weight_kg) body.weight_kg = parseFloat(form.weight_kg);
    if (form.body_fat_pct) body.body_fat_pct = parseFloat(form.body_fat_pct);
    if (form.muscle_mass_kg) body.muscle_mass_kg = parseFloat(form.muscle_mass_kg);
    if (form.water_pct) body.water_pct = parseFloat(form.water_pct);

    await fetch("/api/metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await load();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setForm({ date: today(), weight_kg: "", body_fat_pct: "", muscle_mass_kg: "", water_pct: "" });
  }

  const chartData = metrics
    .filter((m) => m.weight_kg != null)
    .map((m) => ({ date: m.date.slice(5), weight: m.weight_kg }));

  const numInput = (label: string, key: keyof Form, placeholder: string, unit: string) => (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-3 pr-10 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">{unit}</span>
      </div>
    </div>
  );

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Body Metrics</h1>

      {/* Weight chart */}
      {chartData.length > 1 && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Weight trend</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 11 }}
                domain={["auto", "auto"]}
                width={36}
              />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                labelStyle={{ color: "#a1a1aa" }}
                itemStyle={{ color: "#4ade80" }}
              />
              <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {numInput("Weight", "weight_kg", "75.0", "kg")}
          {numInput("Body fat", "body_fat_pct", "18.0", "%")}
          {numInput("Muscle mass", "muscle_mass_kg", "60.0", "kg")}
          {numInput("Water", "water_pct", "55.0", "%")}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-3 text-white font-semibold text-base transition-colors"
        >
          {saved ? "Saved!" : saving ? "Saving…" : "Log metrics"}
        </button>
      </form>

      {/* History */}
      {metrics.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">History</p>
          <div className="space-y-2">
            {metrics.slice().reverse().slice(0, 30).map((m) => (
              <div key={m.id} className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-zinc-400">{m.date}</span>
                <div className="flex gap-4 text-sm">
                  {m.weight_kg != null && <span>{m.weight_kg.toFixed(1)} kg</span>}
                  {m.body_fat_pct != null && <span className="text-zinc-400">{m.body_fat_pct.toFixed(1)}% fat</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
