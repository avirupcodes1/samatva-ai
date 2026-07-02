"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

export function WeeklySummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();
      setSummary(data.summary ?? "Could not generate a summary right now.");
    } catch {
      setSummary("Could not reach the summary service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <Sparkles size={18} className="text-accent" /> Your weekly reflection
        </h2>
        {!summary && (
          <button className="btn btn-soft text-sm" onClick={generate} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? "Writing…" : "Generate"}
          </button>
        )}
      </div>
      {summary ? (
        <p className="mt-3 text-sm leading-relaxed text-ink">{summary}</p>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">
          Ask Samatva to look over your week and share a short, encouraging reflection.
        </p>
      )}
    </div>
  );
}
