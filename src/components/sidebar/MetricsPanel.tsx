import React from "react";
import { Patient } from "../../types";

interface MetricsPanelProps {
  patient: Patient;
}

export default function MetricsPanel({ patient }: MetricsPanelProps) {
  const reduction = Math.round((1 - patient.targetMinutes / patient.baselineMinutes) * 100);

  return (
    <div className="p-3 border-t bg-slate-50/50 border-slate-200">
      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3">Case Assembly Time</div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-500">Baseline (manual)</span>
          <span className="font-mono text-[11px] text-red-600 font-semibold">{patient.baselineMinutes} min</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-500">Target (timeline)</span>
          <span className="font-mono text-[11px] text-emerald-700 font-semibold">{patient.targetMinutes} min</span>
        </div>
        <div className="relative h-2 rounded-full overflow-hidden bg-slate-200">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 bg-emerald-600"
            style={{ width: `${(patient.targetMinutes / patient.baselineMinutes) * 100}%` }}
          />
        </div>
        <div className="text-[11px] text-emerald-700 font-mono font-medium text-right">{reduction}% reduction</div>
      </div>
    </div>
  );
}
