import React from "react";
import { TimelineEvent } from "../../types";
import FreshnessIndicator from "../evidence/FreshnessIndicator";

interface DetailPanelProps {
  event: TimelineEvent | null;
  width: number;
  onClose: () => void;
  onOpenDrillDown: (event: TimelineEvent) => void;
  onOpenDecisionForm: () => void;
}

export default function DetailPanel({
  event,
  width,
  onClose,
  onOpenDrillDown,
  onOpenDecisionForm,
}: DetailPanelProps) {
  if (width === 0) return null;

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full overflow-hidden bg-white border-l border-slate-200 text-xs select-none"
      style={{ width }}
    >
      {event ? (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <FreshnessIndicator badge={event.freshness_badge} />
                <span className="font-mono text-[10px] text-slate-400 uppercase">
                  {event.subtype}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 leading-snug">{event.title}</h2>
              <div className="font-mono text-[10px] text-slate-500 mt-1">
                {event.report_id || "Unassigned"} · {new Date(event.result_date).toLocaleDateString("en-GB")}
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2 2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Clinical Summary */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold mb-1">
                Executive Findings
              </div>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                {event.summary}
              </p>
            </div>

            {/* Drill Down Action Card */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1.5">
              <div className="font-semibold text-blue-900 text-xs">Diagnostic Report & Lineage</div>
              <p className="text-blue-700 text-[11px] leading-relaxed">
                Access full unedited text report, DICOM acquisition metadata, and specimen chain-of-custody.
              </p>
              <button
                type="button"
                onClick={() => onOpenDrillDown(event)}
                className="w-full mt-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition-colors cursor-pointer"
              >
                Inspect Full Report & Metadata →
              </button>
            </div>

            {/* Regulatory Metadata */}
            <div className="space-y-2 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Freshness SLA:</span>
                <span className="font-mono text-slate-700">{event.freshness_threshold_days} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Received in System:</span>
                <span className="font-mono text-slate-700">{new Date(event.received_date).toLocaleDateString("en-GB")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Evidence State:</span>
                <span className="font-mono font-bold text-slate-700 uppercase">{event.evidence_state}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/80 space-y-2">
            <button
              type="button"
              onClick={onOpenDecisionForm}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-xs text-xs transition-colors cursor-pointer"
            >
              Submit Binding MDT Decision
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400 border border-slate-200">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-sm font-bold text-slate-700 mb-1">Select an Evidence Study</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Click any timeline study to review findings, freshness indicators, and diagnostic reports.
          </p>
        </div>
      )}
    </aside>
  );
}
