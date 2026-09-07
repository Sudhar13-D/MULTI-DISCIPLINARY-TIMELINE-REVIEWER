import React from "react";
import { TimelineEvent } from "../../types";
import { CAT, freshnessColor, statusLabel, statusColor } from "../../data/patients";
import { CatIcon } from "../common/Icons";

export function FreshnessDot({ days, status }: { days: number; status: TimelineEvent["status"] }) {
  const color = freshnessColor(days, status);
  const isPulsing = status === "pending" || status === "stale";
  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${isPulsing ? "pulse-dot" : ""}`}
      style={{ width: 7, height: 7, background: color, marginTop: 2 }}
      title={`${days > 0 ? days + "d ago" : "today"}`}
    />
  );
}

interface EventCardProps {
  event: TimelineEvent;
  selected: boolean;
  onClick: () => void;
}

export default function EventCard({ event, selected, onClick }: EventCardProps) {
  const cat = CAT[event.category];

  return (
    <div
      className={`relative flex gap-3 cursor-pointer group transition-all duration-150 ${
        selected ? "opacity-100" : "opacity-90 hover:opacity-100"
      }`}
      onClick={onClick}
    >
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 24 }}>
        <div
          className="rounded-full flex-shrink-0 mt-4 transition-all duration-150"
          style={{
            width: 10,
            height: 10,
            background: selected ? cat.color : "#e2e8f0",
            border: `2px solid ${cat.color}`,
            boxShadow: selected ? `0 0 8px ${cat.color}60` : "none",
          }}
        />
        <div className="flex-1 w-px bg-slate-200" style={{ minHeight: 14 }} />
      </div>

      {/* Card body */}
      <div
        className="flex-1 mb-2.5 rounded-lg p-3.5 transition-all duration-150"
        style={{
          background: selected ? cat.dim : "#ffffff",
          border: `1px solid ${selected ? cat.color + "60" : "#e2e8f0"}`,
          borderLeft: `3px solid ${cat.color}`,
          boxShadow: selected ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <CatIcon category={event.category} size={13} />
            <span className="text-[10px] font-mono uppercase tracking-widest font-semibold" style={{ color: cat.color }}>
              {event.type}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <FreshnessDot days={event.freshnessDays} status={event.status} />
            <span className={`text-[10px] font-mono font-semibold ${statusColor(event.status)}`}>
              {statusLabel(event.status)}
            </span>
          </div>
        </div>

        <div className="text-sm font-semibold text-slate-800 mb-1 leading-snug">{event.title}</div>
        <div className="text-xs text-slate-500 leading-relaxed line-clamp-2">{event.summary}</div>

        {event.edgeNote && (
          <div className="mt-2 flex items-start gap-1.5 rounded px-2.5 py-1.5 bg-red-500/10 border border-red-500/20">
            <span className="text-red-500 text-[11px] mt-0.5">⚠</span>
            <span className="text-[11px] text-red-700 leading-relaxed line-clamp-1 font-medium">
              {event.edgeNote.split("—")[0]}
            </span>
          </div>
        )}

        <div className="mt-2.5 flex items-center gap-3 pt-1 border-t border-slate-100">
          <span className="font-mono text-[10px] text-slate-400 font-medium">{event.date}</span>
          {(event.reportId || event.accessionNo) && (
            <span className="font-mono text-[10px] text-slate-400">
              {event.reportId || event.accessionNo}
            </span>
          )}
          {event.requestedBy && (
            <span className="text-[10px] text-slate-400 truncate">← {event.requestedBy}</span>
          )}
        </div>
      </div>
    </div>
  );
}
