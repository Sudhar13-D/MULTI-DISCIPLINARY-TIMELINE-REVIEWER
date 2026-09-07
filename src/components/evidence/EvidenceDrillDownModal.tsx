import React from "react";
import { TimelineEvent } from "../../types";
import FreshnessIndicator from "./FreshnessIndicator";

interface EvidenceDrillDownModalProps {
  event: TimelineEvent | null;
  onClose: () => void;
  onAcknowledgeStale?: (eventId: string) => void;
}

export default function EvidenceDrillDownModal({
  event,
  onClose,
  onAcknowledgeStale,
}: EvidenceDrillDownModalProps) {
  if (!event) return null;

  const isStale = event.freshness_badge.state === "stale";
  const isPreliminary = event.freshness_badge.state === "preliminary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FreshnessIndicator badge={event.freshness_badge} />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                {event.event_type} · {event.subtype}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900">{event.title}</h2>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              Accession / Report ID: {event.report_id || "N/A"} · Generated: {new Date(event.result_date).toLocaleDateString("en-GB")}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700">
          {/* Stale or Preliminary Warning Banner */}
          {isStale && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
              <span className="text-red-600 text-sm mt-0.5">⚠</span>
              <div className="flex-1">
                <div className="font-semibold text-red-800 uppercase tracking-wider text-[10px]">
                  Clinical Staleness Alert
                </div>
                <div className="text-red-700 text-xs mt-0.5">
                  This report was generated {event.freshness_badge.age_days} days ago, which exceeds the clinical threshold ({event.freshness_threshold_days} days). Reliance on stale imaging/histology carries a risk of outdated anatomical staging.
                </div>
                {onAcknowledgeStale && (
                  <button
                    onClick={() => onAcknowledgeStale(event.id)}
                    className="mt-2 text-[11px] bg-red-600 hover:bg-red-700 text-white font-medium px-2.5 py-1 rounded transition-colors"
                  >
                    Acknowledge Stale Risk & Record in Audit
                  </button>
                )}
              </div>
            </div>
          )}

          {isPreliminary && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
              <span className="text-amber-600 text-sm mt-0.5">⚠</span>
              <div>
                <div className="font-semibold text-amber-800 uppercase tracking-wider text-[10px]">
                  Preliminary Unverified Assay
                </div>
                <div className="text-amber-700 text-xs mt-0.5">
                  This assay is marked preliminary by the laboratory. Final consultant sign-off is pending.
                </div>
              </div>
            </div>
          )}

          {/* Clinical Summary */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold mb-1">
              Executive Summary
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
              {event.summary}
            </div>
          </div>

          {/* Full Unedited Report / Metadata */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold mb-1">
              Full Diagnostic Report & Methodology
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {event.full_report || "No additional text report attached."}
            </pre>
          </div>

          {/* Verification & Audit Details */}
          <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Freshness Threshold:</span>
              <span className="font-mono text-slate-700">{event.freshness_threshold_days} days</span>
            </div>
            <div className="flex justify-between">
              <span>PACS/LIS Reception Date:</span>
              <span className="font-mono text-slate-700">{new Date(event.received_date).toLocaleString("en-GB")}</span>
            </div>
            <div className="flex justify-between">
              <span>Authorized Visible Roles:</span>
              <span className="font-mono text-slate-700">{event.visible_roles.join(", ")}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Close Drill-down
          </button>
        </div>
      </div>
    </div>
  );
}
