import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { submitUsabilityFeedbackApi } from "../../services/api";

interface UsabilityEvaluationModalProps {
  onClose: () => void;
}

const SUS_QUESTIONS = [
  { id: "q1_frequently_use", text: "1. I think that I would like to use this system frequently." },
  { id: "q2_complex", text: "2. I found the system unnecessarily complex." },
  { id: "q3_easy_to_use", text: "3. I thought the system was easy to use." },
  { id: "q4_need_support", text: "4. I think that I would need the support of a technical person to be able to use this system." },
  { id: "q5_well_integrated", text: "5. I found the various functions in this system were well integrated." },
  { id: "q6_inconsistency", text: "6. I thought there was too much inconsistency in this system." },
  { id: "q7_learn_quickly", text: "7. I would imagine that most people would learn to use this system very quickly." },
  { id: "q8_cumbersome", text: "8. I found the system very cumbersome to use." },
  { id: "q9_confident", text: "9. I felt very confident using the system." },
  { id: "q10_learn_a_lot", text: "10. I needed to learn a lot of things before I could get going with this system." },
];

const CLINICAL_TASKS = [
  { id: "task1_case_intake_and_freshness", title: "Task 1: Case Intake & Freshness Triage", desc: "Checking staleness badges and missing scans" },
  { id: "task2_external_scan_ingestion", title: "Task 2: External Scan Ingestion", desc: "Attaching regional DICOM studies with preamble verification" },
  { id: "task3_specimen_lineage_trace", title: "Task 3: Specimen Lineage & Molecular Supersession", desc: "Tracing tissue block lineage and identifying superseded assays" },
  { id: "task4_decision_recording", title: "Task 4: MDT Consensus Decision Recording", desc: "Form completion, citing evidence, and acknowledging stale risks" },
  { id: "task5_audit_trail_inspection", title: "Task 5: Governance Audit Trail Inspection", desc: "Reviewing immutable time-stamped actions and security rejections" },
];

