import React from "react";
import { TimelineEvent, PatientCase, FreshnessSummary } from "../../types";
import FreshnessIndicator from "../evidence/FreshnessIndicator";
import CaseFreshnessOverview from "../dashboard/CaseFreshnessOverview";

interface UnifiedTimelineViewProps {
  patientCase: PatientCase;
  events: TimelineEvent[];
  freshnessSummary: FreshnessSummary | null;
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  onDrillDown: (event: TimelineEvent) => void;
  activeCategories: string[];
  onToggleCategory: (cat: string) => void;
  activeFreshnessFilter: string | null;
  onSelectFreshnessFilter: (filter: string | null) => void;
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  imaging: { label: "Imaging", color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
  pathology: { label: "Pathology", color: "#0f766e", bg: "rgba(15,118,110,0.08)" },
  molecular: { label: "Molecular", color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
  review: { label: "MDT Review", color: "#b45309", bg: "rgba(180,83,9,0.08)" },
};

export default function UnifiedTimelineView({
  patientCase,
  events,
  freshnessSummary,
  selectedEventId,
  onSelectEvent,
  onDrillDown,
  activeCategories,
  onToggleCategory,
  activeFreshnessFilter,
  onSelectFreshnessFilter,
}: UnifiedTimelineViewProps) {
  const filteredEvents = events.filter(e => {
    // Filter by category
    const cat = e.event_type.toLowerCase();
    const matchesCat = activeCategories.includes(cat) || (cat === "review" && activeCategories.includes("review"));
    if (!matchesCat) return false;

    // Filter by freshness state if selected
    if (activeFreshnessFilter && e.freshness_badge.state !== activeFreshnessFilter) {
      return false;
    }

    return true;
  });

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100/70 min-w-0">
      {/* Category Filter & Freshness Bar */}
      <div className="p-3 bg-white border-b border-slate-200 space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold mr-1">
              Category:
            </span>
            {["imaging", "pathology", "molecular", "review"].map(cat => {
              const active = activeCategories.includes(cat);
              const meta = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => onToggleCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "shadow-2xs"
                      : "opacity-45 bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                  style={{
                    color: active ? meta.color : undefined,
                    borderColor: active ? `${meta.color}50` : undefined,
                    backgroundColor: active ? meta.bg : undefined,
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 whitespace-nowrap">
            <span>
              Showing {filteredEvents.length} of {events.length} studies
            </span>
          </div>
        </div>

        {/* Overview Progress bar */}
        <CaseFreshnessOverview
          summary={freshnessSummary}
          activeFilter={activeFreshnessFilter}
          onSelectFilter={onSelectFreshnessFilter}
        />
      </div>

      {/* Patient Case Banner */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-start justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-xs font-bold text-slate-800">
              {patientCase.patient_de_id}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">
              {patientCase.age}y {patientCase.sex} · Ref: {patientCase.referring_dept}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold uppercase">
              {patientCase.urgency}
            </span>
          </div>
          <h1 className="text-base font-bold text-slate-900 font-display">
            {patientCase.primary_dx}
          </h1>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-[10px] font-mono uppercase text-slate-400">Target Time</div>
          <div className="text-sm font-mono font-bold text-emerald-700">
            {patientCase.target_minutes} min{" "}
            <span className="text-[10px] text-slate-400 font-normal">
              (vs {patientCase.baseline_minutes}m manual)
            </span>
          </div>
        </div>
      </div>

      {/* Chronological Event Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center py-10">
            <div className="w-10 h-10 rounded-full bg-slate-200/60 flex items-center justify-center text-slate-400 mb-2">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-slate-600 font-medium text-xs">No clinical events match current filters</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Toggle category filters or clear freshness badge filters.</div>
          </div>
        ) : (
          filteredEvents.map(event => {
            const isSelected = selectedEventId === event.id;
            const cat = event.event_type.toLowerCase();
            const meta = CATEGORY_META[cat] || { color: "#475569", bg: "#f1f5f9" };
            const isSuperseded = event.evidence_state === "superseded";

            return (
              <div
                key={event.id}
                className={`relative flex gap-3 group transition-all duration-150 ${
                  isSuperseded ? "opacity-65" : "opacity-100"
                }`}
              >
                {/* Timeline Axis Node */}
                <div className="flex flex-col items-center flex-shrink-0 w-6">
                  <div
                    className="w-3 h-3 rounded-full mt-3.5 transition-all"
                    style={{
                      backgroundColor: isSelected ? meta.color : "#cbd5e1",
                      border: `2px solid ${meta.color}`,
                      boxShadow: isSelected ? `0 0 8px ${meta.color}60` : "none",
                    }}
                  />
                  <div className="flex-1 w-px bg-slate-200 min-h-6" />
                </div>

                {/* Card Container */}
                <div
                  onClick={() => onSelectEvent(isSelected ? null : event.id)}
                  className={`flex-1 rounded-xl p-3.5 transition-all border cursor-pointer ${
                    isSelected
                      ? "bg-white border-blue-400 shadow-md ring-2 ring-blue-400/20"
                      : "bg-white hover:border-slate-300 border-slate-200 shadow-2xs"
                  }`}
                  style={{ borderLeftWidth: 4, borderLeftColor: meta.color }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-[10px] font-mono uppercase font-bold tracking-wider"
                        style={{ color: meta.color }}
                      >
                        {event.event_type.toUpperCase()} · {event.subtype}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <FreshnessIndicator badge={event.freshness_badge} />
                    </div>
                  </div>

                  <h3 className={`text-sm font-bold text-slate-800 leading-snug mb-1 ${isSuperseded ? "line-through text-slate-500" : ""}`}>
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {event.summary}
                  </p>

                  {/* Metadata and Drill-down Button */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>Date: {new Date(event.result_date).toLocaleDateString("en-GB")}</span>
                      {event.report_id && <span>Ref: {event.report_id}</span>}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDrillDown(event);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors flex items-center gap-1 font-sans font-medium"
                    >
                      <span>Inspect Report</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* End of Timeline */}
        <div className="flex items-center gap-3 pt-2 text-[10px] font-mono text-slate-400">
          <div className="w-6 flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400" />
          </div>
          <span className="uppercase tracking-widest">End of Longitudinal Evidence · Case Status Active</span>
        </div>
      </div>
    </main>
  );
}
