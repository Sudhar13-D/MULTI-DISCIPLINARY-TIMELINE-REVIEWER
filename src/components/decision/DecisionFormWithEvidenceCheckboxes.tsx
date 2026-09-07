import React, { useState } from "react";
import { TimelineEvent, PatientCase } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { submitDecisionApi } from "../../services/api";

interface DecisionFormProps {
  patientCase: PatientCase;
  timelineEvents: TimelineEvent[];
  initialReviewedIds?: string[];
  onClose: () => void;
  onDecisionSubmitted: () => void;
}

const TREATMENT_PATHWAYS = [
  "Curative Surgical Resection",
  "Neoadjuvant Chemotherapy / Radiotherapy",
  "Concurrent Chemo-Radiation",
  "Targeted Molecular Therapy",
  "Therapeutic Anticoagulation (PE Protocol)",
  "Active Surveillance / Interval Imaging",
  "Palliative & Supportive Care",
];

const CONSENSUS_LEVELS = ["Unanimous", "Majority Consensus", "Conditional on Biomarker"];

export default function DecisionFormWithEvidenceCheckboxes({
  patientCase,
  timelineEvents,
  initialReviewedIds = [],
  onClose,
  onDecisionSubmitted,
}: DecisionFormProps) {
  const { user } = useAuth();
  const [pathway, setPathway] = useState(TREATMENT_PATHWAYS[0]);
  const [consensus, setConsensus] = useState(CONSENSUS_LEVELS[0]);
  const [decisionText, setDecisionText] = useState("");
  const [contingency, setContingency] = useState("");
  const [reviewedIds, setReviewedIds] = useState<string[]>(
    initialReviewedIds.length > 0 ? initialReviewedIds : timelineEvents.map(e => e.id)
  );
  const [staleRiskAcknowledged, setStaleRiskAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState(false);

  // Check if any reviewed event is stale
  const reviewedEvents = timelineEvents.filter(e => reviewedIds.includes(e.id));
  const hasStaleEvidence = reviewedEvents.some(
    e => e.evidence_state === "stale" || e.freshness_badge.state === "stale"
  );

  const toggleEventCheck = (id: string) => {
    setReviewedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!decisionText.trim()) {
      setServerError("Please provide the clinical rationale and MDT discussion summary.");
      return;
    }

    if (hasStaleEvidence && !staleRiskAcknowledged) {
      setServerError("Mandatory clinical safety check: Stale evidence is included in this review. You must acknowledge the stale data risk before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitDecisionApi({
        case_id: patientCase.id,
        decision_text: decisionText,
        treatment_pathway: pathway,
        consensus_level: consensus,
        contingency_action: contingency || undefined,
        evidence_reviewed: reviewedIds,
        stale_risk_acknowledged: staleRiskAcknowledged,
      });

      setServerSuccess(true);
      setTimeout(() => {
        onDecisionSubmitted();
        onClose();
      }, 1200);
    } catch (err: any) {
      // Real server-side rejection (e.g. 403 Forbidden for Radiologists/Pathologists)
      setServerError(err.message || "Failed to submit decision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                BINDING DECISION FORM
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Case: {patientCase.patient_de_id}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Submit Multidisciplinary Team (MDT) Decision
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Signing Clinician: <span className="font-semibold text-slate-800">{user?.full_name}</span> ({user?.role.toUpperCase()})
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {/* Server Error Alert (Displays 403 Forbidden Rejections) */}
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs flex items-start gap-2 animate-in shake">
              <span className="text-red-600 font-bold text-sm">⚠</span>
              <div className="flex-1">
                <div className="font-bold text-[11px] uppercase tracking-wider text-red-900">
                  Submission Rejected by Server
                </div>
                <div className="mt-0.5">{serverError}</div>
              </div>
            </div>
          )}

          {/* Server Success Alert */}
          {serverSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <span className="text-emerald-600 font-bold text-sm">✓</span>
              <div className="font-semibold">
                Binding MDT Decision recorded and locked in audit trail! Updating case...
              </div>
            </div>
          )}

          {/* Treatment Pathway & Consensus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Recommended Treatment Pathway *
              </label>
              <select
                value={pathway}
                onChange={e => setPathway(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {TREATMENT_PATHWAYS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                MDT Consensus Level *
              </label>
              <select
                value={consensus}
                onChange={e => setConsensus(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {CONSENSUS_LEVELS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Decision Rationale Textarea */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Clinical Rationale & Consensus Summary *
            </label>
            <textarea
              rows={3}
              value={decisionText}
              onChange={e => setDecisionText(e.target.value)}
              placeholder="Detail the clinical discussion, radiological-pathological correlation, and recommended plan..."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-normal"
              required
            />
          </div>

          {/* Contingency Conditions */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Contingency & Actionable Conditions (Optional)
            </label>
            <input
              type="text"
              value={contingency}
              onChange={e => setContingency(e.target.value)}
              placeholder="e.g. 'If molecular NGS reveals EGFR exon 19 del, start Osimertinib; otherwise initiate chemo-RT'"
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Evidence Reviewed Checkboxes (Auto-filled) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">
                Evidence Reviewed by MDT Panel ({reviewedIds.length} of {timelineEvents.length} selected)
              </label>
              <span className="text-[10px] text-slate-400">Checked items are recorded in the audit trail</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 p-2.5 rounded-lg bg-slate-50/50">
              {timelineEvents.map(ev => {
                const checked = reviewedIds.includes(ev.id);
                const isStale = ev.freshness_badge.state === "stale";
                return (
                  <label
                    key={ev.id}
                    className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                      checked ? "bg-white border border-slate-200 shadow-2xs" : "opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEventCheck(ev.id)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-slate-800 truncate">{ev.title}</span>
                        <span className="font-mono text-[9px] text-slate-400">{ev.subtype}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{ev.summary}</div>
                    </div>
                    {isStale && (
                      <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1 rounded flex-shrink-0">
                        STALE ⚠
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Mandatory Stale Data Acknowledgment Checkbox */}
          {hasStaleEvidence && (
            <div className="p-3 bg-red-50/90 border border-red-200 rounded-lg space-y-1.5">
              <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚠</span>
                <span>Mandatory Clinical Governance Check</span>
              </div>
              <p className="text-[11px] text-red-700 leading-snug">
                One or more evidence items selected in this review are flagged as STALE. Proceeding with stale data requires explicit clinical risk acknowledgment.
              </p>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={staleRiskAcknowledged}
                  onChange={e => setStaleRiskAcknowledged(e.target.checked)}
                  className="rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <span className="font-semibold text-xs text-red-900">
                  I explicitly acknowledge that stale evidence is included and clinical contingencies are in place.
                </span>
              </label>
            </div>
          )}

          {/* Buttons */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between -mx-5 -mb-5 mt-4">
            <span className="text-[10px] text-slate-400">
              Only MDT Chair or Coordinator role is authorized to lock binding decisions.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Verifying & Signing..." : "Submit Binding Decision"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