export default function UsabilityEvaluationModal({ onClose }: UsabilityEvaluationModalProps) {
  const { user } = useAuth();

  // Initialize SUS answers with standard benchmark baseline
  const [susAnswers, setSusAnswers] = useState<Record<string, number>>({
    q1_frequently_use: 5,
    q2_complex: 1,
    q3_easy_to_use: 5,
    q4_need_support: 1,
    q5_well_integrated: 5,
    q6_inconsistency: 1,
    q7_learn_quickly: 5,
    q8_cumbersome: 1,
    q9_confident: 5,
    q10_learn_a_lot: 1,
  });

  const [taskRatings, setTaskRatings] = useState<Record<string, number>>({
    task1_case_intake_and_freshness: 7,
    task2_external_scan_ingestion: 7,
    task3_specimen_lineage_trace: 7,
    task4_decision_recording: 7,
    task5_audit_trail_inspection: 7,
  });

  const [qualitativeNotes, setQualitativeNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute live SUS score
  const calculateScore = () => {
    const odd = (
      (susAnswers.q1_frequently_use - 1) +
      (susAnswers.q3_easy_to_use - 1) +
      (susAnswers.q5_well_integrated - 1) +
      (susAnswers.q7_learn_quickly - 1) +
      (susAnswers.q9_confident - 1)
    );
    const even = (
      (5 - susAnswers.q2_complex) +
      (5 - susAnswers.q4_need_support) +
      (5 - susAnswers.q6_inconsistency) +
      (5 - susAnswers.q8_cumbersome) +
      (5 - susAnswers.q10_learn_a_lot)
    );
    return Math.round((odd + even) * 2.5 * 10) / 10;
  };

  const currentScore = calculateScore();

  const getGradeInfo = (score: number) => {
    if (score >= 84.1) return { grade: "A+", label: "Best Imaginable", color: "bg-emerald-600 text-white" };
    if (score >= 80.3) return { grade: "A", label: "Excellent", color: "bg-green-600 text-white" };
    if (score >= 74.0) return { grade: "B", label: "Good", color: "bg-blue-600 text-white" };
    if (score >= 68.0) return { grade: "C", label: "OK (Average)", color: "bg-amber-600 text-white" };
    return { grade: "D", label: "Below Target", color: "bg-red-600 text-white" };
  };

  const gradeInfo = getGradeInfo(currentScore);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await submitUsabilityFeedbackApi({
        sus_answers: susAnswers,
        task_ratings: taskRatings,
        qualitative_feedback: qualitativeNotes,
        clinical_role: user?.role || "clinician",
      });
      setSubmittedResult(res);
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/90 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold uppercase">
                Stage 2 Validation Rubric
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold uppercase">
                Role: {user?.role?.toUpperCase() || "CLINICIAN"}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              System Usability Scale (SUS) & Task Rubric
            </h2>
            <div className="text-slate-500 text-xs mt-0.5">
              Standardized 10-Item SUS Instrument & Clinical Workflow Task Ease Evaluation
            </div>
          </div>

          {/* Live Score Display Badge */}
          <div className="text-right flex flex-col items-end">
            <div className={`px-3 py-1 rounded-lg font-bold text-sm shadow-xs ${gradeInfo.color}`}>
              Score: {currentScore} / 100 ({gradeInfo.grade})
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1">
              {gradeInfo.label} (Sauro-Lewis)
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-800 flex items-center gap-2">
              <span className="font-bold">⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {submittedResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 flex items-center gap-2">
              <span className="font-bold">✓</span>
              <span>{submittedResult.message} Closing...</span>
            </div>
          )}

          {/* Section 1: SUS 10 Questions */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                1. System Usability Scale (SUS) Questions
              </h3>
              <span className="text-[10px] text-slate-500">1 = Strongly Disagree, 5 = Strongly Agree</span>
            </div>

            <div className="space-y-3">
              {SUS_QUESTIONS.map(q => (
                <div key={q.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-slate-700 font-medium leading-relaxed max-w-lg">{q.text}</span>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map(val => (
                      <label key={val} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={q.id}
                          value={val}
                          checked={susAnswers[q.id] === val}
                          onChange={() => setSusAnswers(prev => ({ ...prev, [q.id]: val }))}
                          className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-mono text-slate-600">{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Clinical Task-Based Ease Ratings (SEQ 1-7) */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                2. Clinical Task Performance & Single Ease Question (SEQ)
              </h3>
              <span className="text-[10px] text-slate-500">1 = Very Difficult, 7 = Very Easy</span>
            </div>

            <div className="space-y-2.5">
              {CLINICAL_TASKS.map(t => (
                <div key={t.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-800">{t.title}</div>
                    <div className="text-[10px] text-slate-500">{t.desc}</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {[1, 2, 3, 4, 5, 6, 7].map(val => (
                      <label key={val} className="flex items-center gap-0.5 cursor-pointer">
                        <input
                          type="radio"
                          name={t.id}
                          value={val}
                          checked={taskRatings[t.id] === val}
                          onChange={() => setTaskRatings(prev => ({ ...prev, [t.id]: val }))}
                          className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-600">{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Qualitative Feedback */}
          <div>
            <label className="block font-bold text-slate-800 text-sm mb-1">
              3. Qualitative Clinician Feedback & Suggestions
            </label>
            <div className="text-[10px] text-slate-500 mb-2">
              Observations regarding diagnostic trust, freshness badges, specimen lineage, or decision guardrails.
            </div>
            <textarea
              rows={3}
              value={qualitativeNotes}
              onChange={e => setQualitativeNotes(e.target.value)}
              placeholder="e.g. Freshness indicators gave our team strong confidence to avoid repeat CT scans. The mandatory acknowledgment in Case 005 prevented risky oversight..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans text-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Recording Evaluation..." : `Submit Evaluation (SUS ${currentScore})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
