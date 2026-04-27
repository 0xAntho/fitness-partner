import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
export const dynamic = "force-dynamic";
import AppShell from "@/components/AppShell";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  const [planResult, metricsResult, reviewResult] = await Promise.all([
    supabase
      .from("workout_plan")
      .select("id, week_start, plan_json")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("body_metric")
      .select("date, weight_kg")
      .eq("user_id", user.id)
      .gte("date", sevenDaysAgo)
      .order("date", { ascending: false }),
    supabase
      .from("coach_review")
      .select("week_start, summary_md")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const plan = planResult.data;
  const metrics = metricsResult.data ?? [];
  const review = reviewResult.data;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[new Date().getDay()];
  const planDays = (plan?.plan_json as { days?: { day: string; focus: string; exercises: unknown[] }[] })?.days ?? [];
  const todayWorkout = planDays.find((d) => d.day === todayName);

  const latestWeight = metrics[0]?.weight_kg;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </h1>

      {/* Today's Workout */}
      <section className="mb-6">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Today</h2>
          {!plan ? (
            <div className="space-y-2">
              <p className="text-zinc-400 text-sm">No workout plan yet.</p>
              <Link href="/plan" className="inline-block text-sm text-green-400 hover:text-green-300 font-medium">
                Generate your first plan →
              </Link>
            </div>
          ) : todayWorkout ? (
            <div>
              <p className="font-semibold text-lg">{todayWorkout.focus}</p>
              <p className="text-zinc-400 text-sm mt-0.5">{todayWorkout.exercises.length} exercises</p>
              <Link href="/plan" className="inline-block mt-3 text-sm text-green-400 hover:text-green-300 font-medium">
                View plan →
              </Link>
            </div>
          ) : (
            <p className="text-zinc-400 text-sm">Rest day — recovery is training too.</p>
          )}
        </div>
      </section>

      {/* Weight Snapshot */}
      <section className="mb-6">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Weight (7 days)</h2>
          {latestWeight ? (
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{latestWeight.toFixed(1)}</span>
              <span className="text-zinc-400 mb-0.5">kg</span>
              {metrics.length > 1 && metrics[metrics.length - 1].weight_kg != null && (
                <span className={`text-sm mb-0.5 ml-2 ${latestWeight <= metrics[metrics.length - 1].weight_kg! ? "text-green-400" : "text-zinc-400"}`}>
                  {(latestWeight - metrics[metrics.length - 1].weight_kg!).toFixed(1)} kg
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-zinc-400 text-sm">No weight logged this week.</p>
              <Link href="/metrics" className="inline-block text-sm text-green-400 hover:text-green-300 font-medium">
                Log today →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Last Review */}
      {review && (
        <section className="mb-6">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Last Review</h2>
            <p className="text-zinc-300 text-sm line-clamp-3">{review.summary_md?.split("\n")[0]}</p>
            <Link href="/review" className="inline-block mt-2 text-sm text-green-400 hover:text-green-300 font-medium">
              Read full review →
            </Link>
          </div>
        </section>
      )}

      <section>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/metrics" className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors">
            <span className="text-2xl">⚖️</span>
            <p className="text-sm font-medium mt-2">Log weight</p>
          </Link>
          <Link href="/import" className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors">
            <span className="text-2xl">📥</span>
            <p className="text-sm font-medium mt-2">Import Garmin</p>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
