import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { parseGarminCsv } from "@/lib/garmin/parseCsv";
import { parseGarminFit } from "@/lib/garmin/parseFit";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const fileName = file.name.toLowerCase();
  let activities;

  if (fileName.endsWith(".csv")) {
    const text = await file.text();
    activities = parseGarminCsv(text);
  } else if (fileName.endsWith(".fit")) {
    const buffer = await file.arrayBuffer();
    activities = await parseGarminFit(buffer);
  } else {
    return NextResponse.json({ error: "Unsupported file type — use .csv or .fit" }, { status: 400 });
  }

  if (activities.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: 0 });
  }

  // Deduplicate against existing rows by (user_id, date, type)
  const rows = activities
    .filter((a) => a.date && a.type)
    .map((a) => ({
      user_id: user.id,
      date: a.date,
      type: a.type,
      duration_s: a.duration_s,
      distance_m: a.distance_m,
      avg_hr: a.avg_hr,
      calories: a.calories,
      raw_payload: a.raw_payload,
    }));

  const { data, error } = await supabase
    .from("garmin_activity")
    .upsert(rows, { onConflict: "user_id,date,type", ignoreDuplicates: true })
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    inserted: data?.length ?? 0,
    total_parsed: activities.length,
  });
}
