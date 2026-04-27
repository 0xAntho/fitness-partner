import { NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { CoachReviewSchema } from "@/lib/schemas";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const REVIEW_INSTRUCTIONS = `You are an expert personal fitness coach performing a weekly review. Analyze the user's workout sessions, body metrics, and Garmin activities from the past week.

Provide:
1. A concise markdown summary (3-5 paragraphs) covering adherence, performance trends, recovery signals, and body composition changes.
2. 3-5 specific, actionable suggestions covering exercise adjustments, recovery, nutrition, or intensity.

Be direct and evidence-based. Reference specific data points from the user's logs.`;

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const since = oneWeekAgo.toISOString().split("T")[0];

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const [sessionsResult, metricsResult, activitiesResult, profileResult] = await Promise.all([
    supabase.from("workout_session").select("*").eq("user_id", user.id).gte("date", since),
    supabase.from("body_metric").select("*").eq("user_id", user.id).gte("date", since),
    supabase.from("garmin_activity").select("*").eq("user_id", user.id).gte("date", since),
    supabase.from("profile").select("*").eq("user_id", user.id).single(),
  ]);

  const weekData = JSON.stringify({
    profile: profileResult.data,
    sessions: sessionsResult.data ?? [],
    body_metrics: metricsResult.data ?? [],
    garmin_activities: activitiesResult.data ?? [],
  }, null, 2);

  async function callClaude() {
    return anthropic.messages.parse({
      model: MODEL,
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: REVIEW_INSTRUCTIONS,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Here is my data from the past week:\n${weekData}\n\nPlease generate my weekly review.`,
        },
      ],
      output_config: {
        format: zodOutputFormat(CoachReviewSchema),
      },
    });
  }

  let result = await callClaude();
  if (result.parsed_output === null && result.stop_reason !== "refusal") {
    result = await callClaude();
  }

  if (!result.parsed_output) {
    return NextResponse.json({ error: "Failed to generate review" }, { status: 502 });
  }

  const { data: review, error } = await supabase
    .from("coach_review")
    .upsert(
      {
        user_id: user.id,
        week_start: weekStartStr,
        summary_md: result.parsed_output.summary_markdown,
        suggestions_json: result.parsed_output.suggestions,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,week_start" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(review);
}
