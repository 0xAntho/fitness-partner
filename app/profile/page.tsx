"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";

type Profile = {
  goals: string;
  height_cm: string;
  age: string;
  sex: string;
  training_experience: string;
  equipment_available: string[];
  constraints: string;
  preferences: string;
};

const EQUIPMENT_OPTIONS = [
  "Barbell", "Dumbbells", "Kettlebells", "Pull-up bar",
  "Resistance bands", "Cable machine", "Smith machine",
  "Bodyweight only", "Full gym",
];

const defaultProfile: Profile = {
  goals: "",
  height_cm: "",
  age: "",
  sex: "",
  training_experience: "",
  equipment_available: [],
  constraints: "",
  preferences: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profile").select("*").eq("user_id", user.id).single();
      if (data) {
        setProfile({
          goals: data.goals ?? "",
          height_cm: data.height_cm?.toString() ?? "",
          age: data.age?.toString() ?? "",
          sex: data.sex ?? "",
          training_experience: data.training_experience ?? "",
          equipment_available: data.equipment_available ?? [],
          constraints: data.constraints ?? "",
          preferences: data.preferences ?? "",
        });
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profile").upsert({
      user_id: user.id,
      goals: profile.goals,
      height_cm: profile.height_cm ? parseFloat(profile.height_cm) : null,
      age: profile.age ? parseInt(profile.age) : null,
      sex: profile.sex || null,
      training_experience: profile.training_experience || null,
      equipment_available: profile.equipment_available,
      constraints: profile.constraints,
      preferences: profile.preferences,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleEquipment(item: string) {
    setProfile((p) => ({
      ...p,
      equipment_available: p.equipment_available.includes(item)
        ? p.equipment_available.filter((e) => e !== item)
        : [...p.equipment_available, item],
    }));
  }

  const field = (label: string, key: keyof Profile, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={profile[key] as string}
        onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
      />
    </div>
  );

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Goals</label>
          <textarea
            value={profile.goals}
            onChange={(e) => setProfile((p) => ({ ...p, goals: e.target.value }))}
            placeholder="e.g. Build muscle, lose fat, run a 10k..."
            rows={3}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-base resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field("Height (cm)", "height_cm", "number", "175")}
          {field("Age", "age", "number", "30")}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Sex</label>
          <select
            value={profile.sex}
            onChange={(e) => setProfile((p) => ({ ...p, sex: e.target.value }))}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
          >
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Experience</label>
          <div className="flex gap-2">
            {["beginner", "intermediate", "advanced"].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setProfile((p) => ({ ...p, training_experience: lvl }))}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  profile.training_experience === lvl
                    ? "bg-green-600 text-white"
                    : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Equipment available</label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((eq) => (
              <button
                key={eq}
                type="button"
                onClick={() => toggleEquipment(eq)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  profile.equipment_available.includes(eq)
                    ? "bg-green-600 text-white"
                    : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Injuries / constraints</label>
          <textarea
            value={profile.constraints}
            onChange={(e) => setProfile((p) => ({ ...p, constraints: e.target.value }))}
            placeholder="e.g. Bad knees, shoulder impingement, max 1h per session..."
            rows={2}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-base resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Preferences</label>
          <textarea
            value={profile.preferences}
            onChange={(e) => setProfile((p) => ({ ...p, preferences: e.target.value }))}
            placeholder="e.g. Prefer compound lifts, dislike running..."
            rows={2}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-base resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-3 text-white font-semibold text-base transition-colors"
        >
          {saved ? "Saved!" : saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </AppShell>
  );
}
