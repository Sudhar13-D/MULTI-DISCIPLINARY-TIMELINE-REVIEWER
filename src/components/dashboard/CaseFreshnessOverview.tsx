import React from "react";
import { FreshnessSummary } from "../../types";

interface CaseFreshnessOverviewProps {
  summary: FreshnessSummary | null;
  activeFilter?: string | null;
  onSelectFilter?: (filter: string | null) => void;
}

export default function CaseFreshnessOverview({
  summary,
  activeFilter,
  onSelectFilter,
}: CaseFreshnessOverviewProps) {
  if (!summary || summary.total_count === 0) return null;

  const { fresh_count, stale_count, missing_count, preliminary_count, superseded_count, total_count } = summary;

  const freshPct = (fresh_count / total_count) * 100;
  const stalePct = (stale_count / total_count) * 100;
  const prelimPct = (preliminary_count / total_count) * 100;
  const missingPct = (missing_count / total_count) * 100;

  return (
    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
          Evidence Freshness Overview
        </span>
        <span className="text-[10px] font-mono text-slate-500 font-medium">
          {total_count} total studies
        </span>
      </div>

      {/* Stacked Progress Bar */}
      <div className="h-2 w-full rounded-full overflow-hidden bg-slate-100 flex mb-2.5">
        <div style={{ width: `${freshPct}%` }} className="bg-emerald-500 h-full transition-all" title={`Fresh: ${fresh_count}`} />
        <div style={{ width: `${prelimPct}%` }} className="bg-amber-400 h-full transition-all" title={`Preliminary: ${preliminary_count}`} />
        <div style={{ width: `${stalePct}%` }} className="bg-red-500 h-full transition-all" title={`Stale: ${stale_count}`} />
        <div style={{ width: `${missingPct}%` }} className="bg-rose-700 h-full transition-all" title={`Missing: ${missing_count}`} />
      </div>

      {/* Metric Badges */}
      <div className="grid grid-cols-4 gap-1 text-center">
        <button
          type="button"
          onClick={() => onSelectFilter?.(activeFilter === "fresh" ? null : "fresh")}
          className={`px-1 py-1 rounded transition-colors cursor-pointer border ${
            activeFilter === "fresh" ? "bg-emerald-100 border-emerald-400" : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <div className="font-mono text-xs font-bold text-emerald-700">{fresh_count}</div>
          <div className="text-[9px] font-medium text-emerald-600">Fresh ✓</div>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter?.(activeFilter === "preliminary" ? null : "preliminary")}
          className={`px-1 py-1 rounded transition-colors cursor-pointer border ${
            activeFilter === "preliminary" ? "bg-amber-100 border-amber-400" : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="font-mono text-xs font-bold text-amber-700">{preliminary_count}</div>
          <div className="text-[9px] font-medium text-amber-600">Prelim ⚠</div>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter?.(activeFilter === "stale" ? null : "stale")}
          className={`px-1 py-1 rounded transition-colors cursor-pointer border ${
            activeFilter === "stale" ? "bg-red-100 border-red-400" : "bg-red-50 border-red-200"
          }`}
        >
          <div className="font-mono text-xs font-bold text-red-700">{stale_count}</div>
          <div className="text-[9px] font-medium text-red-600">Stale ⚠⚠</div>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter?.(activeFilter === "missing" ? null : "missing")}
          className={`px-1 py-1 rounded transition-colors cursor-pointer border ${
            activeFilter === "missing" ? "bg-rose-200 border-rose-400" : "bg-rose-50 border-rose-200"
          }`}
        >
          <div className="font-mono text-xs font-bold text-rose-800">{missing_count}</div>
          <div className="text-[9px] font-medium text-rose-700">Missing ✗</div>
        </button>
      </div>
    </div>
  );
}
