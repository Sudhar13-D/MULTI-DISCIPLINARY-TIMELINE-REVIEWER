import React from "react";
import { Patient, Category, RoleId, TimelineEvent } from "../../types";
import { CAT } from "../../data/patients";
import { CatIcon } from "../common/Icons";
import EventCard from "./EventCard";

interface TimelineViewProps {
  patient: Patient;
  selectedRole: RoleId;
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  activeCategories: Category[];
  onToggleCategory: (cat: Category) => void;
  filteredEvents: TimelineEvent[];
}

export default function TimelineView({
  patient,
  selectedRole,
  selectedEventId,
  onSelectEvent,
  activeCategories,
  onToggleCategory,
  filteredEvents,
}: TimelineViewProps) {
  const roleVisibleEvents = patient.events.filter(e => e.visibleTo.includes(selectedRole));
  const hiddenCount = patient.events.filter(
    e => e.visibleTo.includes(selectedRole) && !activeCategories.includes(e.category)
  ).length;

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100/60 min-w-0">
      {/* Category filter bar */}
      <div className="flex items-center gap-2.5 px-4 py-2 flex-shrink-0 bg-white border-b border-slate-200 overflow-x-auto">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">Filter</span>
        <div className="flex items-center gap-1.5">
          {(["imaging", "pathology", "molecular", "review"] as Category[]).map(cat => {
            const active = activeCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => onToggleCategory(cat)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-100 cursor-pointer whitespace-nowrap"
                style={{
                  background: active ? CAT[cat].dim : "#f8fafc",
                  border: `1px solid ${active ? CAT[cat].color + "50" : "#e2e8f0"}`,
                  color: active ? CAT[cat].color : "#94a3b8",
                }}
              >
                <CatIcon category={cat} size={11} />
                {CAT[cat].label}
              </button>
            );
          })}
        </div>

        {hiddenCount > 0 && (
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            {hiddenCount} filtered
          </span>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
            {filteredEvents.length} of {roleVisibleEvents.length} events
          </span>
        </div>
      </div>

      {/* Patient journey header */}
      <div className="px-4 py-3 flex-shrink-0 bg-white border-b border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-[11px] text-slate-400 font-medium">{patient.id}</span>
              <span className="text-[10px] text-slate-300">·</span>
              <span className="text-[11px] text-slate-500 font-medium">
                {patient.initials}, {patient.age}y {patient.sex}
              </span>
            </div>
            <div className="text-base font-semibold text-slate-900 font-display">
              {patient.primaryDx}
            </div>
          </div>

          <div className="flex items-center gap-4 text-right flex-shrink-0">
            <div>
              <div className="font-mono text-lg text-emerald-700 font-bold">{patient.completeCount}</div>
              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Complete</div>
            </div>
            <div>
              <div className="font-mono text-lg text-amber-700 font-bold">{patient.pendingCount}</div>
              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Pending</div>
            </div>
            <div>
              <div className="font-mono text-lg text-red-600 font-bold">
                {patient.events.filter(e => ["stale", "missing", "conflict"].includes(e.status)).length}
              </div>
              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Issues</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chronological Events list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-400 mb-2">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-slate-600 font-medium text-sm mb-1">No events visible</div>
            <div className="text-slate-400 text-xs max-w-xs">
              Adjust category filters or switch role to see clinical events for this patient.
            </div>
          </div>
        ) : (
          <div>
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                selected={selectedEventId === event.id}
                onClick={() => onSelectEvent(selectedEventId === event.id ? null : event.id)}
              />
            ))}

            {/* End marker */}
            <div className="flex items-center gap-3 mt-3 ml-0">
              <div className="w-6 flex justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400" />
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                End of timeline · Latest clinical state
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
