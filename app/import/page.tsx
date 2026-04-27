"use client";
export const dynamic = "force-dynamic";

import { useRef, useState } from "react";
import AppShell from "@/components/AppShell";

type ImportResult = {
  inserted: number;
  total_parsed: number;
};

export default function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);

    const r = await fetch("/api/garmin/import", { method: "POST", body: fd });
    const data = await r.json();

    if (r.ok) {
      setResult(data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } else {
      setError(data.error ?? "Import failed");
    }
    setUploading(false);
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-2">Import Garmin data</h1>
      <p className="text-zinc-400 text-sm mb-6">
        Export from Garmin Connect → Activities → Export CSV, or download a .fit file.
      </p>

      <div
        className="rounded-xl border-2 border-dashed border-zinc-700 p-8 text-center cursor-pointer hover:border-zinc-500 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dropped = e.dataTransfer.files[0];
          if (dropped) setFile(dropped);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.fit"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-4xl mb-3">📁</p>
        {file ? (
          <p className="text-zinc-200 font-medium">{file.name}</p>
        ) : (
          <>
            <p className="text-zinc-300 font-medium">Drop a .csv or .fit file here</p>
            <p className="text-zinc-500 text-sm mt-1">or tap to browse</p>
          </>
        )}
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full mt-4 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-3 text-white font-semibold text-base transition-colors"
        >
          {uploading ? "Importing…" : "Import file"}
        </button>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-red-950 border border-red-800 p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-xl bg-green-950 border border-green-800 p-4">
          <p className="text-green-300 font-medium">Import complete</p>
          <p className="text-green-400 text-sm mt-1">
            {result.inserted} new activities added ({result.total_parsed} parsed, duplicates skipped)
          </p>
        </div>
      )}

      <div className="mt-8 rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">How to export from Garmin Connect</p>
        <ol className="text-zinc-400 text-sm space-y-1 list-decimal list-inside">
          <li>Open Garmin Connect on desktop</li>
          <li>Go to Activities → All Activities</li>
          <li>Click the gear icon → Export to CSV</li>
          <li>Upload the downloaded file here</li>
        </ol>
      </div>
    </AppShell>
  );
}
