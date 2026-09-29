import React from "react";
import { PatientCase, RoleId } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  cases: PatientCase[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  onOpenLoginModal: () => void;
  onOpenAuditLog: () => void;
  onOpenUploadModal: () => void;
  onOpenDecisionForm: () => void;
  onOpenUsabilityModal?: () => void;
  unreadNotificationCount: number;
}

export default function Header({
  cases,
  selectedCaseId,
  onSelectCase,
  onOpenLoginModal,
  onOpenAuditLog,
  onOpenUploadModal,
  onOpenDecisionForm,
  onOpenUsabilityModal,
  unreadNotificationCount,
}: HeaderProps) {
  const { user, logout } = useAuth();

  const getUrgencyBadge = (urgency: string) => {
    if (urgency === "urgent" || urgency === "critical") {
      return "bg-red-500/20 text-red-300 border-red-400/40";
    }
    return "bg-slate-700/60 text-slate-300 border-slate-600/40";
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "chair":
        return "bg-purple-500/25 text-purple-200 border-purple-400/50";
      case "coordinator":
        return "bg-blue-500/25 text-blue-200 border-blue-400/50";
      case "radiologist":
        return "bg-emerald-500/25 text-emerald-200 border-emerald-400/50";
      case "pathologist":
        return "bg-teal-500/25 text-teal-200 border-teal-400/50";
      case "molecular":
        return "bg-indigo-500/25 text-indigo-200 border-indigo-400/50";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  const isAuthorizedForDecisions = user?.role === "chair" || user?.role === "coordinator";

  return (
    <header className="flex items-center gap-3 px-3 h-12 flex-shrink-0 select-none bg-[#1e3a5f] border-b border-[#16304f] text-white">
      {/* Brand logo & title */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-white/15">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#7dd3fc" strokeWidth="1.5" />
            <circle cx="8" cy="8" r="2.5" fill="#7dd3fc" />
            <path d="M8 2v2M8 12v2M2 8h2M12 8h2" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight font-display text-sky-200">
            MDT
          </span>
          <span className="text-xs font-medium ml-1.5 text-slate-300 hidden sm:inline">
            Evidence Timeline System
          </span>
          <span className="text-[9px] font-mono ml-1.5 text-white/40 hidden lg:inline">
            SAFETY-CRITICAL V2.0
          </span>
        </div>
      </div>

      <div className="h-4 w-px mx-1 bg-white/20 flex-shrink-0" />

      {/* Case Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[42vw]">
        {cases.map(c => {
          const isSelected = c.id === selectedCaseId;
          const urgencyCls = getUrgencyBadge(c.urgency);
          return (
            <button
              key={c.id}
              onClick={() => onSelectCase(c.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-white/20 border border-white/30 text-white font-medium shadow-xs"
                  : "bg-white/5 hover:bg-white/10 text-white/60 border border-transparent"
              }`}
            >
              <span className="font-mono text-[11px]">Case {c.id}</span>
              <span className={`text-[8px] font-mono px-1 py-0.2 rounded border ${urgencyCls}`}>
                {c.urgency.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Upload Scan / Doc */}
        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 transition-colors cursor-pointer"
          title="Upload external report or scan"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v9M4 6l4-4 4 4M2 13h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline text-[11px]">Attach Scan</span>
        </button>

        {/* Audit Log Drawer Button */}
        <button
          onClick={onOpenAuditLog}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 transition-colors cursor-pointer"
          title="View full clinical governance audit log"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M3 3h10M3 8h7M3 13h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline text-[11px]">Audit Log</span>
        </button>

        {/* Usability & SUS Evaluation Rubric Button */}
        {onOpenUsabilityModal && (
          <button
            onClick={onOpenUsabilityModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-purple-500/25 hover:bg-purple-500/40 border border-purple-400/40 text-purple-200 transition-colors cursor-pointer"
            title="Open System Usability Scale (SUS) & Clinical Validation Rubric"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 2l2 4 4.5.5-3.25 3.5.75 4.5L8 12.25 4 14.5l.75-4.5L1.5 6.5 6 6l2-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline text-[11px] font-semibold">SUS Rubric</span>
          </button>
        )}

        {/* Binding Decision Button */}
        <button
          onClick={onOpenDecisionForm}
          className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
            isAuthorizedForDecisions
              ? "bg-indigo-500 hover:bg-indigo-600 text-white border border-indigo-400"
              : "bg-slate-700/80 text-white/60 hover:bg-slate-600 border border-slate-600"
          }`}
          title={
            isAuthorizedForDecisions
              ? "Submit binding MDT consensus decision"
              : "Decision restricted to MDT Chair or Coordinator (Attempts will test server 403 Forbidden)"
          }
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>MDT Decision</span>
        </button>

        <div className="h-4 w-px mx-1 bg-white/20" />

        {/* Authenticated User Profile & Role Switcher */}
        <div
          onClick={onOpenLoginModal}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 cursor-pointer transition-all"
          title="Click to switch clinical role or sign out"
        >
          <div className="w-5 h-5 rounded-full bg-blue-400 text-[#1e3a5f] font-bold text-[10px] flex items-center justify-center">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-[11px] font-semibold leading-tight text-white flex items-center gap-1.5">
              <span>{user?.full_name || "Guest"}</span>
              <span className={`text-[8px] font-mono px-1 py-0.2 rounded border uppercase font-bold ${getRoleBadgeColor(user?.role)}`}>
                {user?.role || "GUEST"}
              </span>
            </div>
            <div className="text-[9px] text-white/50 leading-tight">Switch Persona ▾</div>
          </div>
        </div>
      </div>
    </header>
  );
}
