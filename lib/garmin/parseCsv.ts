import Papa from "papaparse";

export interface GarminActivity {
  date: string;
  type: string;
  duration_s: number | null;
  distance_m: number | null;
  avg_hr: number | null;
  calories: number | null;
  raw_payload: Record<string, unknown>;
}

function parseHHMMSS(val: string): number | null {
  if (!val) return null;
  const parts = val.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

function parseNum(val: string): number | null {
  const n = parseFloat(val?.replace(",", "."));
  return isNaN(n) ? null : n;
}

export function parseGarminCsv(csvText: string): GarminActivity[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return data.map((row) => {
    const dateRaw = row["Date"] ?? row["date"] ?? "";
    const date = dateRaw.split(" ")[0]; // strip time portion if present

    const durationRaw = row["Time"] ?? row["Duration"] ?? row["Moving Time"] ?? "";
    const distanceRaw = row["Distance"] ?? "";
    const distanceKm = parseNum(distanceRaw);

    return {
      date,
      type: row["Activity Type"] ?? row["Type"] ?? "Unknown",
      duration_s: parseHHMMSS(durationRaw),
      distance_m: distanceKm != null ? Math.round(distanceKm * 1000) : null,
      avg_hr: parseNum(row["Avg HR"] ?? row["Average HR"] ?? ""),
      calories: parseNum(row["Calories"] ?? ""),
      raw_payload: row as Record<string, unknown>,
    };
  });
}
