import React, { useState, useEffect } from "react";
import { AuditLogEntry } from "../../types";
import { fetchAuditLogsApi } from "../../services/api";

interface AuditLogDrawerProps {
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditLogDrawer({ caseId, isOpen, onClose }: AuditLogDrawerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuditLogsApi(caseId);
      setLogs(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, caseId]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    if (statusFilter !== "ALL" && log.status !== statusFilter) return false;
    if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
    return true;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold uppercase">
                Regulatory Audit Trail
              </span>
              <span className="text-xs text-slate-500 font-mono">Case: {caseId}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Clinical Governance & Audit Log</h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Immutable server-side event logs, access tracking, and security rejections.
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={loadLogs}
              title="Refresh logs"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c2.5 0 4.5 1.5 5.2 3.5M13.5 2.5v3.5h-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-[10px] uppercase text-slate-400 font-semibold">Filter:</span>
          
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-1 border border-slate-300 rounded text-xs bg-slate-50 font-medium"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SUCCESS">SUCCESS Only</option>
            <option value="REJECTED">REJECTED (403 Forbidden)</option>
          </select>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="p-1 border border-slate-300 rounded text-xs bg-slate-50 font-medium max-w-[180px] truncate"
          >
            <option value="ALL">All Event Types</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <div className="flex-1 text-right text-[10px] font-mono text-slate-400">
            {filteredLogs.length} events
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400 text-xs">Loading audit trail...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">No audit events match filters.</div>
          ) : (
            filteredLogs.map(log => {
              const isRejection = log.status === "REJECTED";
              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border transition-all text-xs ${
                    isRejection
                      ? "bg-red-50/90 border-red-300 shadow-xs"
                      : log.action === "DECISION_SUBMITTED"
                      ? "bg-indigo-50/80 border-indigo-200 shadow-xs"
                      : "bg-slate-50/70 border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          isRejection
                            ? "bg-red-200 text-red-800 border-red-300"
                            : log.status === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-slate-200 text-slate-700 border-slate-300"
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-800">
                        {log.action}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-slate-700 leading-snug mb-2 font-normal">{log.details}</p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-600 font-medium">
                      User: {log.user_email} ({log.user_role.toUpperCase()})
                    </span>
                    <span>IP: {log.ip_address || "127.0.0.1"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Cryptographically chained audit records</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded text-xs transition-colors cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}
