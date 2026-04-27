import FitParser from "fit-file-parser";
import type { GarminActivity } from "./parseCsv";

export async function parseGarminFit(buffer: ArrayBuffer): Promise<GarminActivity[]> {
  const parser = new FitParser({ force: true, speedUnit: "m/s" });
  const data = await parser.parseAsync(buffer);

  const sessions = data.sessions ?? [];

  return sessions.map((s) => {
    const startTime = s.start_time as Date | string | undefined;
    const date =
      startTime instanceof Date
        ? startTime.toISOString().split("T")[0]
        : String(startTime ?? "").split("T")[0];

    const raw = s as unknown as Record<string, unknown>;

    const durationS =
      typeof raw.total_elapsed_time === "number"
        ? Math.round(raw.total_elapsed_time)
        : null;

    const distanceM =
      typeof raw.total_distance === "number"
        ? Math.round(raw.total_distance)
        : null;

    const avgHr =
      typeof raw.avg_heart_rate === "number" ? raw.avg_heart_rate : null;

    const calories =
      typeof raw.total_calories === "number" ? raw.total_calories : null;

    const sportRaw = raw.sport ?? raw.activity_type ?? "unknown";

    return {
      date,
      type: String(sportRaw),
      duration_s: durationS,
      distance_m: distanceM,
      avg_hr: avgHr,
      calories: calories,
      raw_payload: raw,
    };
  });
}
