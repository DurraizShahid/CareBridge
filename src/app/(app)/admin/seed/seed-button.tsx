"use client";

import { useState } from "react";

interface SeedResult {
  success: boolean;
  message?: string;
  counts?: Record<string, number>;
  totalRecords?: number;
  error?: string;
}

export function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunSeed = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/seed", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || data.message || `Seed failed with status ${res.status}`);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run seed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleRunSeed}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Running Seed..." : "Run Seed"}
      </button>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded border border-green-300 bg-green-50 p-4 text-sm text-green-800 space-y-2">
          <p className="font-semibold">{result.message || "Database seeded successfully"}</p>
          {result.totalRecords !== undefined && (
            <p>Total records: {result.totalRecords}</p>
          )}
          {result.counts && (
            <div>
              <p className="font-medium mt-2 mb-1">Record Counts:</p>
              <ul className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(result.counts).map(([key, count]) => (
                  <li key={key} className="flex justify-between py-0.5 border-b border-green-200">
                    <span className="capitalize">{key}:</span>
                    <span className="font-mono font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
