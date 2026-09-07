import React, { useState } from "react";
import { PatientCase, TimelineEvent } from "../../types";
import SpecimenTreeView from "../specimen/SpecimenTreeView";

interface PatientSidebarProps {
  patientCase: PatientCase;
  timelineEvents: TimelineEvent[];
  width: number;
  onSelectEvent?: (id: string) => void;
}

export default function PatientSidebar({
  patientCase,
  timelineEvents,
  width,
}: PatientSidebarProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "specimens">("summary");

  if (width === 0) return null;

  const reduction = Math.round(
    ((patientCase.baseline_minutes - patientCase.target_minutes) / patientCase.baseline_minutes) * 100
  );

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full overflow-hidden bg-white border-r border-slate-200 select-none text-xs"
      style={{ width }}
    >
      {/* Patient Header Card */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-xs font-bold text-slate-900">{patientCase.patient_de_id}</span>
          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 border border-red-200 font-bold uppercase">
            {patientCase.urgency}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-medium mb-0.5">
          {patientCase.age}y {patientCase.sex} · Ref: {patientCase.referring_dept}
        </div>
        <div className="font-semibold text-slate-800 leading-tight">{patientCase.primary_dx}</div>
      </div>

      {/* Tabs: Summary vs Specimen Lineage Tree */}
      <div className="flex border-b border-slate-200 bg-slate-100/60 p-1 gap-1">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 py-1 rounded text-center font-medium transition-colors cursor-pointer ${
            activeTab === "summary"
              ? "bg-white text-slate-900 shadow-2xs font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Case Overview
        </button>
        <button
          onClick={() => setActiveTab("specimens")}
          className={`flex-1 py-1 rounded text-center font-medium transition-colors cursor-pointer ${
            activeTab === "specimens"
              ? "bg-white text-slate-900 shadow-2xs font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Specimen Tree
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === "summary" ? (
          <>
            {/* Action Banner */}
            <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200">
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-bold mb-0.5">
                Current Status
              </div>
              <div className="text-[11px] text-amber-900 font-medium">
                {patientCase.next_action || "Awaiting MDT Review & Decision"}
              </div>
            </div>

            {/* Evidence Distribution */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold mb-1.5">
                Studies Ingested
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                {["imaging", "pathology", "molecular", "review"].map(cat => {
                  const count = timelineEvents.filter(e => e.event_type.toLowerCase() === cat).length;
                  return (
                    <div key={cat} className="p-2 rounded bg-slate-50 border border-slate-200">
                      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                        {cat}
                      </div>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time-Motion Improvement Gauge */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                Assembly Efficiency Gain
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Manual Assembly:</span>
                <span className="font-mono text-red-600 font-bold">{patientCase.baseline_minutes} min</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Automated Timeline:</span>
                <span className="font-mono text-emerald-700 font-bold">{patientCase.target_minutes} min</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${(patientCase.target_minutes / patientCase.baseline_minutes) * 100}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-emerald-700 font-bold text-right">
                {reduction}% Time Reduction
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold mb-1.5">
              Specimen Lineage Hierarchy
            </div>
            <SpecimenTreeView caseId={patientCase.id} />
          </div>
        )}
      </div>
    </aside>
  );
}
