import { NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { WorkoutPlanSchema } from "@/lib/schemas";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const COACH_INSTRUCTIONS = `You are an expert personal fitness coach. Generate a structured weekly workout plan tailored to the user's profile, fitness history, and goals.

Rules:
- Match intensity and volume to the user's experience level and recent session data.
- Respect equipment constraints and any physical limitations.
- Include warm-up notes where appropriate.
- Provide realistic rest periods.
- Use progressive overload principles based on previous weeks.
- Output exactly the JSON structure requested — no extra commentary.`;

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profileResult, sessionsResult, metricsResult] = await Promise.all([
    supabase.from("profile").select("*").eq("user_id", user.id).single(),
    supabase
      .from("workout_session")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(28),
    supabase
      .from("body_metric")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(14),
  ]);

  const profile = profileResult.data;
  const sessions = sessionsResult.data ?? [];
  const metrics = metricsResult.data ?? [];

  const userContext = JSON.stringify({ profile, recent_sessions: sessions, recent_metrics: metrics }, null, 2);

  async function callClaude() {
    return anthropic.messages.parse({
      model: MODEL,
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: COACH_INSTRUCTIONS,
          cache_control: { type: "ephemeral" },
        },
        {
          type: "text",
          text: `User profile and recent history:\n${userContext}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: "Generate the workout plan for next week based on my profile and recent history.",
        },
      ],
      output_config: {
        format: zodOutputFormat(WorkoutPlanSchema),
      },
    });
  }

  let result = await callClaude();

  if (result.parsed_output === null && result.stop_reason !== "refusal") {
    result = await callClaude();
  }

  if (!result.parsed_output) {
    return NextResponse.json({ error: "Failed to generate a valid plan" }, { status: 502 });
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday

  const { data: plan, error } = await supabase
    .from("workout_plan")
    .insert({
      user_id: user.id,
      week_start: weekStart.toISOString().split("T")[0],
      plan_json: result.parsed_output,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(plan);
}
